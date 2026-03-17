---
title: Architecture
description: How Designer Mode works under the hood
---

## Overview

Designer Mode has three layers:

```
┌─────────────────────────┐
│   Browser (Inspector)    │
│   Shadow DOM panel +     │
│   element overlay        │
└───────────┬─────────────┘
            │ HTTP
┌───────────▼─────────────┐
│   Relay Server           │
│   localhost:3334         │
│   In-memory queue        │
└───────────┬─────────────┘
            │ HTTP / MCP
┌───────────▼─────────────┐
│   AI Agent               │
│   Reads prompt, edits    │
│   source code            │
└─────────────────────────┘
```

## Inspector Panel

The panel renders inside a **Shadow DOM** container to avoid CSS conflicts with the host page. It includes:

- **Element overlay** — highlights the hovered/selected element
- **Style inspector** — shows computed styles grouped by category (layout, spacing, typography, colors)
- **Chat interface** — send messages to your agent and see responses
- **Edit mode** — directly modify style values inline

## Framework Adapters

Each adapter implements the `InspectorAdapter` interface:

- `getComponentInfo(element)` — returns component name, file path, props
- `getElementStyle(element)` — returns current styles

Adapters:
- **React** — walks React fiber tree for component names, source locations, props
- **Vue** — uses `__vue__` / `__vue_app__` for component data
- **Svelte** — reads `__svelte_meta` for component info
- **Angular** — uses Angular debug APIs
- **Vanilla** — plain DOM inspection (tag, classes, id)
- **React Native** — fiber tree + StyleSheet.create patching for style names

## Relay Server

A minimal HTTP server with an in-memory queue. No database, no WebSocket — just HTTP long-polling.

The relay is intentionally simple: it's a pass-through that doesn't interpret messages. This keeps it framework and agent agnostic.

## Agent Integration

Agents connect via:
- **MCP** — Model Context Protocol tools (`wait_for_design_request`, `send_design_response`)
- **CLI** — `designer-mode-wait` command that long-polls and prints the prompt
- **HTTP** — Direct API calls to the relay endpoints
