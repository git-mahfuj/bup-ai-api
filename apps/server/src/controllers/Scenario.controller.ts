import {  ApiResponse } from "@/libs";
import { ScenarioService } from "@/services/scenario.service";
import { inject, injectable } from "inversify";
import type { Request, Response } from "express";

@injectable()
export class ScenarioController {
  constructor(
    @inject(ScenarioService)
    private scenarioService: ScenarioService
  ) {}

  optimizeEnergy = async (req: Request, res: Response) => {
    const result = await this.scenarioService.optimizeEnergy(req.body);
    res.status(200).json(new ApiResponse(200, "Ok", result));
  };

}
