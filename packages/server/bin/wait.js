#!/usr/bin/env node
/**
 * designer-mode-wait
 *
 * Long-polls the relay server until a design request arrives.
 * Prints the request to stdout and exits with code 0.
 * On timeout (204), retries automatically — never exits on its own.
 *
 * Status messages → stderr (agent ignores these)
 * Request prompt  → stdout (agent reads this)
 */

const HOST = process.env.DESIGNER_HOST ?? 'localhost';
const PORT = process.env.DESIGNER_PORT ?? '3334';
const URL = `http://${HOST}:${PORT}/api/wait`;
const TIMEOUT_MS = 310_000; // 310s — slightly longer than server's 300s

async function poll() {
  while (true) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const res = await fetch(URL, { signal: controller.signal });
      clearTimeout(timer);

      if (res.status === 200) {
        const text = await res.text();
        process.stdout.write(text + '\n');
        process.exit(0);
      } else if (res.status === 204) {
        // Timeout — retry
        process.stderr.write('.');
      } else {
        process.stderr.write(`\n[designer-mode-wait] Unexpected status ${res.status}, retrying...\n`);
        await sleep(2000);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        process.stderr.write('.');
      } else {
        process.stderr.write(`\n[designer-mode-wait] Connection error: ${err.message}. Retrying in 3s...\n`);
        await sleep(3000);
      }
    }
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

process.stderr.write(`[designer-mode-wait] Waiting for design request on ${URL}...\n`);
poll();
