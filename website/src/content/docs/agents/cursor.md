---
title: Cursor
description: Using Designer Mode with Cursor
---

Cursor uses the **Skill** approach — a skill file is installed in your project that teaches Cursor how to run the Designer Mode loop.

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
1. Start the relay server
2. Poll for design requests
3. Apply code changes
4. Send responses back to the panel
5. Keep polling for more requests

## How It Works

The skill file contains step-by-step instructions that Cursor follows:
- Run `npx designer-mode wait` to long-poll for requests
- Parse the structured output (component name, file path, styles, user message)
- Read the source file and apply changes
- Send the response via `curl POST /api/response`
- Loop back to waiting
