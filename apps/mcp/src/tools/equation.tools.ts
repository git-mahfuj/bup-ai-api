import { McpRegistrar } from "@/blueprints";
import { asyncToolHandler, MCPToolException, MCPToolResponse } from "@/lib";
import { EquationZSchema, type AddNumberZType } from "@/zod";

export class EquationTools extends McpRegistrar {
  static AddNumberToolName: string = "add_numbers";

  registerAddNumbers() {
    this.server.registerTool(
      EquationTools.AddNumberToolName,
      {
        title: "Add two numbers",
        description: "Take a and b and return the sum",
        inputSchema: EquationZSchema.AddNumber,
        annotations: {
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: false,
          readOnlyHint: false,
        },
      },
      asyncToolHandler(createHelloWorldTool)
    );
  }

  init() {
    this.registerAddNumbers();
  }
}

const createHelloWorldTool = async (payload: AddNumberZType) => {
  const { a, b } = payload;

  if (a < 20 || b < 10) {
    throw new MCPToolException(
      "Invalid input: a must be > 20 and b must be > 10.",
      EquationTools.AddNumberToolName
    );
  }

  const result = a + b;

  return new MCPToolResponse(
    "Numbers Added Successfully",
    `The sum of a + b is: ${result}`,
    200
  ).toObject();
};
