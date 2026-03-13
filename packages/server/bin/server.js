#!/usr/bin/env node
import { createServer } from '../src/server.js';

const server = createServer();
server.listen().catch(err => {
  console.error('[designer-mode] Failed to start server:', err.message);
  process.exit(1);
});

process.on('SIGINT', async () => {
  await server.close();
  process.exit(0);
});
