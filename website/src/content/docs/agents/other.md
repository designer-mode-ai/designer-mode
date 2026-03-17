---
title: Other Agents
description: Using Designer Mode with any AI coding agent
---

Designer Mode works with any agent through two approaches:

- **MCP** — for agents that support Model Context Protocol
- **Skill** — for any agent that can run shell commands

## Skill Setup (Most Compatible)

```bash
npx designer-mode setup
```

This installs the skill file into standard locations:
- `.claude/skills/designer-mode/SKILL.md` — Claude Code
- `.agents/skills/designer-mode/SKILL.md` — Cursor, Codex, Gemini CLI

Then tell your agent: **"enter design mode"**

### Supported Agents

| Agent | How to activate |
|---|---|
| **Claude Code** | "enter design mode" or `/designer-mode` |
| **Cursor** | "enter design mode" or `/designer-mode` |
| **Codex** | "enter design mode" |
| **Gemini CLI** | "enter design mode" |
| **Aider** | "enter design mode" |

## MCP Setup

For MCP-compatible agents, add to `.mcp.json`:

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

The MCP server exposes:
- `wait_for_design_request` — blocks until the panel sends a request
- `send_design_response` — sends a response back to the panel

## Manual Integration

For agents not listed above, the loop is simple:

### 1. Start the relay

```bash
npx designer-mode server
```

### 2. Poll for requests

```bash
npx designer-mode wait
```

This blocks until a request arrives, then prints the full prompt (component info, styles, user message).

### 3. Apply changes and respond

```bash
curl -X POST http://localhost:3334/api/response \
  -H "Content-Type: text/plain" \
  -d "Done! Applied the changes."
```

### 4. Loop

Repeat steps 2-3 for each request.

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/message` | POST | Browser sends design request |
| `/api/wait` | GET | Agent long-polls for next request (300s timeout) |
| `/api/response` | POST | Agent sends response to panel |
| `/api/poll` | GET | Panel polls for agent response (30s timeout) |
| `/api/flush` | POST | Drain stale responses |
| `/api/health` | GET | Health check |
