// mcp.client.service.ts
import "dotenv/config"
import { injectable } from "inversify";
import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";

function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1]!.trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1) return raw.slice(start, end + 1);
  return raw.trim();
}

@injectable()
export class McpClientService {
  private client: Client | null = null;
  private connecting: Promise<Client> | null = null;

  private async getClient(): Promise<Client> {
    if (this.client) return this.client;
    if (this.connecting) return this.connecting;
    this.connecting = (async () => {
      const transport = new StreamableHTTPClientTransport(
        new URL(process.env.MCP_SERVER_URL ?? "http://localhost:3000/mcp")
      );
      const client = new Client({ name: "gridwise-api", version: "1.0.0" });
      await client.connect(transport);
      this.client = client;
      return client;
    })();
    return this.connecting;
  }

  async callTool<TResult = unknown>(
    name: string,
    args: Record<string, unknown>
  ): Promise<TResult> {
    const client = await this.getClient();
    const result = await client.callTool({ name, arguments: args });

    if (result.isError) {
      const text =
        result.content?.[0]?.type === "text"
          ? result.content[0].text
          : "MCP tool error";
      throw new Error(text);
    }

    // @ts-ignore
    const raw = result.structuredContent?.result;

    if (typeof raw !== "string") {
      throw new Error(
        `MCP tool "${name}" returned no structuredContent.result`
      );
    }

    try {
      return JSON.parse(raw) as TResult;
    } catch {
      throw new Error(
        `MCP tool "${name}" returned non-JSON output: ${raw.slice(0, 200)}`
      );
    }
  }
}
