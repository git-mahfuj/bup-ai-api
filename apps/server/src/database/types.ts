import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import {
  scenarios,
  batteries,
  hourlyInputs,
  operatorNotes,
  directiveInterpretations,
  hourlyPlans,
  optimizationResults,
} from "./schemas";

export type ScenariosSelectType = InferSelectModel<typeof scenarios>;
export type ScenariosInsertType = InferInsertModel<typeof scenarios>;

export type BatteriesSelectType = InferSelectModel<typeof batteries>;
export type BatteriesInsertType = InferInsertModel<typeof batteries>;

export type HourlyInputsSelectType = InferSelectModel<typeof hourlyInputs>;
export type HourlyInputsInsertType = InferInsertModel<typeof hourlyInputs>;

export type OperatorNotesSelectType = InferSelectModel<typeof operatorNotes>;
export type OperatorNotesInsertType = InferInsertModel<typeof operatorNotes>;

export type DirectiveInterpretationsSelectType = InferSelectModel<typeof directiveInterpretations>;
export type DirectiveInterpretationsInsertType = InferInsertModel<typeof directiveInterpretations>;

export type HourlyPlansSelectType = InferSelectModel<typeof hourlyPlans>;
export type HourlyPlansInsertType = InferInsertModel<typeof hourlyPlans>;

export type OptimizationResultsSelectType = InferSelectModel<typeof optimizationResults>;
export type OptimizationResultsInsertType = InferInsertModel<typeof optimizationResults>;