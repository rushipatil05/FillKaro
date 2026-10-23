/**
 * content.js — Main content script
 * Handles form detection, autofilling, and live-sync bridge with FillKaro web dashboard.
 */
import { detectFormFields } from './formDetector.js';
import { autofill }         from './autofillEngine.js';

// Remove any previous listener to allow hot-reload / extension update
if (window.__autoformListener) {
  chrome.runtime.onMessage.removeListener(window.__autoformListener);
}

function messageHandler(message, _sender, sendResponse) {
  switch (message.action) {

    case 'PING':
      sendResponse({ ok: true, version: '1.1.0' });
      break;

    case 'SCAN_FORM': {
      try {
        const fields = detectFormFields();
        sendResponse({ success: true, fields });
      } catch (err) {
        console.error('[FillKaro] Scan error:', err);
        sendResponse({ success: false, error: err.message });
      }
      break;
    }

    case 'AUTOFILL': {
      const { profileMap, options } = message;

      const fieldsToFill = (message.fields && message.fields.length > 0)
        ? message.fields
        : detectFormFields();

      autofill(fieldsToFill, profileMap, options)
        .then(results => {
          const filled = results.filter(r => r.matched).length;
          sendResponse({ success: true, results, filled, total: results.length });
        })
        .catch(err => {
          console.error('[FillKaro] Autofill error:', err);
          sendResponse({ success: false, error: err.message });
        });
      return true; // async
    }

    case 'GET_PAGE_INFO':
      sendResponse({
        url:    window.location.href,
        domain: window.location.hostname,
        title:  document.title,
      });
      break;

    default:
      sendResponse({ success: false, error: 'Unknown action: ' + message.action });
  }
  return true;
}

window.__autoformListener = messageHandler;
chrome.runtime.onMessage.addListener(messageHandler);

console.log('[FillKaro] Content script loaded on', window.location.hostname);
