/**
 * Designer Mode MCP Server
 *
 * Exposes two MCP tools:
 *   wait_for_design_request  — blocks until designer sends a request
 *   send_design_response     — sends response back to designer panel
 *
 * Exposes one MCP prompt:
 *   designer-mode            — starts the design mode agent loop
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

  server.registerTool(
    'wait_for_design_request',
    {
      description:
        'Wait for a design change request from the Designer Mode browser panel. ' +
        'This tool blocks until a designer sends a request. ' +
        'Returns a structured prompt with component info, styles, changeset, and the designer\'s message. ' +
        'When the user says "enter design mode", "start design mode", or "run designer mode": ' +
        'first tell the user that Designer Mode is active and explain how to use it ' +
        '(open the app, click the 🎨 button, hover/click elements, type changes in the chat input), ' +
        'then call this tool to start listening. After handling each request, call it again to keep listening.',
    },
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

  server.registerTool(
    'send_design_response',
    {
      description:
        'Send a response back to the Designer Mode browser panel after applying code changes. ' +
        'Always call this after processing a design request to let the designer know what was changed.',
      inputSchema: {
        message: z.string().describe('Brief summary of what was changed, e.g. "Done — border-radius updated to 12px"'),
      },
    },
    async ({ message }) => {
      state.sendResponse(message);
      process.stderr.write(`[designer-mode] Response sent: ${message}\n`);
      return {
        content: [{ type: 'text', text: `Response sent to designer panel: ${message}` }],
      };
    }
  );

  server.registerPrompt(
    'designer-mode',
    {
      title: 'Enter Designer Mode',
      description: 'Start listening for design change requests from the browser panel',
    },
    () => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: 'Enter design mode. Follow these steps:\n\n' +
            '1. Tell the user: "Designer Mode is active. I\'m now listening for design requests from the browser panel.\n\n' +
            'To use it:\n' +
            '- Open your app in the browser\n' +
            '- Click the 🎨 Designer Mode button to activate the inspector\n' +
            '- Hover over elements to see component info\n' +
            '- Click an element to lock the selection and open the full editor\n' +
            '- Type a change request in the chat input (e.g. \'make the border radius 12px\') and hit send\n' +
            '- I\'ll apply the changes to your source code and respond in the panel\n\n' +
            'I\'ll keep listening until you tell me to stop."\n\n' +
            '2. Call the wait_for_design_request tool to start listening.\n\n' +
            '3. When a request comes in:\n' +
            '   a. Read the relevant source files based on the component info and file path provided\n' +
            '   b. Apply the requested design changes to the source code\n' +
            '   c. Call send_design_response with a brief summary of what was changed\n' +
            '   d. Call wait_for_design_request again to keep listening\n\n' +
            '4. Continue this loop until the user says to stop.',
        },
      }],
    })
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('[designer-mode] MCP server ready\n');
}
