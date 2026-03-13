import { buildComponentInfo, buildDomPath } from '@designer-mode/core';

export class VanillaInspectorAdapter {
  getComponentInfo(el) {
    return buildComponentInfo(el, {
      componentName: el.dataset.component ?? el.tagName.toLowerCase(),
      filePath: el.dataset.file,
      lineNumber: el.dataset.line ? parseInt(el.dataset.line) : null,
      domPath: buildDomPath(el),
    });
  }
  onActivate() {}
  onDeactivate() {}
}
