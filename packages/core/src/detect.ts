import type { Framework, InspectorAdapter } from './types.js';
import { buildFallbackInfo } from './utils.js';

export function createAdapter(framework: Framework): InspectorAdapter {
  // Lazy import to avoid bundling all adapters
  // In practice, the user imports the specific adapter they need
  // This is used for auto-detection in the extension / auto-init
  return {
    getComponentInfo(el: HTMLElement) {
      return buildFallbackInfo(el);
    },
    onActivate() {},
    onDeactivate() {},
  };
}

export { detectFramework } from './utils.js';
