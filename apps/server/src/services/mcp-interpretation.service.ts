import { injectable, inject } from "inversify";
import { McpClientService } from "@/mcp/client/mcp-client.service";
import { ApiError } from "@/libs";
import { getSystemCustomErrorMsgByKey } from "@/events";
import {
  DirectiveInterpretationArraySchema,
  type DirectiveInterpretationEntry,
} from "@/zod";
import type { OptimizeEnergyRequest } from "@/zod";

@injectable()
export class McpInterpretationService {
  constructor(
    @inject(McpClientService)
    private mcpClientService: McpClientService
  ) {}

  async interpretNotes(
    operatorNotes: string[],
    hours: OptimizeEnergyRequest["hours"],
    battery: OptimizeEnergyRequest["battery"]
  ): Promise<DirectiveInterpretationEntry[]> {
    let toolResponse: unknown;
    try {
      toolResponse = await this.mcpClientService.callTool(
        "interpret_operator_notes",
        {
          operator_notes: operatorNotes,
          hours,
          battery,
        }
      );
    } catch (err) {
      throw new ApiError(
        500,
        getSystemCustomErrorMsgByKey("LLM_INTERPRETATION_FAILED"),
        undefined,
        [err instanceof Error ? err.message : err]
      );
    }

    // MCPToolResponse.toObject() shape is assumed to expose the payload under `.data`
    // or as the raw tool text — adjust the extraction below to match MCPToolResponse's
    // actual toObject() contract.
    const payload =
      (toolResponse as { data?: unknown })?.data ??
      (toolResponse as { message?: string })?.message ??
      toolResponse;

    const parsedPayload =
      typeof payload === "string" ? JSON.parse(payload) : payload;

    const result = DirectiveInterpretationArraySchema.safeParse(parsedPayload);
    if (!result.success) {
      throw new ApiError(
        500,
        getSystemCustomErrorMsgByKey("LLM_INTERPRETATION_FAILED"),
        undefined,
        [{ reason: "MCP tool response failed schema validation", issues: result.error.issues }]
      );
    }

    return result.data;
  }
}