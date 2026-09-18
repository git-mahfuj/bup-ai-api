import { ApiError, ApiResponse } from "@/libs";
import { ScenarioService } from "@/services/scenario.service";
import { getSystemCustomErrorMsgByKey } from "@/events";
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

  getScenario = async (req: Request, res: Response) => {
    const { scenarioId } = req.params;

    if (!scenarioId) {
      throw new ApiError(
        400,
        getSystemCustomErrorMsgByKey("SCENARIO_CREATION_FAILED"),
        undefined,
        ["scenarioId is required"]
      );
    }

    const scenario = await this.scenarioService.getScenario(
      scenarioId as string
    );

    res.status(200).json(scenario);
  };
}
