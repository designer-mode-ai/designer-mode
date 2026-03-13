/**
 * Designer Mode MCP Server
 *
 * Exposes two MCP tools:
 *   wait_for_design_request  — blocks until designer sends a request
 *   send_design_response     — sends response back to designer panel
 *
 * Also starts the HTTP relay server so the browser panel can connect.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { RelayState } from './state.js';
import { createServer } from './server.js';

export async function startMcpServer(options = {}) {
  const port = options.port ?? parseInt(process.env.DESIGNER_PORT ?? '3334', 10);
  const state = new RelayState();

  // Start HTTP relay using the same state
  const httpServer = createServer({ port, state });
  await httpServer.listen();

  const server = new McpServer({
    name: 'designer-mode',
    version: '0.1.0',
  });

  server.tool(
    'wait_for_design_request',
    'Blocks until the designer sends a request from the browser panel. ' +
    'Returns the full structured prompt including component info, styles, changeset, and message. ' +
    'After handling a request, call this tool again to keep listening.',
    {},
    async () => {
      process.stderr.write('[designer-mode] Waiting for design request...\n');
      try {
        const request = await state.waitForMessage(600000); // 10 min
        process.stderr.write('[designer-mode] Request received\n');
        return {
          content: [{ type: 'text', text: request }],
        };
      } catch {
        return {
          content: [{ type: 'text', text: 'Timeout — no request received within 10 minutes. Call this tool again to keep listening.' }],
        };
      }
    }
  );

  server.tool(
    'send_design_response',
    'Send a confirmation response back to the designer panel after applying code changes.',
    { message: z.string().describe('Brief summary of what was changed, e.g. "Done — border-radius updated to 12px"') },
    async ({ message }) => {
      state.sendResponse(message);
      process.stderr.write(`[designer-mode] Response sent: ${message}\n`);
      return {
        content: [{ type: 'text', text: `Response sent to designer panel: ${message}` }],
      };
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('[designer-mode] MCP server ready\n');
}
