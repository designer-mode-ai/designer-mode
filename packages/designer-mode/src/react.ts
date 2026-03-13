// React-specific exports
export type { ComponentInfo, ComputedStyleSnapshot, InspectorAdapter, DesignerModeOptions } from '@designer-mode/core';
export { DesignerModeCore } from '@designer-mode/core';
export { ReactInspectorAdapter } from '@designer-mode/inspector-react';

export async function initDesignerMode(options: import('@designer-mode/core').DesignerModeOptions = {}): Promise<() => void> {
  const { DesignerModeCore } = await import('@designer-mode/core');
  const { ReactInspectorAdapter } = await import('@designer-mode/inspector-react');
  const adapter = new ReactInspectorAdapter();
  const core = new DesignerModeCore({ ...options, adapter });
  core.mount();
  return () => core.unmount();
}
