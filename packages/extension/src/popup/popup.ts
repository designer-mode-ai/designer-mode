const toggleBtn = document.getElementById('toggleBtn') as HTMLButtonElement;
const statusDot = document.getElementById('statusDot') as HTMLElement;
const statusText = document.getElementById('statusText') as HTMLElement;
const relayDot = document.getElementById('relayDot') as HTMLElement;
const relayText = document.getElementById('relayText') as HTMLElement;
const optionsLink = document.getElementById('optionsLink') as HTMLAnchorElement;

let isActive = false;

optionsLink.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

async function getRelayStatus(host: string, port: number): Promise<boolean> {
  try {
    const r = await fetch(`http://${host}:${port}/api/health`, {
      signal: AbortSignal.timeout(2000),
    });
    return r.ok;
  } catch {
    return false;
  }
}

async function init(): Promise<void> {
  // Get settings
  const settings = await new Promise<{ relayHost: string; relayPort: number }>((resolve) => {
    chrome.storage.sync.get(
      { relayHost: '127.0.0.1', relayPort: 3334 },
      (items) => resolve(items as any)
    );
  });

  // Check relay
  const connected = await getRelayStatus(settings.relayHost, settings.relayPort);
  relayDot.className = 'relay-dot ' + (connected ? 'connected' : 'disconnected');
  relayText.textContent = connected ? 'Relay: connected' : 'Relay: not running';

  // Get current tab status
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_STATUS' });
      isActive = response?.active ?? false;
    } catch {
      isActive = false;
    }
  }

  updateUI();
}

function updateUI(): void {
  if (isActive) {
    toggleBtn.textContent = 'Deactivate';
    toggleBtn.className = 'toggle-btn active';
    statusDot.className = 'dot active';
    statusText.textContent = 'Active';
  } else {
    toggleBtn.textContent = 'Activate';
    toggleBtn.className = 'toggle-btn';
    statusDot.className = 'dot inactive';
    statusText.textContent = 'Inactive';
  }
}

toggleBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  try {
    const response = await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE' });
    isActive = response?.active ?? !isActive;
    updateUI();
  } catch (err) {
    statusText.textContent = 'Cannot inject (try reloading page)';
  }
});

init();
