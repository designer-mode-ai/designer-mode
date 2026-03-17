---
title: Angular
description: Using Designer Mode with Angular
---

Designer Mode detects Angular components via `ng-version` attributes and Angular debug APIs.

## Setup

```bash
npm install designer-mode @designer-mode/inspector-angular
```

Add the Designer Mode script to your Angular app or use the Webpack plugin.

## What the Agent Sees

- **Component name** — Angular component class name
- **Selector** — e.g. `app-header`
- **Current styles** — computed CSS including component-scoped styles
