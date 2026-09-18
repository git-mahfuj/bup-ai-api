import {
  pgTable,
  pgEnum,
  serial,
  text,
  integer,
  real,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { table_timestamps } from "./helper";

const directiveTypes = [
  "solar_reduction",
  "minimum_battery_reserve",
  "no_charge_window",
  "no_discharge_window",
  "max_grid_window",
  "no_op",
] as const;

export const directiveTypeEnum = pgEnum("directive_type", directiveTypes);

const batteryActions = ["charge", "discharge", "idle"] as const;
export const batteryActionEnum = pgEnum("battery_action", batteryActions);

export const scenarios = pgTable("scenarios", {
  id: serial("id").primaryKey(),
  scenarioId: text("scenario_id").notNull().unique(),
  ...table_timestamps,
});

export const batteries = pgTable("batteries", {
  id: serial("id").primaryKey(),
  scenarioId: integer("scenario_id")
    .references(() => scenarios.id)
    .notNull(),
  capacityKwh: real("capacity_kwh").notNull(),
  initialEnergyKwh: real("initial_energy_kwh").notNull(),
  minimumEnergyKwh: real("minimum_energy_kwh").notNull(),
  maxChargeKwhPerHour: real("max_charge_kwh_per_hour").notNull(),
  maxDischargeKwhPerHour: real("max_discharge_kwh_per_hour").notNull(),
});

export const hourlyInputs = pgTable("hourly_inputs", {
  id: serial("id").primaryKey(),
  scenarioId: integer("scenario_id")
    .references(() => scenarios.id)
    .notNull(),
  hour: integer("hour").notNull(), // 0-23
  demandKwh: real("demand_kwh").notNull(),
  solarKwh: real("solar_kwh").notNull(),
  tariffBdtPerKwh: real("tariff_bdt_per_kwh").notNull(),
});

export const operatorNotes = pgTable("operator_notes", {
  id: serial("id").primaryKey(),
  scenarioId: integer("scenario_id")
    .references(() => scenarios.id)
    .notNull(),
  noteIndex: integer("note_index").notNull(),
  noteText: text("note_text").notNull(),
});

export const directiveInterpretations = pgTable("directive_interpretations", {
  id: serial("id").primaryKey(),
  scenarioId: integer("scenario_id")
    .references(() => scenarios.id)
    .notNull(),
  noteIndex: integer("note_index").notNull(),
  applies: boolean("applies").notNull(),
  directiveType: directiveTypeEnum("directive_type").notNull(),
  structuredAdjustment: jsonb("structured_adjustment"),
  explanation: text("explanation"),
});

export const hourlyPlans = pgTable("hourly_plans", {
  id: serial("id").primaryKey(),
  scenarioId: integer("scenario_id")
    .references(() => scenarios.id)
    .notNull(),
  hour: integer("hour").notNull(),
  gridKwh: real("grid_kwh").notNull(),
  solarUsedKwh: real("solar_used_kwh").notNull(),
  batteryAction: batteryActionEnum("battery_action").notNull(),
  batteryKwh: real("battery_kwh").notNull(),
  batteryEnergyAfterKwh: real("battery_energy_after_kwh").notNull(),
});

export const optimizationResults = pgTable("optimization_results", {
  id: serial("id").primaryKey(),
  scenarioId: integer("scenario_id")
    .references(() => scenarios.id)
    .notNull()
    .unique(),
  totalGridKwh: real("total_grid_kwh").notNull(),
  totalCostBdt: real("total_cost_bdt").notNull(),
  peakGridKwh: real("peak_grid_kwh").notNull(),
  planSummary: text("plan_summary").notNull(),
});
