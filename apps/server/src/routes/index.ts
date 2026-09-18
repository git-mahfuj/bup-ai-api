import { Router } from "express";
import type { IRouter } from "@/blueprints";
import { inject, injectable } from "inversify";
import { ScenarioRouter } from "./scenario.route";

@injectable()
export class ApiRouter implements IRouter {
  private router: Router;

  constructor(
    @inject(ScenarioRouter)
    private scenarioRouter: ScenarioRouter
  ) {
    this.router = Router();
    this.scenarioRouter.createRouters();
  }

  createRouters(): void {
    this.router.use("/v1/scenario", this.scenarioRouter.getRouters());
  }

  getRouters(): Router {
    return this.router;
  }
}
