---
title: Configuration
description: Designer Mode configuration options
---

## DesignerModeOptions

These options apply to the Vite plugin, Webpack plugin, manual setup, and browser extension.

| Option | Type | Default | Description |
|---|---|---|---|
| `relayUrl` | `string` | `http://localhost:3334` | Relay server URL |
| `shortcut` | `string` | `ctrl+shift+d` | Keyboard shortcut to toggle the panel |
| `defaultActive` | `boolean` | `false` | Start with the panel open |
| `panelPosition` | `'right' \| 'left'` | `'right'` | Panel position |
| `persistState` | `boolean` | `false` | Remember panel state across page reloads |
| `tokenPatterns` | `TokenPattern[]` | `[]` | Custom design token patterns to detect |

## Vite Plugin

```js
import designerMode from '@designer-mode/vite-plugin';

designerMode({
  relayUrl: 'http://localhost:3334',
  shortcut: 'ctrl+shift+d',
  defaultActive: false,
  panelPosition: 'right',
});
```

## React Native

```tsx
<DesignerModeRN
  relayUrl="http://192.168.1.100:3334"
  active={true}
  onClose={() => {}}
/>
```

| Prop | Type | Description |
|---|---|---|
| `relayUrl` | `string` | Relay server URL (use LAN IP) |
| `active` | `boolean` | Whether the panel is visible |
| `onClose` | `() => void` | Called when the panel is closed |
| `componentRefs` | `Map` | Optional map of component refs for inspection |

## Relay Server

Configure via environment variables:

```bash
DESIGNER_PORT=3334 DESIGNER_HOST=127.0.0.1 npx designer-mode-server
```

See [Relay Server](/reference/relay-server/) for details.
