import { Container } from "inversify";
import { ApiRouter } from "./routes";
import { ScenarioService } from "./services/scenario.service";
import { ScenarioRepository } from "./database/repositories";
import { ScenarioInputValidators } from "./validators/inputs/scenario.validator";
import { ScenarioRouter } from "./routes/scenario.route";
import { ScenarioController } from "./controllers";
import { McpClientService } from "./services/mcp.client.service";
import { McpInterpretationService } from "./services/mcp-interpretation.service";
import { OptimizerService } from "./services/optimizer.service";

export const container = new Container();

container.bind(ScenarioInputValidators).toSelf().inSingletonScope();
container.bind(ScenarioRepository).toSelf().inSingletonScope();
container.bind(ScenarioService).toSelf().inRequestScope();
container.bind(McpClientService).toSelf().inSingletonScope();
container.bind(McpInterpretationService).toSelf().inRequestScope();
container.bind(OptimizerService).toSelf().inRequestScope();

container.bind(ScenarioController).toSelf().inSingletonScope();
container.bind(ScenarioRouter).toSelf().inSingletonScope();

container.bind(ApiRouter).toSelf().inSingletonScope();
