---
title: Webpack Plugin
description: Using Designer Mode as a Webpack plugin
---

For projects using Webpack (Next.js, Create React App, Angular CLI, etc.).

## Install

```bash
npm install @designer-mode/webpack-plugin
```

## Configure

```js
// webpack.config.js
const DesignerModePlugin = require('@designer-mode/webpack-plugin');

module.exports = {
  plugins: [new DesignerModePlugin()],
};
```

## Options

```js
new DesignerModePlugin({
  relayUrl: 'http://localhost:3334',
  shortcut: 'ctrl+shift+d',
  defaultActive: false,
  panelPosition: 'right',
})
```
