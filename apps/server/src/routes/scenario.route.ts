import { Router } from "express";
import type { IRouter } from "@/blueprints";
import { inject, injectable } from "inversify";
import { ScenarioController } from "@/controllers";

@injectable()
export class ScenarioRouter implements IRouter {
  private router: Router;

  constructor(
    @inject(ScenarioController)
    private scenarioController: ScenarioController
  ) {
    this.router = Router();
  }

  createRouters(): void {

    this.router.post(
      "/optimize-energy",
      this.scenarioController.optimizeEnergy.bind(this.scenarioController)
    );

    this.router.get(
      "/:scenarioId",
      this.scenarioController.getScenario.bind(this.scenarioController)
    );
  }

  getRouters(): Router {
    return this.router;
  }
}