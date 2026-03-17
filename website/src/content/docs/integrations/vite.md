---
title: Vite Plugin
description: Using Designer Mode as a Vite plugin
---

The Vite plugin is the recommended way to add Designer Mode to any Vite project.

## Install

```bash
npm install @designer-mode/vite-plugin
```

## Configure

```js
// vite.config.js
import designerMode from '@designer-mode/vite-plugin';

export default defineConfig({
  plugins: [
    // your framework plugin (react, vue, svelte, etc.)
    designerMode(),
  ],
});
```

## Options

```js
designerMode({
  // Relay server URL (default: http://localhost:3334)
  relayUrl: 'http://localhost:3334',

  // Keyboard shortcut to toggle (default: Ctrl+Shift+D)
  shortcut: 'ctrl+shift+d',

  // Start with panel active (default: false)
  defaultActive: false,

  // Panel position (default: 'right')
  panelPosition: 'right',
})
```

## How It Works

The plugin:
1. Auto-detects your framework (React, Vue, Svelte, etc.)
2. Injects the Designer Mode runtime into your dev server
3. Only active in development — zero impact on production builds
