// Vanilla JS exports
export type { ComponentInfo, ComputedStyleSnapshot, InspectorAdapter, DesignerModeOptions } from '@designer-mode/core';
export { DesignerModeCore } from '@designer-mode/core';
export { VanillaInspectorAdapter } from '@designer-mode/inspector-vanilla';

/**
 * Initializes Designer Mode with the vanilla inspector adapter.
 * Returns a cleanup function.
 */
export async function initDesignerMode(options: import('@designer-mode/core').DesignerModeOptions = {}): Promise<() => void> {
  const { DesignerModeCore } = await import('@designer-mode/core');
  const { VanillaInspectorAdapter } = await import('@designer-mode/inspector-vanilla');
  const adapter = new VanillaInspectorAdapter();
  const core = new DesignerModeCore({ ...options, adapter });
  core.mount();
  return () => core.unmount();
}
