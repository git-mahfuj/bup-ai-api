import { McpRegistrar } from "@/blueprints";
import { asyncResourceHandler, MCPResourceResponse } from "@/lib";
import {
  ResourceTemplate,
  type ReadResourceTemplateCallback,
} from "@modelcontextprotocol/server";

export class GreetingResource extends McpRegistrar {
  registerHelloWorld() {
    this.server.registerResource(
      "hello-world",
      new ResourceTemplate("world://hello", {
        list: undefined,
      }),
      {
        title: "Greeting",
        description: "Returns hello world text",
        mimeType: "application/json",
      },
      asyncResourceHandler(helloWorld)
    );
  }

  init() {
    this.registerHelloWorld();
  }
}

const helloWorld: ReadResourceTemplateCallback = async (uri, variables) => {
  return new MCPResourceResponse(
    uri.href,
    "Hello World From MCP Resource"
  ).toObject();
};
