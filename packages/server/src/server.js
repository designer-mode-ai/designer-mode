/**
 * Designer Mode Relay Server
 *
 * HTTP relay between the browser panel and AI agent CLIs / MCP.
 *
 * Endpoints:
 *   POST /api/message   — browser sends design request
 *   GET  /api/wait      — agent CLI long-polls (300s timeout)
 *   POST /api/response  — agent sends response back to panel
 *   GET  /api/poll      — panel polls for agent response (30s timeout)
 *   GET  /api/health    — health check
 */

import http from 'http';
import { RelayState } from './state.js';

/**
 * @param {{ port?: number, host?: string, state?: RelayState }} options
 */
export function createServer(options = {}) {
  const port = options.port ?? parseInt(process.env.DESIGNER_PORT ?? '3334', 10);
  const host = options.host ?? process.env.DESIGNER_HOST ?? '127.0.0.1';
  const state = options.state ?? new RelayState();

  const server = http.createServer((req, res) => {
    // CORS headers — allow browser panel on any origin (localhost only in practice)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url ?? '/', `http://${host}`);

    if (req.method === 'POST' && url.pathname === '/api/message') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        state.receiveMessage(body);
        console.log(`[designer-mode] ← Request received (${body.length} bytes)`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      });

    } else if (req.method === 'GET' && url.pathname === '/api/wait') {
      console.log(`[designer-mode] ⏳ Agent waiting...`);
      state.waitForMessage(300000)
        .then(msg => {
          console.log(`[designer-mode] → Delivered to agent`);
          res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end(msg);
        })
        .catch(() => {
          res.writeHead(204);
          res.end();
        });

    } else if (req.method === 'POST' && url.pathname === '/api/response') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        state.sendResponse(body);
        console.log(`[designer-mode] ← Agent response sent to panel`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      });

    } else if (req.method === 'GET' && url.pathname === '/api/poll') {
      state.waitForResponse(30000)
        .then(msg => {
          res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end(msg);
        })
        .catch(() => {
          res.writeHead(204);
          res.end();
        });

    } else if (req.method === 'GET' && url.pathname === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, version: '0.1.0' }));

    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  return {
    state,
    listen() {
      return new Promise((resolve) => {
        server.listen(port, host, () => {
          console.log(`[designer-mode] Relay server listening on http://${host}:${port}`);
          resolve(undefined);
        });
      });
    },
    close() {
      return new Promise((resolve) => server.close(() => resolve(undefined)));
    },
  };
}
