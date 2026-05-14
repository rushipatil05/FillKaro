/**
 * content.js — Main content script
 * Always re-registers listeners (removes old ones first)
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
      sendResponse({ ok: true, version: '1.1' });
      break;

    case 'SCAN_FORM': {
      try {
        const fields = detectFormFields();
        sendResponse({ success: true, fields });
      } catch (err) {
        console.error('[AutoForm AI] Scan error:', err);
        sendResponse({ success: false, error: err.message });
      }
      break;
    }

    case 'AUTOFILL': {
      const { profileMap, options } = message;

      // Use sent fields if non-empty, else detect fresh
      const fieldsToFill = (message.fields && message.fields.length > 0)
        ? message.fields
        : detectFormFields();

      autofill(fieldsToFill, profileMap, options)
        .then(results => {
          const filled = results.filter(r => r.matched).length;
          sendResponse({ success: true, results, filled, total: results.length });
        })
        .catch(err => {
          console.error('[AutoForm AI] Autofill error:', err);
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
console.log('[AutoForm AI] Content script v1.1 loaded on', window.location.hostname);
