// Vue-specific exports
export type { ComponentInfo, ComputedStyleSnapshot, InspectorAdapter, DesignerModeOptions } from '@designer-mode/core';
export { DesignerModeCore } from '@designer-mode/core';
export { VueInspectorAdapter, DesignerModePlugin } from '@designer-mode/inspector-vue';

export async function initDesignerMode(options: import('@designer-mode/core').DesignerModeOptions = {}): Promise<() => void> {
  const { DesignerModeCore } = await import('@designer-mode/core');
  const { VueInspectorAdapter } = await import('@designer-mode/inspector-vue');
  const adapter = new VueInspectorAdapter();
  const core = new DesignerModeCore({ ...options, adapter });
  core.mount();
  return () => core.unmount();
}
