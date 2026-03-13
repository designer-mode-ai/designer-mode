## Designer Mode Convention

When the user asks to start designer mode:

1. Run in a separate terminal: `npx designer-mode-server`
2. Tell the user: "Designer Mode ready. Press Ctrl+Shift+D to activate."
3. Run: `npx designer-mode-wait` (via `/run` in aider chat)
4. Aider will receive the design request as command output
5. Apply the changes based on the request
6. Run: `npx designer-mode-respond "Done — <summary>"`
   (or: `curl -s -X POST http://localhost:3334/api/response -H "Content-Type: text/plain" -d "Done — <summary>"`)
7. Run `npx designer-mode-wait` again immediately

Keep looping until the user says to stop.
