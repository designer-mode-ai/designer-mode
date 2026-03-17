---
title: Quick Start
description: Get up and running with Designer Mode in under 2 minutes
---

## Vite (Recommended)

Works with React, Vue, Svelte, or any Vite project.

```bash
npm install @designer-mode/vite-plugin
```

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

## Webpack

```bash
npm install @designer-mode/webpack-plugin
```

```js
// webpack.config.js
const DesignerModePlugin = require('@designer-mode/webpack-plugin');

module.exports = {
  plugins: [new DesignerModePlugin()],
};
```

## Browser Extension

No build tool changes needed — install the extension and it works on any site.

1. Build the extension: `cd packages/extension && pnpm build`
2. Load `packages/extension/dist` as an unpacked extension in Chrome
3. Click the extension icon on any page

## React (Manual)

```bash
npm install designer-mode
```

```tsx
import { DesignerMode } from 'designer-mode/react';

function App() {
  return (
    <DesignerMode>
      <YourApp />
    </DesignerMode>
  );
}
```

## Connect Your Agent

There are two ways to connect your AI agent:

### MCP (Recommended)

Add to `.mcp.json` in your project:

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

Then tell your agent: **"enter design mode"**

### Skill

```bash
npx designer-mode setup
```

This installs a skill file that teaches your agent to poll for requests and apply changes. Then tell your agent: **"enter design mode"**

## Next Steps

- [Agent Setup](/agent-setup/) — Detailed setup for both MCP and Skill approaches
- [Frameworks](/frameworks/react/) — Framework-specific guides
