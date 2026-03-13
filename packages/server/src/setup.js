/**
 * Setup wizard — detects the AI agent being used and installs the right rule file.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RULES_DIR = path.join(__dirname, '../../agent-rules');

const AGENT_DETECTORS = [
  {
    name: 'Claude Code',
    detect: () => fs.existsSync('.claude'),
    install: () => {
      fs.mkdirSync('.claude/skills', { recursive: true });
      const src = path.join(RULES_DIR, 'claude-code/skill.md');
      if (fs.existsSync(src)) fs.copyFileSync(src, '.claude/skills/designer-mode.md');
      else fs.writeFileSync('.claude/skills/designer-mode.md', getClaudeSkill());
    },
    message: "Skill installed. Say '/designer-mode' or 'run designer mode' to start.",
  },
  {
    name: 'Cursor',
    detect: () => fs.existsSync('.cursor'),
    install: () => {
      fs.mkdirSync('.cursor/rules/designer-mode', { recursive: true });
      const src = path.join(RULES_DIR, 'cursor/RULE.md');
      if (fs.existsSync(src)) fs.copyFileSync(src, '.cursor/rules/designer-mode/RULE.md');
      else fs.writeFileSync('.cursor/rules/designer-mode/RULE.md', getCursorRule());
    },
    message: "Rule installed. Tell Cursor 'run designer mode' to start.",
  },
  {
    name: 'Codex',
    detect: () => fs.existsSync('AGENTS.md'),
    install: () => {
      const section = getAgentsSection();
      const existing = fs.readFileSync('AGENTS.md', 'utf-8');
      if (!existing.includes('Designer Mode')) {
        fs.appendFileSync('AGENTS.md', '\n\n' + section);
      }
    },
    message: "AGENTS.md updated. Tell Codex 'run designer mode' to start.",
  },
  {
    name: 'Aider',
    detect: () => fs.existsSync('CONVENTIONS.md') || fs.existsSync('.aider.conf.yml'),
    install: () => {
      const section = getAiderSection();
      if (fs.existsSync('CONVENTIONS.md')) {
        const existing = fs.readFileSync('CONVENTIONS.md', 'utf-8');
        if (!existing.includes('Designer Mode')) fs.appendFileSync('CONVENTIONS.md', '\n\n' + section);
      } else {
        fs.writeFileSync('DESIGNER_MODE.md', section);
      }
    },
    message: "Instructions installed. In aider, run /run npx designer-mode-wait to start.",
  },
];

export async function runSetup(options = {}) {
  const { yes = false } = options;

  console.log('\n🎨 Designer Mode Setup\n');

  const detected = AGENT_DETECTORS.find(a => a.detect());

  if (detected) {
    console.log(`Detected AI agent: ${detected.name}`);
    if (!yes) {
      console.log(`This will install the agent rule for ${detected.name}.`);
      // In a real interactive setup, prompt for confirmation
      // For now, auto-proceed
    }
    detected.install();
    console.log(`✓ ${detected.message}`);
  } else {
    fs.writeFileSync('DESIGNER_MODE.md', getGenericInstructions());
    console.log('✓ Instructions written to DESIGNER_MODE.md');
    console.log('  Share this file with your AI agent to get started.');
  }

  console.log('\nNext steps:');
  console.log('  1. Run: npx designer-mode-server');
  console.log('  2. Activate the inspector in your app (🎨 button or Ctrl+Shift+D)');
  console.log('  3. Tell your agent to start designer mode\n');
}

function getClaudeSkill() {
  return `# Designer Mode

When the user says "run designer mode", "start designer mode", "listen for design requests", or invokes /designer-mode:

## Steps

1. Start the relay server in background:
   \`\`\`bash
   npx designer-mode-server
   \`\`\`
   Wait for it to confirm "Listening on http://localhost:3334".

2. Tell the user:
   > Designer Mode ready.
   > - Activate the inspector: 🎨 button or Ctrl+Shift+D
   > - Click an element, type your request, hit Send
   >
   > Listening for requests...

3. Run and wait for a request:
   \`\`\`bash
   npx designer-mode-wait
   \`\`\`

4. Read stdout — it contains component info, styles, changeset, and the designer's message.

5. Apply the changes to source code.

6. Confirm to the designer:
   \`\`\`bash
   curl -s -X POST http://localhost:3334/api/response \\
     -H "Content-Type: text/plain" \\
     -d "Done — <brief summary of what changed>"
   \`\`\`

7. Immediately go back to step 3.

## Critical
After EVERY request: edit source → curl response → npx designer-mode-wait.
Never stop the loop unless the user says "stop" or "exit designer mode".
`;
}

function getCursorRule() {
  return `# Designer Mode — Agent Collaboration

## When to Activate
- "start designer mode"
- "run designer mode"
- "listen for design requests"
- "designer loop"

## Workflow

1. Start relay server (once, \`block_until_ms: 0\`):
   \`\`\`bash
   npx designer-mode-server
   \`\`\`

2. Tell user how to send requests.

3. Run \`npx designer-mode-wait\` with \`block_until_ms: 600000\`.

4. Read the structured output (component, file, styles, changeset, message).

5. Apply changes to source code.

6. Send response:
   \`\`\`bash
   curl -s -X POST http://localhost:3334/api/response \\
     -H "Content-Type: text/plain" \\
     -d "Done — <summary>"
   \`\`\`

7. IMMEDIATELY run \`npx designer-mode-wait\` again.

## CRITICAL
Never skip step 7. Always re-run designer-wait after every request.
`;
}

function getAgentsSection() {
  return `---

## Designer Mode

When asked to "start designer mode" or "run designer mode":

1. Run \`npx designer-mode-server\` in background
2. Tell user to activate the inspector (🎨 button or Ctrl+Shift+D)
3. Run \`npx designer-mode-wait\` — blocks until designer sends a request
4. Apply changes from the structured prompt output
5. Run: \`curl -s -X POST http://localhost:3334/api/response -H "Content-Type: text/plain" -d "Done — <summary>"\`
6. Immediately run \`npx designer-mode-wait\` again

Critical: Always re-run designer-wait after each request.
`;
}

function getAiderSection() {
  return `## Designer Mode

1. In a separate terminal: \`npx designer-mode-server\`
2. In aider chat: \`/run npx designer-mode-wait\`
3. When a request arrives, apply the changes to source code
4. \`/run curl -s -X POST http://localhost:3334/api/response -H "Content-Type: text/plain" -d "Done — <summary>"\`
5. Immediately \`/run npx designer-mode-wait\` again
`;
}

function getGenericInstructions() {
  return `# Designer Mode Instructions

## Starting the loop

1. In a terminal: \`npx designer-mode-server\`
2. In another terminal: \`npx designer-mode-wait\`
   This blocks until the designer sends a request.
3. When a request arrives, apply the changes to source code.
4. Confirm: \`curl -s -X POST http://localhost:3334/api/response -H "Content-Type: text/plain" -d "Done — <summary>"\`
5. Immediately run \`npx designer-mode-wait\` again.

## The one rule
After every request: apply changes → send response → run designer-mode-wait.
`;
}
