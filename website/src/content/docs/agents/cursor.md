---
title: Cursor
description: Using Designer Mode with Cursor
---

Cursor uses the **Skill** approach — a skill file is installed in your project that teaches Cursor how to run the Designer Mode loop using its `shell` tool with `notify_on_output`.

## Setup

```bash
npx designer-mode setup
```

This installs `.agents/skills/designer-mode/SKILL.md` in your project.

## Usage

1. Open your project in Cursor
2. In the browser, press Ctrl+Shift+D to activate Designer Mode
3. Tell Cursor: **"enter design mode"** or use `/designer-mode`

Cursor will:
1. Start the relay server in the background via `shell` (background mode) with `notify_on_output: "^=== END ===$"`
2. Receive a notification each time the server prints a full design request block
3. Apply code changes
4. Send the response back via `curl POST /api/response`
5. Continue watching the same background process for the next request

## How It Works

The skill file contains the step-by-step instructions Cursor follows:
- Run `npx designer-mode server` in the `shell` tool's background mode
- Set `notify_on_output` to the request-block delimiter (`^=== END ===$`) so each completed request wakes Cursor
- Parse the structured prompt (component name, file path, styles, designer message)
- Read the source file and apply changes
- Send the response via `curl POST /api/response`
- Keep the same server process running for the entire session
