---
title: Vue
description: Using Designer Mode with Vue 3 and Vue 2
---

Designer Mode supports both Vue 3 and Vue 2, auto-detected via `__vue_app__` or `__vue__` on root elements.

## With Vite (Vue 3)

```bash
npm install @designer-mode/vite-plugin
```

```js
// vite.config.js
import vue from '@vitejs/plugin-vue';
import designerMode from '@designer-mode/vite-plugin';

export default defineConfig({
  plugins: [vue(), designerMode()],
});
```

## What the Agent Sees

- **Component name** — from Vue's component definition
- **File path** — from `__file` property (dev mode)
- **Props** — component props
- **Current styles** — computed CSS
- **Scoped styles** — detects Vue scoped CSS attributes
