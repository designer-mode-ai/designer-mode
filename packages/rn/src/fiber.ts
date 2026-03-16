// React Native fiber traversal
// Walks the fiber tree to discover all user components with native views

import { findNodeHandle, UIManager, StyleSheet } from 'react-native';
import type { RNComponentInfo } from './types';

interface Fiber {
  type: any;
  memoizedProps: Record<string, any> | null;
  memoizedState: any;
  return: Fiber | null;
  child: Fiber | null;
  sibling: Fiber | null;
  stateNode: any;
  _debugSource?: { fileName: string; lineNumber: number } | null;
  tag: number;
}

// Fiber tags for host (native) components
const HOST_COMPONENT = 5;
const HOST_TEXT = 6;

// RN built-in names to skip when looking for user component names
const BUILTIN_NAMES = new Set([
  // React Native primitives
  'View', 'RCTView', 'Text', 'RCTText', 'Image', 'RCTImage',
  'ScrollView', 'RCTScrollView', 'TextInput', 'RCTTextInput',
  'SafeAreaView', 'RCTSafeAreaView', 'Pressable', 'TouchableOpacity',
  'TouchableWithoutFeedback', 'TouchableHighlight', 'FlatList',
  'SectionList', 'Modal', 'ActivityIndicator', 'StatusBar',
  'KeyboardAvoidingView', 'VirtualizedList',
  // Designer Mode internals
  'DesignerModeRN', 'PulseOrb',
  // React/RN internals
  'DebuggingOverlay', 'AppContainer', 'RootComponent',
]);

/** Names that indicate framework internals, not user components */
function isInternalName(name: string): boolean {
  if (BUILTIN_NAMES.has(name)) return true;
  // Filter out Context providers/consumers, HOC wrappers
  if (name.endsWith('Context') || name.endsWith('Provider') || name.endsWith('Consumer')) return true;
  if (name.startsWith('RCT') || name.startsWith('RNS')) return true;
  // Names with parentheses like "main(RootComponent)"
  if (name.includes('(') || name.includes(')')) return true;
  // Expo/React internals
  if (name === 'ErrorBoundary' || name === 'Suspense' || name === 'Fragment') return true;
  if (name === 'main' || name === 'PerformanceLogger') return true;
  return false;
}

/**
 * Get all fiber roots from the React DevTools hook.
 */
function getFiberRoots(): Fiber[] {
  const roots: Fiber[] = [];
  try {
    const hook = (global as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!hook) return roots;

    // Method 1: getFiberRoots on renderers
    if (hook.renderers) {
      for (const [id, renderer] of hook.renderers) {
        if (renderer.getFiberRoots) {
          const fiberRoots = renderer.getFiberRoots(id);
          if (fiberRoots) {
            for (const root of fiberRoots) {
              if (root.current) roots.push(root.current);
            }
          }
        }
      }
    }

    // Method 2: getFiberRoots on hook itself
    if (roots.length === 0 && hook.getFiberRoots) {
      for (const [id] of hook.renderers ?? []) {
        const fiberRoots = hook.getFiberRoots(id);
        if (fiberRoots) {
          for (const root of fiberRoots) {
            if (root.current) roots.push(root.current);
          }
        }
      }
    }
  } catch {
    // Expected in production
  }
  return roots;
}

/**
 * Walk up from a host fiber to find the nearest user component.
 */
function getComponentName(type: any): string | null {
  if (!type) return null;
  if (typeof type === 'string') return null;
  if (type.displayName) return type.displayName;
  if (type.name) return type.name;
  // ForwardRef
  if (type.render) {
    const render = type.render;
    return render?.displayName || render?.name || null;
  }
  return null;
}

function findUserComponent(hostFiber: Fiber): { name: string; fiber: Fiber; source: { fileName: string; lineNumber: number } | null } | null {
  let current: Fiber | null = hostFiber;
  while (current) {
    try {
      const name = getComponentName(current.type);
      if (name && !isInternalName(name)) {
        return {
          name,
          fiber: current,
          source: current._debugSource ?? null,
        };
      }
    } catch {
      // Skip fibers with problematic types
    }
    current = current.return;
  }
  return null;
}

/**
 * Find the nearest named component (including builtins like Text, View).
 */
function findDirectComponent(hostFiber: Fiber): string | null {
  let current: Fiber | null = hostFiber;
  while (current) {
    try {
      // Check for string type (host components like "RCTText" → "Text")
      if (typeof current.type === 'string') {
        const name = current.type.replace(/^RCT/, '');
        if (name) return name;
      }
      const name = getComponentName(current.type);
      if (name) return name;
    } catch { /* skip */ }
    current = current.return;
  }
  return null;
}

/**
 * Collect ALL leaf host (native) fibers from the tree.
 */
function collectAllHostFibers(fiber: Fiber | null, results: Fiber[]) {
  if (!fiber) return;

  if (fiber.tag === HOST_COMPONENT && fiber.stateNode) {
    results.push(fiber);
  }

  collectAllHostFibers(fiber.child, results);
  collectAllHostFibers(fiber.sibling, results);
}

/**
 * Measure a native view's layout on screen.
 */
function measureNativeView(hostFiber: Fiber): Promise<RNComponentInfo['layout']> {
  return new Promise((resolve) => {
    try {
      const handle = findNodeHandle(hostFiber.stateNode);
      if (!handle) { resolve(null); return; }

      UIManager.measure(handle, (x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
        if (width === 0 && height === 0) { resolve(null); return; }
        resolve({ x, y, width, height, pageX, pageY });
      });
    } catch {
      resolve(null);
    }
  });
}

/**
 * Discover the component at a touch point by:
 * 1. Collecting all native host fibers
 * 2. Measuring them all
 * 3. Hit-testing against the touch point
 * 4. Walking up from the best hit to find the owning user component
 */
export async function hitTestFromFiberTree(
  touchX: number,
  touchY: number
): Promise<RNComponentInfo | null> {
  const roots = getFiberRoots();
  if (roots.length === 0) return null;

  // Collect all host fibers
  const hostFibers: Fiber[] = [];
  for (const root of roots) {
    collectAllHostFibers(root, hostFibers);
  }

  if (hostFibers.length === 0) return null;

  // Measure all in parallel
  const measured: { fiber: Fiber; layout: NonNullable<RNComponentInfo['layout']> }[] = [];
  await Promise.all(
    hostFibers.map(async (fiber) => {
      const layout = await measureNativeView(fiber);
      if (layout) measured.push({ fiber, layout });
    })
  );

  // Hit test — find host fibers containing the touch point
  const hits = measured.filter(({ layout }) => {
    const { pageX, pageY, width, height } = layout;
    return (
      touchX >= pageX &&
      touchX <= pageX + width &&
      touchY >= pageY &&
      touchY <= pageY + height
    );
  });

  if (hits.length === 0) return null;

  // Pick the smallest bounding box (most specific native view)
  const best = hits.reduce((prev, curr) => {
    const prevArea = prev.layout.width * prev.layout.height;
    const currArea = curr.layout.width * curr.layout.height;
    return currArea < prevArea ? curr : prev;
  });

  // Extract text content from the tapped element
  let textContent: string | null = null;
  const hitProps = best.fiber.memoizedProps;
  if (hitProps?.children && typeof hitProps.children === 'string') {
    textContent = hitProps.children;
  }

  // Find direct component (e.g. Text, View) and user component (e.g. Card)
  const directName = findDirectComponent(best.fiber);
  const userComp = findUserComponent(best.fiber);
  if (!userComp && !directName) return null;

  // Use the direct component name as primary, user component as parent context
  const componentName = directName ?? userComp?.name ?? 'Unknown';
  const parentComponent = userComp && userComp.name !== directName ? userComp.name : null;

  // Resolve styles — prefer the hit fiber's styles (what the user actually tapped)
  let resolvedStyle: Record<string, unknown> | null = null;
  const styleProp = best.fiber.memoizedProps?.style ?? userComp?.fiber.memoizedProps?.style;
  if (styleProp) {
    try {
      resolvedStyle = StyleSheet.flatten(styleProp) as Record<string, unknown>;
    } catch { /* ignore */ }
  }

  // Measure layout
  let compLayout = best.layout;
  if (userComp) {
    let hostChild: Fiber | null = userComp.fiber;
    while (hostChild && hostChild.tag !== HOST_COMPONENT) {
      hostChild = hostChild.child;
    }
    if (hostChild && hostChild !== best.fiber) {
      const layout = await measureNativeView(hostChild);
      if (layout) compLayout = layout;
    }
  }

  return {
    componentName,
    parentComponent,
    textContent,
    filePath: userComp?.source?.fileName ?? null,
    lineNumber: userComp?.source?.lineNumber ?? null,
    props: best.fiber.memoizedProps,
    testID: (userComp?.fiber.memoizedProps?.testID as string) ?? null,
    layout: compLayout,
    style: resolvedStyle,
  };
}
