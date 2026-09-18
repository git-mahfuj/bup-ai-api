import z4 from "zod/v4";

export abstract class EquationZSchema {
  static AddNumber = z4.object({
    a: z4.number(),
    b: z4.number(),
  });
}

export type AddNumberZType = z4.infer<typeof EquationZSchema.AddNumber>;
