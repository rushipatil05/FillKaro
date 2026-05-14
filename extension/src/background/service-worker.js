/**
 * service-worker.js — MV3 Background Service Worker
 * Handles extension lifecycle and message routing.
 */

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    console.log('[AutoForm AI] Extension installed');
    // Open dashboard on first install (optional)
    // chrome.tabs.create({ url: 'http://localhost:5173' });
  }
});

// Keep service worker alive by responding to pings
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'SW_PING') {
    sendResponse({ ok: true });
  }
  return true;
});

// Badge management — show number of fields detected
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === 'SET_BADGE' && sender.tab?.id) {
    const count = message.count;
    chrome.action.setBadgeText({ text: count > 0 ? String(count) : '', tabId: sender.tab.id });
    chrome.action.setBadgeBackgroundColor({ color: '#2563eb', tabId: sender.tab.id });
  }
});
