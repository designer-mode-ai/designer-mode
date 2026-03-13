## Designer Mode

When the user says "start designer mode", "run designer mode", or
"listen for design requests", run the following loop:

### Setup (once per session)

```bash
npx designer-mode-server &
```

Announce: "Designer Mode ready. Press Ctrl+Shift+D in your app to activate."

### Loop

```bash
npx designer-mode-wait
```

This command blocks until a design request arrives, then prints the request to
stdout and exits. Read the request, apply the changes to source code, then send
a response:

```bash
curl -s -X POST http://localhost:3334/api/response \
  -H "Content-Type: text/plain" \
  -d "Done — <summary>"
```

Then **immediately run `npx designer-mode-wait` again**.

### Critical

Never stop the loop until the user explicitly says "stop designer mode".
The designer is iterating in real time and depends on you re-entering the loop.

### Environment Variables

- `DESIGNER_PORT` — relay port (default: 3334)
- `DESIGNER_HOST` — relay host (default: 127.0.0.1)
