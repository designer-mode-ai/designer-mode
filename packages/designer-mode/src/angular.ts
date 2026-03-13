// Angular exports
export type { ComponentInfo, ComputedStyleSnapshot, InspectorAdapter, DesignerModeOptions } from '@designer-mode/core';
export { DesignerModeCore } from '@designer-mode/core';
export { AngularInspectorAdapter } from '@designer-mode/inspector-angular';

export async function initDesignerMode(options: import('@designer-mode/core').DesignerModeOptions = {}): Promise<() => void> {
  if (typeof document === 'undefined') return () => {};
  const { DesignerModeCore } = await import('@designer-mode/core');
  const { AngularInspectorAdapter } = await import('@designer-mode/inspector-angular');
  const adapter = new AngularInspectorAdapter();
  const core = new DesignerModeCore({ ...options, adapter });
  core.mount();
  return () => core.unmount();
}
