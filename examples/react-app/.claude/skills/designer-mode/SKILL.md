---
name: designer-mode
description: Enter Designer Mode to listen for visual design change requests from the browser. Use when the user says "enter design mode", "start design mode", "run designer mode", or "designer loop".
---

# Designer Mode

A browser panel lets designers inspect elements and request design changes. You apply those changes to the source code.

## Steps

1. Start the relay server in background:
   ```bash
   npx designer-mode server &
   ```
   Wait for it to confirm "Listening on http://localhost:3334".

2. Tell the user:
   > Designer Mode is active. I'm now listening for design requests from the browser.
   >
   > To use it:
   > - Open your app in the browser
   > - Click the 🎨 Designer Mode button to activate the inspector
   > - Hover over elements to see component info
   > - Click an element to lock the selection and open the full editor
   > - Type a change request in the chat input (e.g. "make the border radius 12px") and hit send
   > - I'll apply the changes to your source code and respond in the panel
   >
   > I'll keep listening until you tell me to stop.

3. Run `npx designer-mode wait` — this blocks until a design request arrives and prints the structured prompt to stdout. Use a 10-minute timeout.

4. Read the output — it contains the component name, file path, line number, current styles, any visual edits the designer made, and their message.

5. Read the relevant source files based on the file path provided.

6. Apply the requested design changes to the source code.

7. Send a response back to the panel:
   ```bash
   curl -s -X POST http://localhost:3334/api/response \
     -H "Content-Type: text/plain" \
     -d "Done — <brief summary of what was changed>"
   ```

8. **IMMEDIATELY** go back to step 3 and run `npx designer-mode wait` again.

## Critical Rule

After every request: **apply changes → send response → designer-mode wait**. Always.
Never stop the loop unless the user explicitly says to stop or exit Designer Mode.

## Stopping

When the user wants to exit:
```bash
pkill -f "designer-mode server"
```
