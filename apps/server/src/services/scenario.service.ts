import { ScenarioRepository } from "@/database/repositories";
import { ScenarioInputValidators } from "@/validators/inputs/scenario.validator";
import { OptimizerService } from "@/services/optimizer.service";
import { McpInterpretationService } from "@/services/mcp-interpretation.service";
import { inject, injectable } from "inversify";
import type { OptimizeEnergyRequest, OptimizeEnergyResponse } from "@/zod";
import type z from "zod";
import { ApiError } from "@/libs";
import { getSystemCustomErrorMsgByKey } from "@/events";

export function toOptimizeEnergyResponse(
  scenario: NonNullable<
    Awaited<ReturnType<ScenarioRepository["getFullScenario"]>>
  >
): OptimizeEnergyResponse {
  return {
    scenario_id: scenario.scenarioId,

    directive_interpretation: scenario.directiveInterpretations
      .sort((a, b) => a.noteIndex - b.noteIndex)
      .map((d) => ({
        note_index: d.noteIndex,
        applies: d.applies,
        directive_type: d.directiveType,
        structured_adjustment:
          d.structuredAdjustment as OptimizeEnergyResponse["directive_interpretation"][number]["structured_adjustment"],
        explanation: d.explanation ?? "",
      })),

    hourly_plan: scenario.hourlyPlans
      .sort((a, b) => a.hour - b.hour)
      .map((p) => ({
        hour: p.hour,
        grid_kwh: p.gridKwh,
        solar_used_kwh: p.solarUsedKwh,
        battery_action: p.batteryAction,
        battery_kwh: p.batteryKwh,
        battery_energy_after_kwh: p.batteryEnergyAfterKwh,
      })),

    total_grid_kwh: scenario.optimizationResult?.totalGridKwh ?? 0,
    total_cost_bdt: scenario.optimizationResult?.totalCostBdt ?? 0,
    peak_grid_kwh: scenario.optimizationResult?.peakGridKwh ?? 0,
    plan_summary: scenario.optimizationResult?.planSummary ?? "",
  };
}

@injectable()
export class ScenarioService {
  constructor(
    @inject(ScenarioRepository)
    private scenarioRepository: ScenarioRepository,
    @inject(ScenarioInputValidators)
    private scenarioInputValidator: ScenarioInputValidators,
    @inject(OptimizerService)
    private optimizerService: OptimizerService,
    @inject(McpInterpretationService)
    private mcpInterpreterService: McpInterpretationService
  ) {}

  async optimizeEnergy(
    payload: OptimizeEnergyRequest
  ): Promise<OptimizeEnergyResponse | z.ZodError> {
    const validated = this.scenarioInputValidator.optimizeEnergyInput(payload);
    if (validated instanceof Error) return validated;

    const { scenario_id, operator_notes, hours, battery } = validated;

    const scenario = await this.scenarioRepository.createScenario(scenario_id);

    await Promise.all([
      this.scenarioRepository.saveBattery(scenario!.id, {
        capacityKwh: battery.capacity_kwh,
        initialEnergyKwh: battery.initial_energy_kwh,
        minimumEnergyKwh: battery.minimum_energy_kwh,
        maxChargeKwhPerHour: battery.max_charge_kwh_per_hour,
        maxDischargeKwhPerHour: battery.max_discharge_kwh_per_hour,
      }),
      this.scenarioRepository.saveHourlyInputs(
        scenario!.id,
        hours.map((h) => ({
          hour: h.hour,
          demandKwh: h.demand_kwh,
          solarKwh: h.solar_kwh,
          tariffBdtPerKwh: h.tariff_bdt_per_kwh,
        }))
      ),
      this.scenarioRepository.saveOperatorNotes(scenario!.id, operator_notes),
    ]);

    // 1. LLM interprets each note into a structured directive
    const directiveInterpretation =
      await this.mcpInterpreterService.interpretNotes(
        operator_notes,
        hours,
        battery
      );

    // 2. Persist interpretation
    await this.scenarioRepository.saveDirectiveInterpretations(
      scenario!.id,
      directiveInterpretation.map((d) => ({
        noteIndex: d.note_index,
        applies: d.applies,
        directiveType: d.directive_type,
        structuredAdjustment: d.structured_adjustment,
        explanation: d.explanation,
      }))
    );

    // 3. Run the optimizer using base data + applicable directives
    const plan = this.optimizerService.solve(
      hours,
      battery,
      directiveInterpretation
    );

    // 4. Persist plan + summary
    await Promise.all([
      this.scenarioRepository.saveHourlyPlans(
        scenario!.id,
        plan.hourly_plan.map((p) => ({
          hour: p.hour,
          gridKwh: p.grid_kwh,
          solarUsedKwh: p.solar_used_kwh,
          batteryAction: p.battery_action,
          batteryKwh: p.battery_kwh,
          batteryEnergyAfterKwh: p.battery_energy_after_kwh,
        }))
      ),
      this.scenarioRepository.saveOptimizationResult(scenario!.id, {
        totalGridKwh: plan.total_grid_kwh,
        totalCostBdt: plan.total_cost_bdt,
        peakGridKwh: plan.peak_grid_kwh,
        planSummary: plan.plan_summary,
      }),
    ]);

    // 5. Return the exact API contract shape (snake_case, no ids)
    return {
      scenario_id,
      directive_interpretation: directiveInterpretation,
      hourly_plan: plan.hourly_plan,
      total_grid_kwh: plan.total_grid_kwh,
      total_cost_bdt: plan.total_cost_bdt,
      peak_grid_kwh: plan.peak_grid_kwh,
      plan_summary: plan.plan_summary,
    };
  }

  async getScenario(scenarioId: string) {
    const scenario = await this.scenarioRepository.getFullScenario(scenarioId);
    if (!scenario) {
      throw new ApiError(
        404,
        getSystemCustomErrorMsgByKey("SCENARIO_NOT_FOUND"),
        undefined,
        [`Scenario '${scenarioId}' not found`]
      );
    }
    return toOptimizeEnergyResponse(scenario);
  }
}
