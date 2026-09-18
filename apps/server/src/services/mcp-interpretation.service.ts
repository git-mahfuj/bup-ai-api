import { injectable, inject } from "inversify";
import { McpClientService } from "./mcp.client.service";
import { ApiError } from "@/libs";
import { getSystemCustomErrorMsgByKey } from "@/events";
import {
  DirectiveInterpretationArraySchema,
  type DirectiveInterpretationEntry,
} from "@repo/zod";
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
    let payload: unknown;
    try {
      payload = await this.mcpClientService.callTool(
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

    const result = DirectiveInterpretationArraySchema.safeParse(payload);
    if (!result.success) {
      throw new ApiError(
        500,
        getSystemCustomErrorMsgByKey("LLM_INTERPRETATION_FAILED"),
        undefined,
        [
          {
            reason: "MCP tool response failed schema validation",
            issues: result.error.issues,
          },
        ]
      );
    }

    return result.data;
  }
}
