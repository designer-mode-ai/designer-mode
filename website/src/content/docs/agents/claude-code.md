---
title: Claude Code
description: Using Designer Mode with Claude Code
---

Claude Code supports both **MCP** and **Skill** approaches.

## MCP (Recommended)

MCP gives Claude direct tool access — no CLI polling or curl commands needed.

### Setup

Add to your project's `.mcp.json`:

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

Enable it in `.claude/settings.local.json`:

```json
{
  "enabledMcpjsonServers": ["designer-mode"]
}
```

### Usage

Say: **"start designer mode"** or **"enter design mode"**

Claude will use the MCP tools to:
1. Call `wait_for_design_request` — blocks until a request arrives
2. Receive full context (component, file, styles, your message)
3. Edit the source files
4. Call `send_design_response` — replies to the panel
5. Loop automatically

## Skill

The skill approach works without MCP configuration. Claude starts the relay server in the background and uses the `Monitor` tool to stream design requests from its stdout.

### Setup

```bash
npx designer-mode setup
```

This creates `.claude/skills/designer-mode/SKILL.md` with the full instruction set.

### Usage

Say: **"enter design mode"** or use `/designer-mode`

Claude will:
1. Start the relay server in the background (`Bash(run_in_background: true)` running `npx designer-mode server`)
2. Attach the `Monitor` tool to that shell — each new design request arrives as a notification
3. Apply code changes based on the request
4. Respond via `curl POST /api/response`
5. Keep watching the same background server — no restart between requests

## Which to Choose?

**MCP** is recommended — it's cleaner, faster, and Claude handles the loop through structured tool calls with no permission prompts for the response. Use **Skill** if you prefer not to configure MCP, or want the same setup across multiple agents (Claude Code + Cursor share the streaming pattern).
