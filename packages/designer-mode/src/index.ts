export type { ComponentInfo, ComputedStyleSnapshot, InspectorAdapter, DesignerModeOptions } from '@designer-mode/core';
export { DesignerModeCore } from '@designer-mode/core';

/**
 * Auto-detects the current framework and initializes Designer Mode.
 * Returns a cleanup function.
 */
export async function initDesignerMode(options: import('@designer-mode/core').DesignerModeOptions = {}): Promise<() => void> {
  const { DesignerModeCore } = await import('@designer-mode/core');

  // Detect framework
  let adapter: import('@designer-mode/core').InspectorAdapter | null = null;

  // Try React
  if (typeof window !== 'undefined') {
    const anyEl = document.querySelector('[data-reactroot]') ||
      document.querySelector('#root') ||
      document.querySelector('#app');
    if (anyEl) {
      const keys = Object.keys(anyEl);
      if (keys.some(k => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'))) {
        const { ReactInspectorAdapter } = await import('@designer-mode/inspector-react');
        adapter = new ReactInspectorAdapter();
      }
    }
  }

  // Try Vue 3
  if (!adapter && typeof window !== 'undefined') {
    const anyEl = document.querySelector('#app') || document.querySelector('[data-v-app]');
    if (anyEl && (anyEl as any).__vue_app__) {
      const { VueInspectorAdapter } = await import('@designer-mode/inspector-vue');
      adapter = new VueInspectorAdapter();
    }
  }

  // Fallback to vanilla
  if (!adapter) {
    const { VanillaInspectorAdapter } = await import('@designer-mode/inspector-vanilla');
    adapter = new VanillaInspectorAdapter();
  }

  const core = new DesignerModeCore({ ...options, adapter });
  core.mount();
  return () => core.unmount();
}
