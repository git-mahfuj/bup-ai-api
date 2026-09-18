import { injectable } from "inversify";
import solver from "javascript-lp-solver";

import { ApiError } from "@/libs";
import { getSystemCustomErrorMsgByKey } from "@/events";
import type { DirectiveInterpretationEntry } from "@repo/zod";

import type { OptimizeEnergyRequest } from "@/zod";

type HourEntry = OptimizeEnergyRequest["hours"][number];
type Battery = OptimizeEnergyRequest["battery"];

export interface HourlyPlanEntry {
  hour: number;
  grid_kwh: number;
  solar_used_kwh: number;
  battery_action: "charge" | "discharge" | "idle";
  battery_kwh: number;
  battery_energy_after_kwh: number;
}

export interface OptimizationPlan {
  hourly_plan: HourlyPlanEntry[];
  total_grid_kwh: number;
  total_cost_bdt: number;
  peak_grid_kwh: number;
  plan_summary: string;
}

const EPS = 1e-6;
const round2 = (n: number) => Math.round(n * 100) / 100;

@injectable()
export class OptimizerService {
  solve(
    hours: HourEntry[],
    battery: Battery,
    directives: DirectiveInterpretationEntry[]
  ): OptimizationPlan {
    const sortedHours = [...hours].sort((a, b) => a.hour - b.hour);

    if (sortedHours.length !== 24 || sortedHours.some((h, i) => h.hour !== i)) {
      throw new ApiError(
        500,
        getSystemCustomErrorMsgByKey("OPTIMIZATION_FAILED"),
        undefined,
        [{ reason: "expected exactly 24 unique hourly entries, hours 0-23" }]
      );
    }

    // Per-hour effective parameters, derived from base scenario + applicable directives.
    const effectiveSolar = sortedHours.map((h) => h.solar_kwh);
    const minReserve = sortedHours.map(() => battery.minimum_energy_kwh);
    const noCharge = sortedHours.map(() => false);
    const noDischarge = sortedHours.map(() => false);
    const maxGrid = sortedHours.map(() => Infinity);

    const applicable = directives.filter((d) => d.applies);

    for (const d of applicable) {
      switch (d.directive_type) {
        case "solar_reduction": {
          const { hours: hrs, factor } = d.structured_adjustment as {
            hours: number[];
            factor: number;
          };
          for (const h of hrs)
            effectiveSolar[h] = sortedHours[h]!.solar_kwh * factor;
          break;
        }
        case "minimum_battery_reserve": {
          const { hours: hrs, minimum_energy_kwh } =
            d.structured_adjustment as {
              hours: number[];
              minimum_energy_kwh: number;
            };
          for (const h of hrs)
            minReserve[h] = Math.max(minReserve[h]!, minimum_energy_kwh);
          break;
        }
        case "no_charge_window": {
          const { hours: hrs } = d.structured_adjustment as { hours: number[] };
          for (const h of hrs) noCharge[h] = true;
          break;
        }
        case "no_discharge_window": {
          const { hours: hrs } = d.structured_adjustment as { hours: number[] };
          for (const h of hrs) noDischarge[h] = true;
          break;
        }
        case "max_grid_window": {
          const { hours: hrs, max_grid_kwh } = d.structured_adjustment as {
            hours: number[];
            max_grid_kwh: number;
          };
          for (const h of hrs) maxGrid[h] = Math.min(maxGrid[h]!, max_grid_kwh);
          break;
        }
        // @ts-ignore
        case "no_op":
          break;
      }
    }

    // Sanity check reserve directives don't exceed physical capacity before building the LP.
    for (let h = 0; h < 24; h++) {
      if (minReserve[h]! > battery.capacity_kwh + EPS) {
        throw new ApiError(
          422,
          getSystemCustomErrorMsgByKey("INFEASIBLE_SCENARIO"),
          undefined,

          [{ reason: `required reserve at hour ${h} exceeds battery capacity` }]
        );
      }
    }

    const model = {
      optimize: "cost",
      opType: "min" as const,
      constraints: {} as Record<
        string,
        { min?: number; max?: number; equal?: number }
      >,
      variables: {} as Record<string, Record<string, number>>,
    };

    const addVarBound = (
      varName: string,
      constraintPrefix: string,
      min: number,
      max: number
    ) => {
      if (max < Infinity) {
        const cName = `${constraintPrefix}_max`;
        model.constraints[cName] = { max };
        model.variables[varName]![cName] = 1;
      }
      if (min > EPS) {
        const cName = `${constraintPrefix}_min`;
        model.constraints[cName] = { min };
        model.variables[varName]![cName] = 1;
      }
    };

    for (let h = 0; h < 24; h++) {
      const grid = `grid_${h}`;
      const solarUsed = `solarUsed_${h}`;
      const charge = `charge_${h}`;
      const discharge = `discharge_${h}`;

      model.variables[grid] = { cost: sortedHours[h]!.tariff_bdt_per_kwh };
      model.variables[solarUsed] = { cost: 0 };
      model.variables[charge] = { cost: 0 };
      model.variables[discharge] = { cost: 0 };

      addVarBound(solarUsed, `solarUsed_${h}_bound`, 0, effectiveSolar[h]!);
      addVarBound(
        charge,
        `charge_${h}_bound`,
        0,
        noCharge[h] ? 0 : battery.max_charge_kwh_per_hour
      );
      addVarBound(
        discharge,
        `discharge_${h}_bound`,
        0,
        noDischarge[h] ? 0 : battery.max_discharge_kwh_per_hour
      );
      if (maxGrid[h]! < Infinity) {
        addVarBound(grid, `grid_${h}_bound`, 0, maxGrid[h]!);
      }

      // Energy balance: grid + solarUsed + discharge - charge = demand
      const balanceName = `balance_${h}`;
      model.constraints[balanceName] = { equal: sortedHours[h]!.demand_kwh };
      model.variables[grid][balanceName] = 1;
      model.variables[solarUsed][balanceName] = 1;
      model.variables[discharge][balanceName] = 1;
      model.variables[charge][balanceName] = -1;

      // Cumulative battery level: initial + sum(charge_0..h) - sum(discharge_0..h)
      // must stay within [minReserve[h], capacity_kwh].
      const levelName = `level_${h}`;
      model.constraints[levelName] = {
        min: minReserve[h]! - battery.initial_energy_kwh,
        max: battery.capacity_kwh - battery.initial_energy_kwh,
      };
      for (let k = 0; k <= h; k++) {
        model.variables[`charge_${k}`]![levelName] =
          (model.variables[`charge_${k}`]![levelName] ?? 0) + 1;
        model.variables[`discharge_${k}`]![levelName] =
          (model.variables[`discharge_${k}`]![levelName] ?? 0) - 1;
      }
    }

    // End-of-day neutrality: sum(charge) - sum(discharge) = 0
    const neutralityName = "end_of_day_neutrality";
    model.constraints[neutralityName] = { equal: 0 };
    for (let h = 0; h < 24; h++) {
      model.variables[`charge_${h}`]![neutralityName] = 1;
      model.variables[`discharge_${h}`]![neutralityName] = -1;
    }

    let solution;
    try {
      solution = solver.Solve(model);
    } catch (err) {
      throw new ApiError(
        500,
        getSystemCustomErrorMsgByKey("OPTIMIZATION_FAILED"),
        undefined,

        [err instanceof Error ? err.message : err]
      );
    }

    if (!solution || solution.feasible === false) {
      throw new ApiError(
        422,
        getSystemCustomErrorMsgByKey("INFEASIBLE_SCENARIO"),
        undefined,
        [
          {
            reason:
              "no schedule satisfies all directive and battery constraints",
          },
        ]
      );
    }

    let energyAfter = battery.initial_energy_kwh;
    let totalGrid = 0;
    let totalCost = 0;
    let peakGrid = 0;
    const hourlyPlan: HourlyPlanEntry[] = [];

    for (let h = 0; h < 24; h++) {
      const grid = Math.max(0, Number(solution[`grid_${h}`] ?? 0));
      const solarUsed = Math.max(0, Number(solution[`solarUsed_${h}`] ?? 0));
      const rawCharge = Math.max(0, Number(solution[`charge_${h}`] ?? 0));
      const rawDischarge = Math.max(0, Number(solution[`discharge_${h}`] ?? 0));

      // Net out any degenerate simultaneous charge+discharge from the LP relaxation.
      const net = rawCharge - rawDischarge;

      let action: "charge" | "discharge" | "idle" = "idle";
      let magnitude = 0;
      if (net > EPS) {
        action = "charge";
        magnitude = net;
      } else if (net < -EPS) {
        action = "discharge";
        magnitude = -net;
      }
      energyAfter += net;

      totalGrid += grid;
      totalCost += grid * sortedHours[h]!.tariff_bdt_per_kwh;
      peakGrid = Math.max(peakGrid, grid);

      hourlyPlan.push({
        hour: h,
        grid_kwh: round2(grid),
        solar_used_kwh: round2(solarUsed),
        battery_action: action,
        battery_kwh: round2(magnitude),
        battery_energy_after_kwh: round2(energyAfter),
      });
    }

    const plan_summary = applicable.length
      ? `Optimized 24-hour schedule applying ${applicable.length} operator directive(s); total grid cost ${round2(totalCost)} BDT.`
      : `Optimized 24-hour schedule with no active operator directives; total grid cost ${round2(totalCost)} BDT.`;

    return {
      hourly_plan: hourlyPlan,
      total_grid_kwh: round2(totalGrid),
      total_cost_bdt: round2(totalCost),
      peak_grid_kwh: round2(peakGrid),
      plan_summary,
    };
  }
}
