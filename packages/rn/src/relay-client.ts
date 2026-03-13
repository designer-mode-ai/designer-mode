import type { RNComponentInfo, ChangesetEntry, DesignerModeRNOptions } from './types.js';

export function buildAgentPrompt(
  info: RNComponentInfo,
  changeset: ChangesetEntry[],
  message: string
): string {
  const lines: string[] = [
    '=== DESIGNER MODE REQUEST (React Native) ===',
    '',
    'Selected Component',
    `  Component : ${info.componentName}`,
  ];

  if (info.filePath) lines.push(`  File      : ${info.filePath}${info.lineNumber ? `:${info.lineNumber}` : ''}`);
  if (info.testID) lines.push(`  Test ID   : ${info.testID}`);

  if (info.layout) {
    lines.push('', 'Layout');
    lines.push(`  x       : ${info.layout.x}`);
    lines.push(`  y       : ${info.layout.y}`);
    lines.push(`  width   : ${info.layout.width}`);
    lines.push(`  height  : ${info.layout.height}`);
    lines.push(`  pageX   : ${info.layout.pageX}`);
    lines.push(`  pageY   : ${info.layout.pageY}`);
  }

  if (changeset.length > 0) {
    lines.push('', 'Changeset (inline edits)');
    for (const entry of changeset) {
      lines.push(`  ${entry.property} : ${entry.original} → ${entry.current}`);
    }
  }

  if (message) {
    lines.push('', 'Designer Message');
    lines.push(`  "${message}"`);
  }

  lines.push('', '=== END ===');
  return lines.join('\n');
}

export async function sendToRelay(
  relayUrl: string,
  prompt: string
): Promise<void> {
  const response = await fetch(`${relayUrl}/api/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: prompt,
  });
  if (!response.ok) {
    throw new Error(`Relay server responded ${response.status}`);
  }
}

export async function pollForResponse(
  relayUrl: string,
  signal: AbortSignal
): Promise<string | null> {
  while (!signal.aborted) {
    try {
      const response = await fetch(`${relayUrl}/api/poll`, { signal });
      if (response.status === 200) {
        return await response.text();
      }
    } catch {
      // Network error or aborted
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  return null;
}

export async function checkRelayHealth(relayUrl: string): Promise<boolean> {
  try {
    const r = await fetch(`${relayUrl}/api/health`, {
      signal: AbortSignal.timeout(2000),
    });
    return r.ok;
  } catch {
    return false;
  }
}
