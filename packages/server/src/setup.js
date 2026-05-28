/**
 * Setup wizard — installs the designer-mode skill using the open Agent Skills standard.
 * Works with Claude Code, Cursor, Codex, and Gemini CLI.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_SRC = path.join(__dirname, '../../skill/SKILL.md');

export async function runSetup(options = {}) {
  console.log('\n🎨 Designer Mode Setup\n');

  const dirs = [
    '.claude/skills/designer-mode',   // Claude Code
    '.agents/skills/designer-mode',   // Cursor, Codex, Gemini CLI (open standard)
  ];

  const allExist = dirs.every(d => fs.existsSync(path.join(d, 'SKILL.md')));
  if (allExist) {
    console.log('✓ Skill already installed.');
    console.log('  Say "enter design mode" or use /designer-mode to start.\n');
    return;
  }

  const content = fs.existsSync(SKILL_SRC)
    ? fs.readFileSync(SKILL_SRC, 'utf8')
    : getSkillContent();

  for (const dir of dirs) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'SKILL.md'), content);
  }

  console.log('✓ Skill installed to:');
  console.log('    .claude/skills/designer-mode/   (Claude Code)');
  console.log('    .agents/skills/designer-mode/   (Cursor, Codex, Gemini CLI)');
  console.log('');
  console.log('  Say "enter design mode" or use /designer-mode to start.');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Run your app (e.g. npm run dev)');
  console.log('  2. Tell your agent to "enter design mode"');
  console.log('  3. Click the 🎨 button in your app to start inspecting\n');
}

function getSkillContent() {
  return `---
name: designer-mode
description: Enter Designer Mode to listen for visual design change requests from the browser. Use when the user says "enter design mode", "start design mode", "run designer mode", or "designer loop".
---

# Designer Mode

A browser panel lets designers inspect elements and request design changes. You apply those changes to the source code.

The relay server prints each incoming request to its stdout as a block delimited by \`=== DESIGNER MODE REQUEST ===\` and \`=== END ===\`. You start it once in the background and watch its stdout for the next block — no polling, no restart between requests.

## Setup

1. Start the relay server as a long-running background process and stream its stdout:
   - **Claude Code** — run \`npx designer-mode server\` with \`Bash\` (\`run_in_background: true\`), then attach the \`Monitor\` tool to its shell so you receive each new stdout line as a notification.
   - **Cursor** — run \`npx designer-mode server\` via the \`shell\` tool in background mode with \`notify_on_output: "^=== END ===$"\` so you're woken once each full request block has arrived.
   - **Other agents with stdout streaming** — equivalent background + watch mechanism.

2. Wait for confirmation \`[designer-mode] Relay server listening on http://127.0.0.1:3334\` on stderr.

3. Tell the user:
   > Designer Mode is active. I'm now listening for design requests from the browser.
   >
   > To use it:
   > - Open your app in the browser
   > - Click the 🎨 Designer Mode button to activate the inspector
   > - Hover over elements to see component info
   > - Click an element to lock the selection and open the full editor
   > - Type a change request in the chat input (e.g. "make the border radius 12px") and hit send
   > - I'll apply the changes to your source code and respond in the panel
   >
   > I'll keep listening until you tell me to stop.

## Loop

Each time a new \`=== DESIGNER MODE REQUEST === ... === END ===\` block appears in the server's stdout:

1. Read the block — it contains the component name, file path, line number, current styles, any inline edits the designer made, and their message.

2. Read the relevant source files based on the file path.

3. Apply the requested design changes to the source code.

4. Send a response back to the panel:
   \`\`\`bash
   curl -s -X POST http://localhost:3334/api/response \\
     -H "Content-Type: text/plain" \\
     -d "Done — <brief summary of what was changed>"
   \`\`\`

5. Keep watching the server's stdout for the next block. **Do not kill or restart the server.**

## Critical Rule

After every request: **apply changes → send response → keep watching**. One server process for the whole session.

## Stopping

When the user wants to exit:
\`\`\`bash
pkill -f "designer-mode server"
\`\`\`
`;
}
