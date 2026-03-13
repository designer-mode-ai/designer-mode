import { buildComponentInfo, buildFallbackInfo, serializeProps } from '@designer-mode/core';

function kebabCase(name) {
  return name
    .replace(/Component$/, '')
    .replace(/([A-Z])/g, (m, l, i) => (i > 0 ? '-' : '') + l.toLowerCase())
    .replace(/^-/, '');
}

export class AngularInspectorAdapter {
  isAvailable() {
    return typeof window.ng !== 'undefined' && typeof window.ng.getComponent === 'function';
  }

  getComponentInfo(el) {
    if (!this.isAvailable()) return buildFallbackInfo(el);

    const ng = window.ng;
    const instance = ng.getComponent(el) ?? ng.getOwningComponent(el) ?? null;
    const directives = ng.getDirectives(el) ?? [];

    const ctor = instance?.constructor;
    const rawName = ctor?.name ?? null;
    const componentName = rawName?.replace(/Component$/, '') ?? el.tagName.toLowerCase();

    // File path from build-time annotation or inferred
    const filePath = ctor?.__designerFile ?? this.inferPath(rawName) ?? null;
    const lineNumber = ctor?.__designerLine ?? null;

    const inputs = this.getInputs(instance, ctor);

    return buildComponentInfo(el, {
      componentName,
      filePath,
      lineNumber,
      props: inputs,
      extra: {
        selector: ctor?.ɵcmp?.selectors?.[0]?.[0] ?? null,
        directives: directives.map(d => d.constructor?.name ?? 'unknown'),
      },
    });
  }

  getInputs(instance, ctor) {
    if (!instance) return null;
    const ivyCmp = ctor?.ɵcmp;
    if (ivyCmp?.inputs) {
      const result = {};
      for (const publicName of Object.keys(ivyCmp.inputs)) {
        const val = instance[publicName];
        if (val !== undefined) result[publicName] = String(val);
      }
      return Object.keys(result).length ? result : null;
    }
    // Fallback: public non-function properties
    return serializeProps(
      Object.fromEntries(
        Object.entries(instance)
          .filter(([k]) => !k.startsWith('_') && !k.startsWith('ng') && !k.startsWith('ɵ'))
      )
    );
  }

  inferPath(name) {
    if (!name) return null;
    const kebab = kebabCase(name);
    return `src/app/**/${kebab}/${kebab}.component.ts`;
  }

  onActivate() {
    // Optionally run overlay events outside Angular zone to avoid
    // unnecessary change detection on every mousemove
    // Zone.js detection is optional — basic activation works without it
  }

  onDeactivate() {}
}

export function initDesignerMode(options = {}) {
  if (typeof document === 'undefined') return; // SSR guard
  import('@designer-mode/core').then(({ DesignerModeCore }) => {
    const core = new DesignerModeCore({ adapter: new AngularInspectorAdapter(), ...options });
    core.mount();
  });
}
