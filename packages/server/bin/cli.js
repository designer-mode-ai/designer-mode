#!/usr/bin/env node
/**
 * designer-mode <command>
 *
 * Commands:
 *   setup    Install the designer-mode skill for your AI agent
 *   server   Start the relay server
 *   wait     Wait for a design request from the browser panel
 *   mcp      Start the MCP server (relay + tools)
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
  case 'wait': {
    await import('./wait.js');
    break;
  }
  case 'mcp': {
    const { startMcpServer } = await import('../src/mcp.js');
    startMcpServer();
    break;
  }
  default:
    console.log(`
designer-mode <command>

Commands:
  setup    Install the designer-mode skill for your AI agent
  server   Start the relay server
  wait     Wait for a design request from the browser panel
  mcp      Start the MCP server (relay + tools)

Examples:
  npx designer-mode setup
  npx designer-mode server
  npx designer-mode wait
  npx designer-mode mcp
`);
}
