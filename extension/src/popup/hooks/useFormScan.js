import { useState, useCallback } from 'react';

/**
 * Manages form scanning state and communication with content script.
 */
export function useFormScan() {
  const [fields,  setFields]  = useState([]);
  const [status,  setStatus]  = useState('idle'); // idle | scanning | done | error | no-content
  const [error,   setError]   = useState('');

  const scan = useCallback(async () => {
    setStatus('scanning');
    setError('');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error('No active tab found');

      // First ping to check content script is alive
      let pingOk = false;
      try {
        const ping = await sendMessage(tab.id, { action: 'PING' });
        pingOk = ping?.ok;
      } catch {
        pingOk = false;
      }

      if (!pingOk) {
        // Try injecting the content script manually
        try {
          await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
          await new Promise(r => setTimeout(r, 300)); // wait for injection
        } catch {
          setStatus('no-content');
          setError('Cannot access this page. Try a regular website.');
          return;
        }
      }

      const res = await sendMessage(tab.id, { action: 'SCAN_FORM' });
      if (!res?.success) throw new Error(res?.error || 'Scan failed');
      setFields(res.fields || []);
      setStatus('done');

      // Update badge
      chrome.runtime.sendMessage({ action: 'SET_BADGE', count: res.fields?.length || 0 }).catch(() => {});
    } catch (err) {
      setStatus('error');
      setError(err.message);
    }
  }, []);

  const clearScan = useCallback(() => {
    setFields([]);
    setStatus('idle');
    setError('');
  }, []);

  return { fields, status, error, scan, clearScan };
}

// Helper: promise-based sendMessage with timeout
function sendMessage(tabId, message, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Content script timeout')), timeoutMs);
    chrome.tabs.sendMessage(tabId, message, (res) => {
      clearTimeout(timer);
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve(res);
    });
  });
}
