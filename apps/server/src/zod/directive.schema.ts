import { z } from "zod";

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
    capacity_kwh: z.number().finite().positive(),
    initial_energy_kwh: z.number().finite().nonnegative(),
    minimum_energy_kwh: z.number().finite().nonnegative(),
    max_charge_kwh_per_hour: z.number().finite().positive(),
    max_discharge_kwh_per_hour: z.number().finite().positive(),
  }),
});

export type InterpretNotesInput = z.infer<typeof InterpretNotesZSchema>;

// (DirectiveInterpretationEntrySchema / DirectiveInterpretationArraySchema as before)
