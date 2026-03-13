import type { RefObject } from 'react';
import { findNodeHandle, UIManager } from 'react-native';
import type { RNComponentInfo } from './types.js';
import { getComponentInfoFromFiber, getFiberFromTag } from './fiber.js';

export interface SpatialEntry {
  ref: RefObject<any>;
  nativeTag: number | null;
  layout: { x: number; y: number; width: number; height: number; pageX: number; pageY: number } | null;
}

/**
 * Measures a ref and returns its page-relative layout.
 * Returns null if measurement fails.
 */
export function measureRef(ref: RefObject<any>): Promise<SpatialEntry['layout']> {
  return new Promise((resolve) => {
    const node = ref.current;
    if (!node) { resolve(null); return; }

    const handle = findNodeHandle(node);
    if (!handle) { resolve(null); return; }

    UIManager.measure(handle, (x, y, width, height, pageX, pageY) => {
      if (width === 0 && height === 0) { resolve(null); return; }
      resolve({ x, y, width, height, pageX, pageY });
    });
  });
}

/**
 * Given a touch position (pageX, pageY), find the topmost component
 * whose bounding box contains that point.
 */
export async function hitTestComponents(
  refs: RefObject<any>[],
  touchX: number,
  touchY: number
): Promise<RNComponentInfo | null> {
  // Measure all refs in parallel
  const entries = await Promise.all(
    refs.map(async (ref) => {
      const layout = await measureRef(ref);
      const nativeTag = ref.current ? findNodeHandle(ref.current) : null;
      return { ref, nativeTag, layout };
    })
  );

  // Filter to refs that contain the touch point
  const hits = entries.filter(e => {
    if (!e.layout) return false;
    const { pageX, pageY, width, height } = e.layout;
    return (
      touchX >= pageX &&
      touchX <= pageX + width &&
      touchY >= pageY &&
      touchY <= pageY + height
    );
  });

  if (hits.length === 0) return null;

  // Pick the smallest bounding box (most specific element)
  const best = hits.reduce((prev, curr) => {
    if (!prev.layout || !curr.layout) return prev;
    const prevArea = prev.layout.width * prev.layout.height;
    const currArea = curr.layout.width * curr.layout.height;
    return currArea < prevArea ? curr : prev;
  });

  if (!best.nativeTag) return null;

  const fiber = getFiberFromTag(best.nativeTag);
  const info = getComponentInfoFromFiber(fiber);

  return {
    componentName: info.name,
    filePath: info.filePath,
    lineNumber: info.lineNumber,
    props: info.props,
    testID: (info.props?.testID as string) ?? null,
    layout: best.layout,
    style: null,
  };
}
