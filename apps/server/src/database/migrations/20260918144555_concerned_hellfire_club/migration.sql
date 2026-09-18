CREATE TYPE "battery_action" AS ENUM('charge', 'discharge', 'idle');--> statement-breakpoint
CREATE TYPE "directive_type" AS ENUM('solar_reduction', 'minimum_battery_reserve', 'no_charge_window', 'no_discharge_window', 'max_grid_window', 'no_op');--> statement-breakpoint
CREATE TABLE "batteries" (
	"id" serial PRIMARY KEY,
	"scenario_id" integer NOT NULL,
	"capacity_kwh" real NOT NULL,
	"initial_energy_kwh" real NOT NULL,
	"minimum_energy_kwh" real NOT NULL,
	"max_charge_kwh_per_hour" real NOT NULL,
	"max_discharge_kwh_per_hour" real NOT NULL
);
--> statement-breakpoint
CREATE TABLE "directive_interpretations" (
	"id" serial PRIMARY KEY,
	"scenario_id" integer NOT NULL,
	"note_index" integer NOT NULL,
	"applies" boolean NOT NULL,
	"directive_type" "directive_type" NOT NULL,
	"structured_adjustment" jsonb,
	"explanation" text
);
--> statement-breakpoint
CREATE TABLE "hourly_inputs" (
	"id" serial PRIMARY KEY,
	"scenario_id" integer NOT NULL,
	"hour" integer NOT NULL,
	"demand_kwh" real NOT NULL,
	"solar_kwh" real NOT NULL,
	"tariff_bdt_per_kwh" real NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hourly_plans" (
	"id" serial PRIMARY KEY,
	"scenario_id" integer NOT NULL,
	"hour" integer NOT NULL,
	"grid_kwh" real NOT NULL,
	"solar_used_kwh" real NOT NULL,
	"battery_action" "battery_action" NOT NULL,
	"battery_kwh" real NOT NULL,
	"battery_energy_after_kwh" real NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operator_notes" (
	"id" serial PRIMARY KEY,
	"scenario_id" integer NOT NULL,
	"note_index" integer NOT NULL,
	"note_text" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "optimization_results" (
	"id" serial PRIMARY KEY,
	"scenario_id" integer NOT NULL UNIQUE,
	"total_grid_kwh" real NOT NULL,
	"total_cost_bdt" real NOT NULL,
	"peak_grid_kwh" real NOT NULL,
	"plan_summary" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scenarios" (
	"id" serial PRIMARY KEY,
	"scenario_id" text NOT NULL UNIQUE,
	"updated_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "batteries" ADD CONSTRAINT "batteries_scenario_id_scenarios_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "scenarios"("id");--> statement-breakpoint
ALTER TABLE "directive_interpretations" ADD CONSTRAINT "directive_interpretations_scenario_id_scenarios_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "scenarios"("id");--> statement-breakpoint
ALTER TABLE "hourly_inputs" ADD CONSTRAINT "hourly_inputs_scenario_id_scenarios_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "scenarios"("id");--> statement-breakpoint
ALTER TABLE "hourly_plans" ADD CONSTRAINT "hourly_plans_scenario_id_scenarios_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "scenarios"("id");--> statement-breakpoint
ALTER TABLE "operator_notes" ADD CONSTRAINT "operator_notes_scenario_id_scenarios_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "scenarios"("id");--> statement-breakpoint
ALTER TABLE "optimization_results" ADD CONSTRAINT "optimization_results_scenario_id_scenarios_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "scenarios"("id");