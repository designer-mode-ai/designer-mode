import { useEffect, useRef } from 'react';
import { DesignerModeCore } from '@designer-mode/core';
import { ReactInspectorAdapter } from './index.js';

let coreInstance = null;

export function DesignerMode({ relayUrl, shortcut, defaultActive, showToggle = true, persistState, children }) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    coreInstance = new DesignerModeCore({
      adapter: new ReactInspectorAdapter(),
      relayUrl,
      shortcut,
      defaultActive,
      persistState,
    });
    coreInstance.mount();
    if (!showToggle) coreInstance.toggle = () => {};

    return () => {
      coreInstance?.unmount();
      coreInstance = null;
      initialized.current = false;
    };
  }, []);

  return children ?? null;
}
