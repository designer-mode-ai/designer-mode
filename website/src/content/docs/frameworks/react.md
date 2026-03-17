---
title: React
description: Using Designer Mode with React
---

Designer Mode auto-detects React via fiber internals and provides component names, props, file paths, and the component tree.

## With Vite

```bash
npm install @designer-mode/vite-plugin
```

```js
// vite.config.js
import react from '@vitejs/plugin-react';
import designerMode from '@designer-mode/vite-plugin';

export default defineConfig({
  plugins: [react(), designerMode()],
});
```

## Manual Setup

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

## What the Agent Sees

When you click a React component, the agent receives:

- **Component name** — e.g. `PrimaryButton`
- **File path** — e.g. `src/components/PrimaryButton.tsx:24`
- **Props** — key props passed to the component
- **Ancestor chain** — e.g. `App > Layout > Sidebar > PrimaryButton`
- **Current styles** — computed CSS styles
- **Layout** — position, dimensions, padding, margin
