import { z } from "zod";
import { ZodBase } from "./base.zod";

export abstract class ScenarioZSchema extends ZodBase {

  // ── shared primitives ──────────────────────────────
  static readonly HoursWindow = z.array(z.number().int().min(0).max(23));

  static readonly ScenarioIdField = z.object({
    scenario_id: z.string().min(1),
  });

  // ── request ─────────────────────────────────────────
  static readonly HourEntry = z.object({
    hour: z.number().int().min(0).max(23),
    demand_kwh: z.number().nonnegative(),
    solar_kwh: z.number().nonnegative(),
    tariff_bdt_per_kwh: z.number().nonnegative(),
  });

  static readonly Battery = z.object({
    capacity_kwh: z.number().positive(),
    initial_energy_kwh: z.number().nonnegative(),
    minimum_energy_kwh: z.number().nonnegative(),
    max_charge_kwh_per_hour: z.number().positive(),
    max_discharge_kwh_per_hour: z.number().positive(),
  });

  static readonly OptimizeEnergyRequest = this.ScenarioIdField.extend({
    operator_notes: z.array(z.string().min(1)).min(1).max(3),
    hours: z.array(this.HourEntry).length(24),
    battery: this.Battery,
  }).superRefine((data, ctx) => {
    const hourSet = new Set(data.hours.map(h => h.hour));
    if (hourSet.size !== 24) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "hours must contain unique integers 0 through 23",
        path: ["hours"],
      });
    }
  });

  // ── directive adjustments (built off one base) ──────
  static readonly AdjustmentBase = z.object({ hours: this.HoursWindow });

  static readonly SolarReductionAdjustment = this.AdjustmentBase.extend({
    factor: z.number().min(0).max(1),
  });

  static readonly MinimumBatteryReserveAdjustment = this.AdjustmentBase.extend({
    minimum_energy_kwh: z.number().nonnegative(),
  });

  static readonly NoChargeWindowAdjustment = this.AdjustmentBase;

  static readonly NoDischargeWindowAdjustment = this.AdjustmentBase;

  static readonly MaxGridWindowAdjustment = this.AdjustmentBase.extend({
    max_grid_kwh: z.number().nonnegative(),
  });

  static readonly StructuredAdjustment = z.union([
    this.SolarReductionAdjustment,
    this.MinimumBatteryReserveAdjustment,
    this.MaxGridWindowAdjustment,
    this.NoChargeWindowAdjustment, // same shape as NoDischargeWindowAdjustment
  ]).nullable();

  static readonly DirectiveType = z.enum([
    "solar_reduction",
    "minimum_battery_reserve",
    "no_charge_window",
    "no_discharge_window",
    "max_grid_window",
    "no_op",
  ]);

  static readonly DirectiveInterpretation = z.object({
    note_index: z.number().int().min(0),
    applies: z.boolean(),
    directive_type: this.DirectiveType,
    structured_adjustment: this.StructuredAdjustment,
    explanation: z.string(),
  }).superRefine((data, ctx) => {
    const isNoOp = data.directive_type === "no_op";
    if (isNoOp !== (data.applies === false) || isNoOp !== (data.structured_adjustment === null)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: isNoOp
          ? "no_op requires applies=false and structured_adjustment=null"
          : "non-no_op directives require applies=true and a structured_adjustment",
      });
    }
  });

  // ── response ─────────────────────────────────────────
  static readonly BatteryAction = z.enum(["charge", "discharge", "idle"]);

  static readonly HourlyPlanEntry = z.object({
    hour: z.number().int().min(0).max(23),
    grid_kwh: z.number().nonnegative(),
    solar_used_kwh: z.number().nonnegative(),
    battery_action: this.BatteryAction,
    battery_kwh: z.number().nonnegative(),
    battery_energy_after_kwh: z.number().nonnegative(),
  });

  static readonly OptimizeEnergyResponse = this.ScenarioIdField.extend({
    directive_interpretation: z.array(this.DirectiveInterpretation),
    hourly_plan: z.array(this.HourlyPlanEntry).length(24),
    total_grid_kwh: z.number().nonnegative(),
    total_cost_bdt: z.number().nonnegative(),
    peak_grid_kwh: z.number().nonnegative(),
    plan_summary: z.string(),
  });
}

export type HourEntry = z.infer<typeof ScenarioZSchema.HourEntry>;
export type Battery = z.infer<typeof ScenarioZSchema.Battery>;
export type OptimizeEnergyRequest = z.infer<typeof ScenarioZSchema.OptimizeEnergyRequest>;
export type DirectiveType = z.infer<typeof ScenarioZSchema.DirectiveType>;
export type SolarReductionAdjustment = z.infer<typeof ScenarioZSchema.SolarReductionAdjustment>;
export type MinimumBatteryReserveAdjustment = z.infer<typeof ScenarioZSchema.MinimumBatteryReserveAdjustment>;
export type NoChargeWindowAdjustment = z.infer<typeof ScenarioZSchema.NoChargeWindowAdjustment>;
export type NoDischargeWindowAdjustment = z.infer<typeof ScenarioZSchema.NoDischargeWindowAdjustment>;
export type MaxGridWindowAdjustment = z.infer<typeof ScenarioZSchema.MaxGridWindowAdjustment>;
export type StructuredAdjustment = z.infer<typeof ScenarioZSchema.StructuredAdjustment>;
export type DirectiveInterpretation = z.infer<typeof ScenarioZSchema.DirectiveInterpretation>;
export type BatteryAction = z.infer<typeof ScenarioZSchema.BatteryAction>;
export type HourlyPlanEntry = z.infer<typeof ScenarioZSchema.HourlyPlanEntry>;
export type OptimizeEnergyResponse = z.infer<typeof ScenarioZSchema.OptimizeEnergyResponse>;