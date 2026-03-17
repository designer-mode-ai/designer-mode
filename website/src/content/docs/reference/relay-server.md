---
title: Relay Server
description: The Designer Mode relay server API
---

The relay server is a lightweight HTTP server that passes messages between the browser panel and your AI agent.

## Start

```bash
npx designer-mode-server
```

Default: `http://127.0.0.1:3334`

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DESIGNER_PORT` | `3334` | Server port |
| `DESIGNER_HOST` | `127.0.0.1` | Bind address. Use `0.0.0.0` for LAN access (React Native) |

## API Endpoints

### POST /api/message

Browser sends a design request.

**Body:** Plain text — the formatted prompt with component info, styles, and user message.

**Response:** `{ "ok": true }`

### GET /api/wait

Agent long-polls for the next design request.

**Timeout:** 300 seconds. Returns `204 No Content` on timeout.

**Response:** `200` with the request body as plain text.

### POST /api/response

Agent sends a response back to the browser panel.

**Body:** Plain text — the agent's response message.

**Response:** `{ "ok": true }`

### GET /api/poll

Browser panel polls for the agent's response.

**Timeout:** 30 seconds. Returns `204 No Content` on timeout.

**Response:** `200` with the response body as plain text.

### POST /api/flush

Drain any stale responses from the queue. Called before sending a new request to avoid showing responses from previous requests.

**Response:** `{ "ok": true }`

### GET /api/health

Health check.

**Response:** `{ "ok": true, "version": "0.1.0" }`
