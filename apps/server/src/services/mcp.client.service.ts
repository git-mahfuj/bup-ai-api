import { injectable } from "inversify";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

@injectable()
export class McpClientService {
  private client: Client | null = null;
  private connecting: Promise<Client> | null = null;

  private async getClient(): Promise<Client> {
    if (this.client) return this.client;
    if (this.connecting) return this.connecting;

    this.connecting = (async () => {
      const transport = new StreamableHTTPClientTransport(
        new URL(process.env.MCP_SERVER_URL ?? "http://localhost:4100/mcp")
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
        result.content?.[0]?.type === "text" ? result.content[0].text : "MCP tool error";
      throw new Error(text);
    }

    const contentBlock = result.content?.[0];
    const raw =
      contentBlock?.type === "text" ? contentBlock.text : JSON.stringify(contentBlock);

    return JSON.parse(raw) as TResult;
  }
}