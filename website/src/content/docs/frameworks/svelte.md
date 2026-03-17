---
title: Svelte
description: Using Designer Mode with Svelte
---

Designer Mode detects Svelte components via `__svelte_meta` on elements.

## With Vite

```bash
npm install @designer-mode/vite-plugin
```

```js
// vite.config.js
import { svelte } from '@sveltejs/vite-plugin-svelte';
import designerMode from '@designer-mode/vite-plugin';

export default defineConfig({
  plugins: [svelte(), designerMode()],
});
```

## What the Agent Sees

- **Component name** — from Svelte metadata
- **File path** — `.svelte` file location
- **Current styles** — computed CSS including scoped styles
