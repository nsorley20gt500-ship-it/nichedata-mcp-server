# NicheData MCP Server

An MCP server that wraps the [NicheData](https://nichedata.ai) notices API
(`https://customers-api.nichedata.ai`) so it can be added to Claude as a
custom connector.

## Tools

- `list_notices` — list/search notices with optional `page`, `limit`, `sort`,
  and `filter` (key/value query params).
- `get_notice` — fetch a single notice by `id`.

## Setup

```bash
npm install
cp .env.example .env
# edit .env and set NICHEDATA_TOKEN to your real publicId.secret token
npm start
```

The server listens on `PORT` (default `3000`) and exposes:

- `GET /health` — health check, returns `{ "status": "ok" }`.
- `POST /mcp` — the MCP Streamable HTTP endpoint.

## Environment variables

| Variable          | Description                                      |
| ----------------- | ------------------------------------------------- |
| `NICHEDATA_TOKEN`  | NicheData API token, format `publicId.secret`.     |
| `PORT`             | Port to listen on (default `3000`).                |

## Adding to Claude

Once deployed, add a custom connector in Claude pointing at:

```
https://<your-deployment-host>/mcp
```
