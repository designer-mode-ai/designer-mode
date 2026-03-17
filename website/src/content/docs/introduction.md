---
title: Introduction
description: What is Designer Mode and why use it
---

Designer Mode is an AI-powered UI inspector that closes the gap between design and code. Inspect, tweak, and iterate on your UI directly in the browser — an AI agent updates the source code in real time.

## The Problem

The design-to-code loop is broken.

1. Designer creates a mockup in Figma
2. Writes a spec or leaves comments
3. Developer interprets the spec, searches for the right file and component
4. Developer makes the change, pushes a PR
5. Designer reviews — "that's not quite right, the padding should be 24 not 16"
6. Back to step 3. Repeat for days.

Every hand-off introduces translation loss. Every round-trip takes hours or days. Small visual tweaks — a color, a spacing, a font size — shouldn't require this much friction.

With Designer Mode:
1. Click the element in the browser
2. Type "make the padding 24px"
3. Done. The AI agent updates the source code. Hot reload shows the result.

## Why Designer Mode?

- **Instant feedback loop** — See changes in seconds, not days. No more waiting for a developer to interpret a Figma mockup and ship it.
- **Zero translation loss** — Point at the exact element and say what you want. No ambiguity, no misinterpretation, no back-and-forth.
- **No code skills needed** — Work visually in the browser. The AI agent handles finding the right file, component, and prop to change.
- **Works with the real product** — Not a mockup or prototype. Tweak the actual running app with real data and real components.
- **AI does the heavy lifting** — The agent figures out which file, which component, and which prop to change. Just describe what you want in plain language.
- **Designer opens the PR, dev reviews** — The designer drives the changes and opens the pull request. Developers review the code — not interpret mockups. Everyone stays in their lane.

## How It Works

1. **Inspect** — Hover and click any element to see its component name, styles, design tokens, and props.
2. **Tweak** — Edit styles, text, colors, and spacing inline. Changes appear live in the browser instantly.
3. **Send** — Describe what you want or click Apply. The AI agent receives your edits and message with full context.
4. **Ship** — The agent updates the source code. Hot reload kicks in. Repeat until it's perfect.

## Agent Integration

There are two ways to connect your AI agent:

- **MCP (Recommended)** — Your agent calls `wait_for_design_request` and `send_design_response` tools directly via Model Context Protocol. No CLI polling needed. Best for Claude Code and GitHub Copilot.
- **Skill** — A skill file is installed in your project that teaches the agent to poll via CLI and respond via curl. Works with any agent that can run shell commands — Cursor, Codex, Gemini CLI, Aider, and more.

Both approaches use the same relay server under the hood. See [Agent Setup](/agent-setup/) for details.

## Architecture

Designer Mode has three parts:

1. **Inspector Panel** — A Shadow DOM overlay in the browser that lets you click elements and see their styles
2. **Relay Server** — A lightweight HTTP server (`localhost:3334`) that passes messages between the panel and your agent
3. **Agent Integration** — MCP tools or a skill-based CLI loop connects your agent to the relay

## Works With

| | Supported |
|---|---|
| **Frameworks** | React, Vue, Svelte, Angular, vanilla JS, React Native |
| **AI Agents** | Claude Code, Cursor, GitHub Copilot, Codex, Aider, Gemini |
| **Build Tools** | Vite, Webpack, browser extension |

## Packages

| Package | Description |
|---|---|
| `designer-mode` | Main package — auto-detects framework |
| `@designer-mode/core` | Shadow DOM panel, overlay, relay client |
| `@designer-mode/server` | Relay server, CLI, MCP server |
| `@designer-mode/vite-plugin` | Vite plugin (recommended) |
| `@designer-mode/webpack-plugin` | Webpack plugin |
| `@designer-mode/extension` | Browser extension (MV3) |
| `@designer-mode/react-native` | React Native inspector |
