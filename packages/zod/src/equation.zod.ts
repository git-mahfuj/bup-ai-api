import { z } from "zod";

const HoursArraySchema = z
  .array(z.number().int().min(0).max(23))
  .min(1)
  .refine((hrs) => hrs.every((h, i) => i === 0 || h > hrs[i - 1]!), {
    message: "hours must be unique integers in ascending order",
  });

const SolarReductionAdjustment = z.object({
  hours: HoursArraySchema,
  factor: z.number().min(0).max(1),
});

const MinimumBatteryReserveAdjustment = z.object({
  hours: HoursArraySchema,
  minimum_energy_kwh: z.number().finite().nonnegative(),
});

const NoChargeWindowAdjustment = z.object({
  hours: HoursArraySchema,
});

const NoDischargeWindowAdjustment = z.object({
  hours: HoursArraySchema,
});

const MaxGridWindowAdjustment = z.object({
  hours: HoursArraySchema,
  max_grid_kwh: z.number().finite().nonnegative(),
});

const BaseEntryFields = {
  note_index: z.number().int().min(0),
  explanation: z.string().min(1),
};

export const DirectiveInterpretationEntrySchema = z.discriminatedUnion(
  "directive_type",
  [
    z.object({
      ...BaseEntryFields,
      directive_type: z.literal("solar_reduction"),
      applies: z.literal(true),
      structured_adjustment: SolarReductionAdjustment,
    }),
    z.object({
      ...BaseEntryFields,
      directive_type: z.literal("minimum_battery_reserve"),
      applies: z.literal(true),
      structured_adjustment: MinimumBatteryReserveAdjustment,
    }),
    z.object({
      ...BaseEntryFields,
      directive_type: z.literal("no_charge_window"),
      applies: z.literal(true),
      structured_adjustment: NoChargeWindowAdjustment,
    }),
    z.object({
      ...BaseEntryFields,
      directive_type: z.literal("no_discharge_window"),
      applies: z.literal(true),
      structured_adjustment: NoDischargeWindowAdjustment,
    }),
    z.object({
      ...BaseEntryFields,
      directive_type: z.literal("max_grid_window"),
      applies: z.literal(true),
      structured_adjustment: MaxGridWindowAdjustment,
    }),
    z.object({
      ...BaseEntryFields,
      directive_type: z.literal("no_op"),
      applies: z.literal(false),
      structured_adjustment: z.null(),
    }),
  ]
);

export const DirectiveInterpretationArraySchema = z.array(
  DirectiveInterpretationEntrySchema
);

export type DirectiveInterpretationEntry = z.infer<
  typeof DirectiveInterpretationEntrySchema
>;

// Minimal request-side shapes for the tool boundary.
// Replace with your existing @/zod hours/battery schemas if already defined.
export const HourEntryZSchema = z.object({
  hour: z.number().int().min(0).max(23),
  demand_kwh: z.number().finite().nonnegative(),
  solar_kwh: z.number().finite().nonnegative(),
  tariff_bdt_per_kwh: z.number().finite().nonnegative(),
});

export const BatteryZSchema = z.object({
  capacity_kwh: z.number().finite().positive(),
  initial_energy_kwh: z.number().finite().nonnegative(),
  minimum_energy_kwh: z.number().finite().nonnegative(),
  max_charge_kwh_per_hour: z.number().finite().positive(),
  max_discharge_kwh_per_hour: z.number().finite().positive(),
});

export const InterpretNotesInputZSchema = z.object({
  operator_notes: z.array(z.string().min(1)).min(1).max(3),
  hours: z.array(HourEntryZSchema).length(24),
  battery: BatteryZSchema,
});

export const InterpretNotesZSchema = z.object({
  operator_notes: z.array(z.string().min(1)).min(1).max(3),
  hours: z
    .array(
      z.object({
        hour: z.number().int().min(0).max(23),
        demand_kwh: z.number().finite().nonnegative(),
        solar_kwh: z.number().finite().nonnegative(),
        tariff_bdt_per_kwh: z.number().finite().nonnegative(),
      })
    )
    .length(24),
  battery: z.object({
    capacity_kwh: z.number().positive(),
    initial_energy_kwh: z.number().nonnegative(),
    minimum_energy_kwh: z.number().nonnegative(),
    max_charge_kwh_per_hour: z.number().positive(),
    max_discharge_kwh_per_hour: z.number().positive(),
  }),
});

export type InterpretNotesInput = z.infer<typeof InterpretNotesZSchema>;
