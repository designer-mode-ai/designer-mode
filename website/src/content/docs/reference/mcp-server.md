---
title: MCP Server
description: Using Designer Mode with Model Context Protocol
---

The MCP server exposes Designer Mode as tools that MCP-compatible agents (Claude Code, etc.) can call directly.

## Setup

Add to `.mcp.json`:

```json
{
  "mcpServers": {
    "designer-mode": {
      "command": "npx",
      "args": ["designer-mode-server", "mcp"]
    }
  }
}
```

## Tools

### wait_for_design_request

Waits for the next design request from the browser panel. Blocks until a request arrives or times out.

**Returns:** The full prompt with component info, styles, and user message.

### send_design_response

Sends a response back to the browser panel.

**Parameters:**
- `message` (string) — The response to display in the panel

## MCP + Relay

When started in MCP mode, the server runs both:
- The MCP tool interface (via stdio)
- The HTTP relay server (for the browser panel)

This means the browser panel communicates over HTTP while the agent communicates over MCP — both through the same relay state.
