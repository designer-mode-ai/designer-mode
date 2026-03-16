import { DesignerModeCore } from '@designer-mode/core';
import type { InspectorAdapter, DesignerModeOptions } from '@designer-mode/core';

let core: DesignerModeCore | null = null;

async function detectFrameworkAndInit(options: DesignerModeOptions): Promise<void> {
  let adapter: InspectorAdapter | undefined;

  // Try React
  const reactRoot = document.querySelector('[data-reactroot]') ||
    document.querySelector('#root') ||
    document.querySelector('#app');

  if (reactRoot) {
    const keys = Object.keys(reactRoot);
    if (keys.some(k => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'))) {
      const { ReactInspectorAdapter } = await import('@designer-mode/inspector-react' as any);
      adapter = new ReactInspectorAdapter();
      console.debug('[designer-mode] React detected');
    }
  }

  // Try Vue 3
  if (!adapter) {
    const vueRoot = document.querySelector('[data-v-app]') || document.querySelector('#app');
    if (vueRoot && (vueRoot as any).__vue_app__) {
      const { VueInspectorAdapter } = await import('@designer-mode/inspector-vue' as any);
      adapter = new VueInspectorAdapter();
      console.debug('[designer-mode] Vue 3 detected');
    }
  }

  // Fallback to vanilla
  if (!adapter) {
    const { VanillaInspectorAdapter } = await import('@designer-mode/inspector-vanilla' as any);
    adapter = new VanillaInspectorAdapter();
    console.debug('[designer-mode] Vanilla (no framework) detected');
  }

  core = new DesignerModeCore({ adapter: adapter!, ...options });
  core.mount();
}

// Load saved settings from extension storage
async function getSettings(): Promise<DesignerModeOptions> {
  return new Promise(resolve => {
    chrome.storage.sync.get(
      { relayPort: 3334, relayHost: '127.0.0.1', enabled: false },
      (items) => {
        resolve({
          relayUrl: `http://${items.relayHost}:${items.relayPort}`,
        });
      }
    );
  });
}

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case 'TOGGLE':
      if (core) {
        core.toggle();
        sendResponse({ ok: true, active: core.isMounted() });
      } else {
        getSettings().then(opts => {
          detectFrameworkAndInit(opts).then(() => {
            core?.setActive(true);
            sendResponse({ ok: true, active: true });
          });
        });
      }
      return true; // async response

    case 'GET_STATUS':
      sendResponse({ active: core?.isMounted() ?? false });
      break;

    case 'DESTROY':
      core?.unmount();
      core = null;
      sendResponse({ ok: true });
      break;

    case 'UPDATE_OPTIONS':
      // Re-init with new options
      if (core) {
        core.unmount();
        core = null;
      }
      getSettings().then(opts => {
        detectFrameworkAndInit({ ...opts, ...message.options });
        sendResponse({ ok: true });
      });
      return true;
  }
});

// Auto-activate if previously enabled on this page
getSettings().then(opts => {
  chrome.storage.session.get({ activeTabId: null }, items => {
    // Check if user had it active
    chrome.storage.sync.get({ autoActivate: false }, syncItems => {
      if (syncItems.autoActivate) {
        detectFrameworkAndInit(opts).then(() => {
          core?.setActive(true);
        });
      }
    });
  });
});
