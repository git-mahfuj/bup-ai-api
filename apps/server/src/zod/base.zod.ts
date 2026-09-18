import z4 from "zod/v4";

export abstract class ZodBase {
  static id = z4.uuidv4({ error: "Invalid id" });
  static timestamps = z4.object({
    created_at: z4.coerce.date().optional(),
    updated_at: z4.coerce.date().optional(),
  });
}

export type IdZType = z4.infer<typeof ZodBase.id>;
export type TimestampsZtype = z4.infer<typeof ZodBase.timestamps>;
