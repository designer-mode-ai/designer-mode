---
title: Other Agents
description: Using Designer Mode with any AI coding agent
---

Designer Mode works with any agent through two approaches:

- **MCP** — for agents that support Model Context Protocol
- **Skill** — for any agent that can run shell commands

## Skill Setup

```bash
npx designer-mode setup
```

This installs the skill file into standard locations:
- `.claude/skills/designer-mode/SKILL.md` — Claude Code
- `.agents/skills/designer-mode/SKILL.md` — Cursor, Codex, Gemini CLI

Then tell your agent: **"enter design mode"**

The skill instructs the agent to start the relay server in the background and stream its stdout, using whichever tool its harness provides — Claude Code's `Monitor`, Cursor's `shell` with `notify_on_output`, or an equivalent. The agent then watches for `=== DESIGNER MODE REQUEST === ... === END ===` blocks and curls a response back for each one.

### Supported Agents

| Agent | How to activate |
|---|---|
| **Claude Code** | "enter design mode" or `/designer-mode` |
| **Cursor** | "enter design mode" or `/designer-mode` |

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

For agents whose harness doesn't expose a stdout-subscription primitive, the loop is simple:

### 1. Start the relay

```bash
npx designer-mode server
```

The server prints each incoming design request to its stdout as a block delimited by `=== DESIGNER MODE REQUEST ===` and `=== END ===`.

### 2. Read a request

Either stream stdout (preferred — agent reacts as each block arrives) or long-poll the HTTP API for the next queued message:

```bash
# Alternative: HTTP long-poll, blocks up to 300s and returns the next prompt
curl -s http://localhost:3334/api/wait
```

### 3. Apply changes and respond

```bash
curl -X POST http://localhost:3334/api/response \
  -H "Content-Type: text/plain" \
  -d "Done! Applied the changes."
```

### 4. Loop

Go back to step 2 for the next request.

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/message` | POST | Browser sends design request |
| `/api/wait` | GET | Agent long-polls for next request (300s timeout) |
| `/api/response` | POST | Agent sends response to panel |
| `/api/poll` | GET | Panel polls for agent response (30s timeout) |
| `/api/flush` | POST | Drain stale responses |
| `/api/health` | GET | Health check |
