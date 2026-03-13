#!/usr/bin/env node
/**
 * designer-mode <command>
 *
 * Commands:
 *   setup    Install agent rule for your AI tool
 *   server   Start the relay server (alias for designer-mode-server)
 */

import { runSetup } from '../src/setup.js';

const [,, command, ...args] = process.argv;

switch (command) {
  case 'setup':
    runSetup({ yes: args.includes('--yes') || args.includes('-y') });
    break;
  case 'server': {
    const { createServer } = await import('../src/server.js');
    const server = createServer();
    server.listen();
    break;
  }
  default:
    console.log(`
designer-mode <command>

Commands:
  setup    Install agent rule for your AI coding tool
  server   Start the relay server

Examples:
  npx designer-mode setup
  npx designer-mode-server
  npx designer-mode-wait
  npx designer-mode-mcp
`);
}
