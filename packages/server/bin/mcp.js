#!/usr/bin/env node
import { startMcpServer } from '../src/mcp.js';

startMcpServer().catch(err => {
  process.stderr.write(`[designer-mode-mcp] Fatal: ${err.message}\n`);
  process.exit(1);
});
