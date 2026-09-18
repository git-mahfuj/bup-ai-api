import { ScenarioZSchema } from "@/zod";
import type { OptimizeEnergyRequest } from "@/zod";
import { Validator } from "../validator";
import { injectable } from "inversify";
import type z from "zod";

@injectable()
export class ScenarioInputValidators extends Validator {
  optimizeEnergyInput(
    payload: OptimizeEnergyRequest
  ): z.ZodError | OptimizeEnergyRequest {
    const { data, success, error } = this.validate(
      payload,
      ScenarioZSchema.OptimizeEnergyRequest
    );

    if (!success) return error;

    return data;
  }
}
