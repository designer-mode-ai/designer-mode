---
title: React Native
description: Using Designer Mode with React Native and Expo
---

Designer Mode works on React Native apps via the `@designer-mode/react-native` package. The inspector panel renders natively and communicates with the relay server over your local network.

## Setup

```bash
npm install @designer-mode/react-native
```

```tsx
import { DesignerModeRN } from '@designer-mode/react-native';

function App() {
  const [active, setActive] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <YourApp />
      <DesignerModeRN
        relayUrl="http://192.168.1.100:3334"
        active={active}
        onClose={() => setActive(false)}
      />
      <TouchableOpacity onPress={() => setActive(true)}>
        <Text>Open Designer Mode</Text>
      </TouchableOpacity>
    </View>
  );
}
```

**Important:** Use your machine's LAN IP address (not `localhost`) since the mobile device connects over WiFi.

## Relay Server

Start the relay bound to all interfaces:

```bash
DESIGNER_HOST=0.0.0.0 npx designer-mode-server
```

Or configure in `.mcp.json`:

```json
{
  "mcpServers": {
    "designer-mode": {
      "command": "npx",
      "args": ["designer-mode-server", "mcp"],
      "env": { "DESIGNER_HOST": "0.0.0.0" }
    }
  }
}
```

## What the Agent Sees

- **Component name** — from React fiber tree
- **File path** — source file and line number
- **Props** — component and parent props
- **Ancestor chain** — component tree path
- **Style names** — e.g. `styles.container`, `styles.title`
- **Inline styles** — current style values
- **Layout** — position, dimensions from `onLayout`
