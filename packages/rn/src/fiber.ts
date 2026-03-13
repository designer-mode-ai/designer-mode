// React Native fiber traversal
// Walks the fiber tree to find the component owning a given native view tag

declare const __DEV__: boolean;

interface Fiber {
  type: any;
  memoizedProps: Record<string, any> | null;
  memoizedState: any;
  return: Fiber | null;
  child: Fiber | null;
  sibling: Fiber | null;
  stateNode: any;
  _debugSource?: { fileName: string; lineNumber: number } | null;
}

function getFiberFromTag(rootTag: number): Fiber | null {
  // React Native exposes the root fiber via __reactFiber or similar
  // on the root container. We walk from the root.
  try {
    // Access React Native internals (dev mode only)
    const ReactNative = require('react-native');
    const { findNodeHandle } = ReactNative;

    // Walk the global fiber root
    // React Native stores fiber roots on the renderer
    const rendererDev = (global as any).__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers;
    if (!rendererDev) return null;

    for (const [, renderer] of rendererDev) {
      const roots = renderer.currentDispatcherRef?.current;
      // Try to find fiber by stateNode nativeTag
      // This is a best-effort walk in DEV mode
      const root = renderer.getFiberRoots?.(rootTag);
      if (root) {
        for (const fiberRoot of root) {
          const fiber = findFiberByTag(fiberRoot.current, rootTag);
          if (fiber) return fiber;
        }
      }
    }
  } catch {
    // Expected in production
  }
  return null;
}

function findFiberByTag(fiber: Fiber | null, tag: number): Fiber | null {
  if (!fiber) return null;
  if (fiber.stateNode?.nativeTag === tag) return fiber;

  const childResult = findFiberByTag(fiber.child, tag);
  if (childResult) return childResult;

  return findFiberByTag(fiber.sibling, tag);
}

function walkFiberForName(fiber: Fiber | null): { name: string; source: { fileName: string; lineNumber: number } | null } {
  let current: Fiber | null = fiber;
  while (current) {
    const type = current.type;
    if (type) {
      const name = type.displayName || type.name || null;
      if (name && name !== 'View' && name !== 'Text' && name !== 'Image') {
        return {
          name,
          source: current._debugSource ?? null,
        };
      }
    }
    current = current.return;
  }
  return { name: 'Unknown', source: null };
}

export function getComponentInfoFromFiber(fiber: Fiber | null): { name: string; filePath: string | null; lineNumber: number | null; props: Record<string, unknown> | null } {
  if (!fiber) return { name: 'Unknown', filePath: null, lineNumber: null, props: null };

  const { name, source } = walkFiberForName(fiber);
  return {
    name,
    filePath: source?.fileName ?? null,
    lineNumber: source?.lineNumber ?? null,
    props: fiber.memoizedProps,
  };
}

export { getFiberFromTag, findFiberByTag };
