# Designer Mode — Cursor Rule

Activate when the user says: "start designer mode", "run designer mode",
"designer loop", "listen for design requests"

## What Designer Mode Does

You will run a loop where you:
1. Wait for the designer (in browser/app) to click an element and send a request
2. Read what they want changed (component, file, styles, message)
3. Apply the changes to source code
4. Send a response back to the browser panel
5. Immediately wait for the next request

## Steps

### 1. Start the relay server (once per session)

```bash
npx designer-mode-server &
```

Tell the user:
> Designer Mode ready. Open your app in the browser and press **Ctrl+Shift+D** (or click the 🎨 button) to activate the inspector. Click an element, type your request, and hit Send.

### 2. Wait for a design request

```bash
npx designer-mode-wait
```

**CRITICAL**: Use `block_until_ms: 600000` on this bash tool call. This makes the
tool block (not timeout) while waiting. The tool will exit when a request arrives.

### 3. Read the request

The request will be printed to stdout in this format:

```
=== DESIGNER MODE REQUEST ===

Selected Element
  Component : PrimaryButton
  File      : src/components/PrimaryButton.tsx:23

Layout / Typography / Spacing / Borders / Effects
  (current computed styles)

Changeset (inline edits made by designer)
  border-radius : 8px → 12px

Designer Message
  "Make the corners rounder"

=== END ===
```

### 4. Apply the changes

Open the file indicated (e.g. `src/components/PrimaryButton.tsx:23`).
Apply the requested changes — update styles, classes, props, or whatever the
message asks for. Hot reload will show the result in the browser immediately.

### 5. Send the response

```bash
curl -s -X POST http://localhost:3334/api/response \
  -H "Content-Type: text/plain" \
  -d "Done — <brief summary of what you changed>"
```

### 6. IMMEDIATELY run designer-mode-wait again

Go back to step 2. **Do not stop the loop.** The designer is waiting for the
next iteration to continue.

---

## CRITICAL: Always Re-run designer-mode-wait

After every request: **apply → curl → designer-mode-wait**. Always.

The number one failure mode is forgetting to re-enter the loop after applying
changes. If you don't re-run `designer-mode-wait`, the designer's next request
will hang and they'll think the agent is broken.

---

## Stopping

The designer will tell you when to stop (e.g. "stop designer mode", "exit loop").
Or they can press × in the panel. When you stop, kill the server:

```bash
pkill -f designer-mode-server
```
