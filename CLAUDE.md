# Designer Mode

A browser-based visual design tool that lets designers inspect and edit UI elements, with changes applied to source code by an AI agent via MCP.

## Architecture

- `packages/core` — Panel, overlay, toggle UI (vanilla TypeScript, Shadow DOM)
- `packages/inspector-*` — Framework-specific adapters (React, Vue, Svelte, Angular, Vanilla)
- `packages/designer-mode` — Framework entry points with `initDesignerMode()`
- `packages/vite-plugin` — Vite plugin that auto-injects designer-mode in dev
- `packages/server` — HTTP relay server + MCP server + CLI tools
- `examples/` — Example apps (vanilla, react, vue)

## Building

```bash
pnpm install
pnpm -r build
# or for core only:
cd packages/core && npx tsup
```

## MCP Integration

The MCP server (`packages/server/src/mcp.js`) exposes:
- `wait_for_design_request` — blocks until the browser panel sends a request
- `send_design_response` — sends a response back to the browser panel
- `designer-mode` prompt — starts the agent loop

Devs add the MCP server to their project via `.mcp.json` and use `/mcp__designer-mode__designer-mode` or say "enter design mode" to start the loop.
