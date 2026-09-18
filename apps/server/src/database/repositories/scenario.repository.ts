import { injectable } from "inversify";
import { pgDb } from "@/libs";
import { eq } from "drizzle-orm";
import {
  scenarios,
  batteries,
  hourlyInputs,
  operatorNotes,
  directiveInterpretations,
  hourlyPlans,
  optimizationResults,
} from "../schemas";
import type {
  BatteriesInsertType,
  HourlyInputsInsertType,
  DirectiveInterpretationsInsertType,
  HourlyPlansInsertType,
  OptimizationResultsInsertType,
} from "../types";

@injectable()
export class ScenarioRepository {
  async createScenario(scenarioId: string) {
    const [row] = await pgDb
      .insert(scenarios)
      .values({ scenarioId })
      .returning();
    return row;
  }

  async findByScenarioId(scenarioId: string) {
    return pgDb.query.scenarios.findFirst({
      where: {
        scenarioId: { eq: scenarioId },
      },
    });
  }

  async saveBattery(
    scenarioPk: number,
    data: Omit<BatteriesInsertType, "id" | "scenarioId">
  ) {
    const [row] = await pgDb
      .insert(batteries)
      .values({ scenarioId: scenarioPk, ...data })
      .returning();
    return row;
  }

  async saveHourlyInputs(
    scenarioPk: number,
    hours: Array<Omit<HourlyInputsInsertType, "id" | "scenarioId">>
  ) {
    return pgDb
      .insert(hourlyInputs)
      .values(hours.map((h) => ({ scenarioId: scenarioPk, ...h })))
      .returning();
  }

  async saveOperatorNotes(scenarioPk: number, notes: string[]) {
    return pgDb
      .insert(operatorNotes)
      .values(
        notes.map((noteText, noteIndex) => ({
          scenarioId: scenarioPk,
          noteIndex,
          noteText,
        }))
      )
      .returning();
  }

  async saveDirectiveInterpretations(
    scenarioPk: number,
    entries: Array<
      Omit<DirectiveInterpretationsInsertType, "id" | "scenarioId">
    >
  ) {
    return pgDb
      .insert(directiveInterpretations)
      .values(entries.map((e) => ({ scenarioId: scenarioPk, ...e })))
      .returning();
  }

  async saveHourlyPlans(
    scenarioPk: number,
    plans: Array<Omit<HourlyPlansInsertType, "id" | "scenarioId">>
  ) {
    return pgDb
      .insert(hourlyPlans)
      .values(plans.map((p) => ({ scenarioId: scenarioPk, ...p })))
      .returning();
  }

  async saveOptimizationResult(
    scenarioPk: number,
    data: Omit<OptimizationResultsInsertType, "id" | "scenarioId">
  ) {
    const [row] = await pgDb
      .insert(optimizationResults)
      .values({ scenarioId: scenarioPk, ...data })
      .returning();
    return row;
  }

  async getFullScenario(scenarioId: string) {
    return pgDb.query.scenarios.findFirst({
      where: {
        scenarioId: { eq: scenarioId },
      },
      with: {
        battery: true,
        hourlyInputs: true,
        operatorNotes: true,
        directiveInterpretations: true,
        hourlyPlans: true,
        optimizationResult: true,
      },
    });
  }

  async deleteScenario(scenarioPk: number) {
    return pgDb.delete(scenarios).where(eq(scenarios.id, scenarioPk));
  }
}
