// Svelte exports
export type { ComponentInfo, ComputedStyleSnapshot, InspectorAdapter, DesignerModeOptions } from '@designer-mode/core';
export { DesignerModeCore } from '@designer-mode/core';
export { SvelteInspectorAdapter } from '@designer-mode/inspector-svelte';

export async function initDesignerMode(options: import('@designer-mode/core').DesignerModeOptions = {}): Promise<() => void> {
  const { DesignerModeCore } = await import('@designer-mode/core');
  const { SvelteInspectorAdapter } = await import('@designer-mode/inspector-svelte');
  const adapter = new SvelteInspectorAdapter();
  const core = new DesignerModeCore({ ...options, adapter });
  core.mount();
  return () => core.unmount();
}
