---
title: Agent Setup
description: Connect Designer Mode to your AI coding agent
---

Designer Mode communicates with your AI agent through a relay server. There are two ways to connect your agent:

## Two Approaches

### MCP (Recommended)

The **MCP (Model Context Protocol)** approach uses tool calls — your agent calls `wait_for_design_request` and `send_design_response` directly. No CLI polling, no curl commands. The MCP server handles everything.

**Best for:** Claude Code, GitHub Copilot, and any MCP-compatible agent.

### Skill

The **Skill** approach installs a skill file into your project that teaches the agent to launch the relay server in the background, stream its stdout for incoming design requests, and respond via curl. Works with any agent whose harness exposes background processes and stdout subscription (Claude Code's `Monitor`, Cursor's `shell` with `notify_on_output`, etc.).

**Best for:** Cursor and any MCP-less agent with stdout streaming.

---

## MCP Setup (Recommended)

### 1. Add to `.mcp.json`

Create or edit `.mcp.json` in your project root:

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

This starts both the relay server and the MCP tool interface automatically.

### 2. Use it

Tell your agent: **"start designer mode"** or **"enter design mode"**

The agent will:
1. Call `wait_for_design_request` to wait for a request from the browser
2. Receive full context (component, file, styles, your message)
3. Edit the source code
4. Call `send_design_response` to reply to the panel
5. Loop back to step 1

---

## Skill Setup

### 1. Install the skill

```bash
npx designer-mode setup
```

This copies the Designer Mode skill into your project:
- `.claude/skills/designer-mode/SKILL.md` — for Claude Code
- `.agents/skills/designer-mode/SKILL.md` — for Cursor, Codex, Gemini CLI

### 2. Use it

Tell your agent: **"enter design mode"** or use the `/designer-mode` slash command.

The agent will:
1. Start the relay server in the background (`npx designer-mode server`)
2. Stream the server's stdout — using `Monitor` (Claude Code), `notify_on_output` (Cursor), or an equivalent — to receive each design request block as it arrives
3. Read the structured prompt (component info, file path, styles, message)
4. Apply code changes
5. Send response via `curl -X POST http://localhost:3334/api/response`
6. Keep watching for the next request — one server process for the whole session

---

## Agent-Specific Guides

| Agent | Recommended Approach | Guide |
|---|---|---|
| Claude Code | MCP | [Claude Code](/agents/claude-code/) |
| Cursor | Skill | [Cursor](/agents/cursor/) |
| GitHub Copilot | MCP | [GitHub Copilot](/agents/github-copilot/) |
| Codex, Aider, Gemini | Skill | [Other Agents](/agents/other/) |

## How It Works

Both approaches use the same relay server under the hood:

```
Browser (Inspector Panel)
    ↓ POST /api/message
Relay Server (localhost:3334)
    ↓
    ├─ MCP: agent calls wait_for_design_request tool
    └─ Skill: agent watches server's stdout (Monitor / notify_on_output)

Agent reads prompt, applies code changes

    ├─ MCP: agent calls send_design_response tool
    └─ Skill: agent curls POST /api/response
    ↓
Relay Server
    ↓ GET /api/poll
Browser Panel (shows response)
```
