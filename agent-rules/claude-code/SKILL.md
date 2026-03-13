# designer-mode skill

Activate when user says: "start designer mode", "run designer mode",
"listen for design requests", "designer loop", "/designer-mode"

## Steps

1. Start relay server in background:
   ```bash
   npx designer-mode-server &
   ```

2. Tell the user:
   > Designer Mode ready. Activate the inspector in your app (🎨 button or
   > **Ctrl+Shift+D**), click an element, and Send your request.

3. Run `npx designer-mode-wait` — blocks until a design request arrives.
   Use a **10-minute timeout** on the Bash tool call.

4. Read the output (component, file, styles, changeset, message).

5. Apply changes to source code (edit the file indicated).

6. Send response:
   ```bash
   curl -s -X POST http://localhost:3334/api/response \
     -H "Content-Type: text/plain" \
     -d "Done — <summary of changes>"
   ```

7. **IMMEDIATELY** run `npx designer-mode-wait` again. Never skip this step.

## Critical Rule

After every request: **apply → curl → designer-mode-wait**. Always.
Never stop the loop unless the user explicitly asks to exit Designer Mode.

## Stopping

```bash
pkill -f designer-mode-server
```
