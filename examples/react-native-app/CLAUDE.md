# Designer Mode — React Native Example App

This is an Expo React Native app for testing Designer Mode.

## How to test

1. Start the Expo app: `npx expo start` (in this directory)
2. Open the app on a device/simulator
3. In Claude Code (from this directory), say: "enter design mode"
4. In the app, tap the 🎨 button to activate the inspector
5. Tap any component → the panel opens → type a change or edit values → hit Apply/Send
6. Claude will receive the request, apply changes to source files, and respond

## Architecture

- `App.tsx` — Main app with FAB to toggle Designer Mode
- `components/` — Card, PrimaryButton, ColorSwatch — sample components to inspect
- `designer-mode-rn` — The inspector panel (from `packages/rn`)
- MCP server — Runs the relay + exposes `wait_for_design_request` / `send_design_response` tools

## Key files to modify

When design requests come in, they'll reference these files:
- `App.tsx` — styles at bottom, main layout
- `components/Card.tsx` — card container styles
- `components/PrimaryButton.tsx` — button styles
- `components/ColorSwatch.tsx` — swatch display styles
