# Designer Mode — Agent Instructions

## What is this?

Designer Mode lets designers click UI elements in the browser and send style
change requests directly to you (the AI agent). You apply changes to source
code, hot reload shows the result, the designer iterates.

## Setup

Run once per session in a terminal:

```bash
npx designer-mode-server
```

Tell the user:
> Designer Mode is ready. Open your app in the browser and press Ctrl+Shift+D
> (or click the 🎨 toggle button) to activate the inspector. Click any element
> and send your request.

## The Loop

### 1. Wait for a request

```bash
npx designer-mode-wait
```

This command blocks (up to 5 minutes) until the designer sends a request from
the browser. When a request arrives, it prints to stdout and exits.

If it exits with no output (timeout), run it again immediately.

### 2. Read the request

```
=== DESIGNER MODE REQUEST ===

Selected Element
  Component : PrimaryButton
  File      : src/components/PrimaryButton.tsx:23
  Test ID   : primary-button
  Classes   : btn btn-primary

Layout
  display   : flex
  width     : 120px
  height    : 40px

Typography
  font-size   : 14px
  font-weight : 600

Spacing
  padding : 8px 16px

Borders
  border-radius : 8px

Changeset (inline edits by designer)
  border-radius : 8px → 12px
  background-color : #037DD6 → #0260b4

Designer Message
  "Make the corners rounder and use a slightly darker shade of blue"

=== END ===
```

### 3. Apply changes

Open the file at the given path and line number. Apply the requested changes:
- If there's a changeset, apply those specific style changes
- If there's a message, apply whatever the designer is asking for
- If both, use the message as the intent and the changeset as hints

### 4. Respond

```bash
curl -s -X POST http://localhost:3334/api/response \
  -H "Content-Type: text/plain" \
  -d "Done — updated border-radius to 12px and darkened background"
```

### 5. CRITICAL: Loop

**Immediately run `npx designer-mode-wait` again.**

This is the most important step. The designer is waiting for you to re-enter
the loop so they can send another request. If you don't do this, the panel
will appear stuck.

## Stopping Designer Mode

When the user says "stop designer mode" or "exit designer loop":

```bash
pkill -f designer-mode-server
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DESIGNER_PORT` | `3334` | Relay server port |
| `DESIGNER_HOST` | `127.0.0.1` | Relay server host |

For React Native (LAN access from a physical device), set:
```bash
DESIGNER_HOST=0.0.0.0 npx designer-mode-server
```
Then use your machine's LAN IP as `relayUrl` in the app.
