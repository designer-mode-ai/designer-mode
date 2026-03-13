import { buildComponentInfo, buildFallbackInfo, serializeProps } from '@designer-mode/core';

/**
 * Get the React fiber from a DOM element.
 * React attaches the fiber as a property with a dynamic key like __reactFiber$xxxxx
 */
function getReactFiber(el) {
  const key = Object.keys(el).find(
    k => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$')
  );
  return key ? el[key] : null;
}

/**
 * Walk fiber.return until we find a named function/class component.
 * Skip React internals (Suspense, Provider, etc.)
 */
function getNearestNamedComponent(fiber) {
  let current = fiber?.return ?? null;
  while (current) {
    const type = current.type;
    if (typeof type === 'function' && type.name && type.name.length > 0) {
      // Skip common React internals
      if (!['Suspense', 'StrictMode', 'Fragment', 'Provider', 'Consumer'].includes(type.name)) {
        return current;
      }
    }
    if (typeof type === 'object' && type !== null) {
      const name = type.displayName ?? type.render?.displayName ?? type.render?.name;
      if (name) return current;
    }
    current = current.return;
  }
  return null;
}

function getComponentName(fiber) {
  if (!fiber) return null;
  const type = fiber.type;
  if (typeof type === 'function') return type.displayName ?? type.name ?? null;
  if (typeof type === 'object' && type !== null) {
    return type.displayName ?? type.render?.displayName ?? type.render?.name ?? null;
  }
  return null;
}

export class ReactInspectorAdapter {
  getComponentInfo(el) {
    const fiber = getReactFiber(el);
    if (!fiber) return buildFallbackInfo(el);

    const componentFiber = getNearestNamedComponent(fiber);
    const source = componentFiber?._debugSource ?? fiber._debugSource ?? null;
    const componentName = getComponentName(componentFiber) ?? el.tagName.toLowerCase();

    const rawProps = componentFiber?.memoizedProps ?? {};
    const props = serializeProps(rawProps);

    // Walk up for testId (may be on a parent)
    const testId = el.dataset.testid
      ?? el.closest('[data-testid]')?.getAttribute('data-testid')
      ?? null;

    return buildComponentInfo(el, {
      componentName,
      filePath: source?.fileName,
      lineNumber: source?.lineNumber,
      props,
      testId,
    });
  }

  onActivate() {
    // React's synthetic events use native DOM events under the hood in React 17+
    // Our capture-phase listeners intercept before React sees them — no special handling needed
  }

  onDeactivate() {}
}
