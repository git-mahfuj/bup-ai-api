import { toNodeHandler } from "@modelcontextprotocol/node";
import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { createServer } from "node:http";
import { baseConfig } from "./config";
import { EquationTools } from "./tools";
import { GreetingResource } from "./resources";
// import { connectRedis } from "./lib/redis";

const handler = createMcpHandler(() => {
  const server = new McpServer({ name: "greeting-server", version: "1.0.0" });

  // Register tools
  new EquationTools(server).init();

  // Register resources
  new GreetingResource(server).init();

  return server;
});

const nodeHandler = toNodeHandler(handler);

// await connectRedis();

createServer(async (req, res) => {
  void nodeHandler(req, res);
}).listen(baseConfig.PORT, "127.0.0.1", () => {
  console.log(`                                                                                                         
               █             ███                                      
 ██   █        █               █                  █▒  ▒█  ░███▒ █████░
 ██░  █        █               █                  ██  ██ ░█▒ ░█ █   ▓█
 █▒▓  █  ███   █▓██   █   █    █    ░███░         ██░░██ █▒     █    █
 █ █  █ ▓▓ ▒█  █▓ ▓█  █   █    █    █▒ ▒█         █▒▓▓▒█ █      █   ▓█
 █ ▓▓ █ █   █  █   █  █   █    █        █         █ ██ █ █      █████░
 █  █ █ █████  █   █  █   █    █    ▒████         █ █▓ █ █      █     
 █  ▓▒█ █      █   █  █   █    █    █▒  █         █    █ █▒     █     
 █  ░██ ▓▓  █  █▓ ▓█  █▒ ▓█    █░   █░ ▓█         █    █ ░█▒ ░▓ █     
 █   ██  ███▒  █▓██   ▒██▒█    ▒██  ▒██▒█         █    █  ▒███▒ █                                                                                                                                  
 Listening...                                               Port: ${baseConfig.PORT}`);
});
