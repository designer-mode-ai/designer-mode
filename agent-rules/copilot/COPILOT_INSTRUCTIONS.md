## Designer Mode

When the user asks to start designer mode or run the designer loop:

Note: GitHub Copilot does not support long-running blocking commands.
Use the **MCP approach** instead:

1. Configure your MCP client to include `@designer-mode/server` as an MCP server:

```json
{
  "mcpServers": {
    "designer-mode": {
      "command": "npx",
      "args": ["designer-mode-mcp"]
    }
  }
}
```

2. Use the `wait_for_design_request` MCP tool to receive design requests.
3. Apply changes to source code.
4. Use the `send_design_response` MCP tool to reply to the designer.
5. Call `wait_for_design_request` again immediately.

The MCP tools handle the relay server automatically — no need to start it separately.
