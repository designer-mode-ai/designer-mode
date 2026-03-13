const relayHostInput = document.getElementById('relayHost') as HTMLInputElement;
const relayPortInput = document.getElementById('relayPort') as HTMLInputElement;
const autoActivateInput = document.getElementById('autoActivate') as HTMLInputElement;
const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
const saveStatus = document.getElementById('saveStatus') as HTMLElement;

// Load saved settings
chrome.storage.sync.get(
  { relayHost: '127.0.0.1', relayPort: 3334, autoActivate: false },
  (items) => {
    relayHostInput.value = items.relayHost;
    relayPortInput.value = String(items.relayPort);
    autoActivateInput.checked = items.autoActivate;
  }
);

// Save settings
saveBtn.addEventListener('click', () => {
  chrome.storage.sync.set(
    {
      relayHost: relayHostInput.value.trim() || '127.0.0.1',
      relayPort: parseInt(relayPortInput.value, 10) || 3334,
      autoActivate: autoActivateInput.checked,
    },
    () => {
      saveStatus.textContent = 'Saved!';
      setTimeout(() => { saveStatus.textContent = ''; }, 2000);
    }
  );
});
