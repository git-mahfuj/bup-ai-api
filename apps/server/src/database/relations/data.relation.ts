import { defineRelations } from "drizzle-orm";
import * as schema from "../schemas";

export const relations = defineRelations(schema, (r) => ({
  scenarios: {
    battery: r.one.batteries({
      from: r.scenarios.id,
      to: r.batteries.scenarioId,
    }),
    hourlyInputs: r.many.hourlyInputs({
      from: r.scenarios.id,
      to: r.hourlyInputs.scenarioId,
    }),
    operatorNotes: r.many.operatorNotes({
      from: r.scenarios.id,
      to: r.operatorNotes.scenarioId,
    }),
    directiveInterpretations: r.many.directiveInterpretations({
      from: r.scenarios.id,
      to: r.directiveInterpretations.scenarioId,
    }),
    hourlyPlans: r.many.hourlyPlans({
      from: r.scenarios.id,
      to: r.hourlyPlans.scenarioId,
    }),
    optimizationResult: r.one.optimizationResults({
      from: r.scenarios.id,
      to: r.optimizationResults.scenarioId,
    }),
  },

  batteries: {
    scenario: r.one.scenarios({
      from: r.batteries.scenarioId,
      to: r.scenarios.id,
    }),
  },

  hourlyInputs: {
    scenario: r.one.scenarios({
      from: r.hourlyInputs.scenarioId,
      to: r.scenarios.id,
    }),
  },

  operatorNotes: {
    scenario: r.one.scenarios({
      from: r.operatorNotes.scenarioId,
      to: r.scenarios.id,
    }),
    interpretation: r.one.directiveInterpretations({
      from: r.operatorNotes.noteIndex,
      to: r.directiveInterpretations.noteIndex,
    }),
  },

  directiveInterpretations: {
    scenario: r.one.scenarios({
      from: r.directiveInterpretations.scenarioId,
      to: r.scenarios.id,
    }),
  },

  hourlyPlans: {
    scenario: r.one.scenarios({
      from: r.hourlyPlans.scenarioId,
      to: r.scenarios.id,
    }),
  },

  optimizationResults: {
    scenario: r.one.scenarios({
      from: r.optimizationResults.scenarioId,
      to: r.scenarios.id,
    }),
  },
}));