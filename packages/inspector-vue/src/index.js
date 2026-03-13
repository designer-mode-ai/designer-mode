import { buildComponentInfo, buildFallbackInfo, extractComponentNameFromPath, serializeProps } from '@designer-mode/core';

function detectVueVersion() {
  if (window.__VUE__) return 3;
  if (window.Vue?.version?.startsWith('2')) return 2;
  // Check a DOM element
  const el = document.body.firstElementChild;
  if (el?.__vueParentComponent) return 3;
  if (el?.__vue__) return 2;
  return 3;
}

export class VueInspectorAdapter {
  constructor() {
    this.vueVersion = detectVueVersion();
  }

  getComponentInfo(el) {
    return this.vueVersion === 3 ? this.getVue3Info(el) : this.getVue2Info(el);
  }

  getVue3Info(el) {
    // Walk up to find element with __vueParentComponent
    let target = el;
    let instance = null;
    while (target && !instance) {
      instance = target.__vueParentComponent;
      if (!instance) target = target.parentElement;
    }

    if (!instance) return buildFallbackInfo(el);

    const type = instance.type;
    const componentName = type?.name
      ?? type?.displayName
      ?? type?.__name
      ?? extractComponentNameFromPath(type?.__file)
      ?? el.tagName.toLowerCase();

    const rawProps = { ...instance.props };
    // Include simple scalar setup state values
    const setup = instance.setupState ?? {};
    for (const [k, v] of Object.entries(setup)) {
      if (typeof v !== 'function' && typeof v !== 'object' && v !== null) {
        rawProps[k] = v;
      }
    }

    return buildComponentInfo(el, {
      componentName,
      filePath: type?.__file,
      props: serializeProps(rawProps),
    });
  }

  getVue2Info(el) {
    const instance = el.__vue__;
    if (!instance) return buildFallbackInfo(el);

    return buildComponentInfo(el, {
      componentName: instance.$options?.name ?? el.tagName.toLowerCase(),
      filePath: instance.$options?.__file,
      props: serializeProps(instance.$props ?? {}),
    });
  }

  onActivate() {}
  onDeactivate() {}
}

/** Vue plugin for app.use() */
export const DesignerModePlugin = {
  install(app) {
    if (import.meta.env?.DEV === false) return;
    import('@designer-mode/core').then(({ DesignerModeCore }) => {
      const core = new DesignerModeCore({ adapter: new VueInspectorAdapter() });
      app.mixin({
        mounted() {
          if (!core.isMounted()) core.mount();
        },
      });
    });
  },
};
