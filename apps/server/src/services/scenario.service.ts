import { ScenarioRepository } from "@/database/repositories";
import { ScenarioInputValidators } from "@/validators/inputs/scenario.validator";
import { inject, injectable } from "inversify";
import type { OptimizeEnergyRequest, OptimizeEnergyResponse } from "@/zod";
import type z from "zod";
import { isZodError, validationError } from "@/utils";
import { getSystemCustomErrorMsgByKey } from "@/events";
import { ApiError } from "@/libs";
import { McpInterpretationService } from "@/services/mcp-interpretation.service";

@injectable()
export class ScenarioService {
  constructor(
    @inject(ScenarioRepository)
    private scenarioRepository: ScenarioRepository,
    @inject(ScenarioInputValidators)
    private scenarioInputValidator: ScenarioInputValidators,
    @inject(McpInterpretationService)
    private mcpInterpretationService: McpInterpretationService
  ) {}

  async optimizeEnergy(
    payload: OptimizeEnergyRequest
  ): Promise<OptimizeEnergyResponse | z.ZodError> {
    const validated = this.scenarioInputValidator.optimizeEnergyInput(payload);
    if (isZodError(validated)) throw validationError(validated);

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

    // Call the MCP tool (LLM interpretation happens entirely inside the MCP server process)
    const directiveInterpretation = await this.mcpInterpretationService.interpretNotes(
      operator_notes,
      hours,
      battery
    );

    await this.scenarioRepository.saveDirectiveInterpretations(
      scenario!.id,
      directiveInterpretation.map((e) => ({
        noteIndex: e.note_index,
        applies: e.applies,
        directiveType: e.directive_type,
        structuredAdjustment: e.structured_adjustment,
        explanation: e.explanation,
      }))
    );

    // TODO: run optimizer against hours/battery + directiveInterpretation,
    // then saveHourlyPlans + saveOptimizationResult, then return the plan.
    // const plan = await this.optimizerService.solve(hours, battery, directiveInterpretation);

    throw new ApiError(
      500,
      getSystemCustomErrorMsgByKey("OPTIMIZATION_FAILED"),
      undefined
    );
  }

  async getScenario(scenarioId: string) {
    return this.scenarioRepository.getFullScenario(scenarioId);
  }
}