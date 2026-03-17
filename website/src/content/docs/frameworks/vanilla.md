---
title: Vanilla JS
description: Using Designer Mode with plain HTML/JS
---

Designer Mode works on any web page — no framework required. The vanilla adapter inspects plain DOM elements.

## Setup

Use the browser extension (no code changes needed) or add the script manually:

```html
<script type="module">
  import { DesignerModeCore } from '@designer-mode/core';
  DesignerModeCore.autoInit();
</script>
```

Or use the Vite plugin in a vanilla Vite project.

## What the Agent Sees

- **Element** — tag name, id, classes
- **Current styles** — computed CSS
- **Layout** — dimensions, position, box model
- **Text content** — inner text (truncated)
