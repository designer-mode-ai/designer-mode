## Designer Mode

When asked to start designer mode or listen for design requests:

### Start the relay server

```bash
npx designer-mode-server &
```

Inform the user: "Designer Mode ready. Open your app and press Ctrl+Shift+D."

### Run the wait loop

```bash
npx designer-mode-wait
```

This blocks until a design request arrives. When it exits, the request is on
stdout. Read it, apply the changes to source files, then:

```bash
curl -s -X POST http://localhost:3334/api/response \
  -H "Content-Type: text/plain" \
  -d "Done — <summary>"
```

Then run `npx designer-mode-wait` again. Never stop the loop until explicitly asked.
