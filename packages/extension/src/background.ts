// Background service worker for Designer Mode extension

// Track active state per tab
const activeTabIds = new Set<number>();

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;

  try {
    const response = await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE' });
    if (response?.active) {
      activeTabIds.add(tab.id);
      chrome.action.setBadgeText({ text: 'ON', tabId: tab.id });
      chrome.action.setBadgeBackgroundColor({ color: '#037DD6', tabId: tab.id });
    } else {
      activeTabIds.delete(tab.id);
      chrome.action.setBadgeText({ text: '', tabId: tab.id });
    }
  } catch (err) {
    // Content script may not be ready
    console.error('[designer-mode background]', err);
  }
});

// Clear badge when tab navigates
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    activeTabIds.delete(tabId);
    chrome.action.setBadgeText({ text: '', tabId });
  }
});

// Clean up closed tabs
chrome.tabs.onRemoved.addListener((tabId) => {
  activeTabIds.delete(tabId);
});
