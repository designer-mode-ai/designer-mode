# Designer Mode

**Close the gap between design and code.**

No more mockup hand-offs, misinterpreted specs, or waiting days for a padding change. Designers drive the UI directly.

Inspect, tweak, and iterate on your UI in the browser — an AI agent updates the source code in real time.

## How It Works

1. **Inspect** — Hover and click any element to see its component name, styles, design tokens, and props.
2. **Tweak** — Edit styles, text, colors, and spacing inline. Changes appear live in the browser.
3. **Send** — Describe what you want or click Apply. The AI agent receives your edits with full context.
4. **Ship** — The agent updates the source code. Hot reload kicks in. Repeat until it's perfect.

## Quick Start

### Vite (React / Vue / Svelte)

```js
// vite.config.js
import designerMode from '@designer-mode/vite-plugin';

export default defineConfig({
  plugins: [
    // your framework plugin,
    designerMode(),
  ],
});
```

Start your dev server and press **Ctrl+Shift+D** in the browser.

### Connect Your Agent

**MCP (Recommended)** — Add to `.mcp.json`:

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

**Skill** — Install the skill file:

```bash
npx designer-mode setup
```

Then tell your agent: **"enter design mode"**

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
| `@designer-mode/vite-plugin` | Vite plugin |
| `@designer-mode/webpack-plugin` | Webpack plugin |
| `@designer-mode/extension` | Browser extension (MV3) |
| `@designer-mode/react-native` | React Native inspector |

## Architecture

```
Browser (Inspector Panel)
    ↓ POST /api/message
Relay Server (localhost:3334)
    ↓
    ├─ MCP: agent calls wait_for_design_request tool
    └─ Skill: agent runs npx designer-mode wait
AI Agent
    → Reads prompt, applies code changes
    ↓
    ├─ MCP: agent calls send_design_response tool
    └─ Skill: agent curls POST /api/response
Relay Server
    ↓ GET /api/poll
Browser Panel (shows response)
```

## Examples

```bash
cd examples/react-app && pnpm dev
cd examples/vue-app && pnpm dev
cd examples/vanilla-app && pnpm dev
cd examples/react-native-app && npx expo start
```

