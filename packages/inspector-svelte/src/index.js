import { buildComponentInfo, extractComponentNameFromPath } from '@designer-mode/core';

export class SvelteInspectorAdapter {
  getComponentInfo(el) {
    // Walk up to find nearest Svelte-annotated element
    let target = el;
    while (target && !target.dataset.svelteComponent) {
      target = target.parentElement;
    }

    // Also check __svelte_meta (Svelte 4 dev mode fallback)
    const meta = el.__svelte_meta;

    const componentName = target?.dataset.svelteComponent
      ?? extractComponentNameFromPath(meta?.loc?.file)
      ?? el.tagName.toLowerCase();

    const filePath = target?.dataset.svelteFile
      ?? meta?.loc?.file
      ?? null;

    const lineNumber = target?.dataset.svelteLine
      ? parseInt(target.dataset.svelteLine)
      : meta?.loc?.line ?? null;

    return buildComponentInfo(el, { componentName, filePath, lineNumber });
  }

  onActivate() {}
  onDeactivate() {}
}

export function initDesignerMode(options = {}) {
  import('@designer-mode/core').then(({ DesignerModeCore }) => {
    const core = new DesignerModeCore({ adapter: new SvelteInspectorAdapter(), ...options });
    core.mount();
  });
}
