import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

const BASE_URL = "https://customers-api.nichedata.ai";
const PORT = process.env.PORT || 3000;
const NICHEDATA_TOKEN = process.env.NICHEDATA_TOKEN;

if (!NICHEDATA_TOKEN) {
  console.warn("Warning: NICHEDATA_TOKEN is not set. Notice tool calls will fail until it is configured.");
}

function authHeaders() {
  return {
    Authorization: `Bearer ${NICHEDATA_TOKEN}`,
    Accept: "application/json",
  };
}

function getServer() {
  const server = new McpServer({ name: "nichedata-notices", version: "1.0.0" });

  server.registerTool(
    "list_notices",
    {
      title: "List notices",
      description: "List NicheData notices with optional filtering, sorting, and pagination.",
      inputSchema: {
        page: z.number().int().min(1).optional().describe("Page number, 1-indexed"),
        limit: z.number().int().min(1).max(100).optional().describe("Results per page"),
        sort: z.string().optional().describe("Sort field, e.g. 'createdAt' or '-createdAt' for descending"),
        filter: z.record(z.string()).optional().describe("Additional query filters as key/value pairs"),
      },
    },
    async ({ page, limit, sort, filter }) => {
      const url = new URL("/notices", BASE_URL);
      if (page) url.searchParams.set("page", String(page));
      if (limit) url.searchParams.set("limit", String(limit));
      if (sort) url.searchParams.set("sort", sort);
      if (filter) {
        for (const [key, value] of Object.entries(filter)) {
          url.searchParams.set(key, value);
        }
      }

      const response = await fetch(url, { headers: authHeaders() });
      const text = await response.text();
      if (!response.ok) {
        return {
          content: [{ type: "text", text: `NicheData API error ${response.status}: ${text}` }],
          isError: true,
        };
      }
      return { content: [{ type: "text", text }] };
    }
  );

  server.registerTool(
    "get_notice",
    {
      title: "Get notice",
      description: "Get full details of a single NicheData notice by ID.",
      inputSchema: {
        id: z.string().describe("Notice ID"),
      },
    },
    async ({ id }) => {
      const url = new URL(`/notices/${encodeURIComponent(id)}`, BASE_URL);
      const response = await fetch(url, { headers: authHeaders() });
      const text = await response.text();
      if (!response.ok) {
        return {
          content: [{ type: "text", text: `NicheData API error ${response.status}: ${text}` }],
          isError: true,
        };
      }
      return { content: [{ type: "text", text }] };
    }
  );

  return server;
}

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/mcp", async (req, res) => {
  try {
    const server = getServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => {
      transport.close();
      server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("MCP request error", err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
});

app.get("/mcp", (req, res) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed." },
    id: null,
  });
});

app.delete("/mcp", (req, res) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed." },
    id: null,
  });
});

app.listen(PORT, () => {
  console.log(`NicheData MCP server listening on port ${PORT}`);
});
