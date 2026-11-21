import { useState, useEffect, useCallback } from 'react';

/**
 * useChromeStorage hook (100% Local)
 * Reads and persists profiles and API key directly in chrome.storage.local.
 * No backend server or database needed!
 */
export function useChromeStorage() {
  const [profiles,        setProfiles]        = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [geminiApiKey,    setGeminiApiKey]    = useState('');
  const [useGemini,       setUseGemini]       = useState(true); // ON by default when key is set

  // Initial load from chrome.storage.local
  useEffect(() => {
    chrome.storage.local.get(['selectedProfileId', 'cachedProfiles', 'geminiApiKey', 'useGemini'], (res) => {
      setGeminiApiKey(res.geminiApiKey || '');
      // Default useGemini to true so it's on whenever a key exists
      setUseGemini(res.useGemini !== false);


      const list = Array.isArray(res.cachedProfiles) ? res.cachedProfiles : [];
      setProfiles(list);

      if (list.length > 0) {
        const found = list.find(p => (p._id || p.id) === res.selectedProfileId);
        setSelectedProfile(found || list[0]);
      } else {
        setSelectedProfile(null);
      }

      setLoading(false);
    });

    // Real-time listener for any storage updates (e.g. from web dashboard sync)
    const listener = (changes, area) => {
      if (area !== 'local') return;

      if (changes.cachedProfiles) {
        const list = Array.isArray(changes.cachedProfiles.newValue) ? changes.cachedProfiles.newValue : [];
        setProfiles(list);
        setSelectedProfile(curr => {
          if (curr) {
            const found = list.find(p => (p._id || p.id) === (curr._id || curr.id));
            if (found) return found;
          }
          return list[0] || null;
        });
      }

      if (changes.geminiApiKey) {
        setGeminiApiKey(changes.geminiApiKey.newValue || '');
      }

      if (changes.useGemini !== undefined) {
        setUseGemini(changes.useGemini.newValue !== false);
      }
    };

    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const selectProfile = useCallback((profile) => {
    setSelectedProfile(profile);
    chrome.storage.local.set({ selectedProfileId: profile?._id || profile?.id || null });
  }, []);

  const saveGeminiKey = useCallback((newKey) => {
    const key = (newKey || '').trim();
    chrome.storage.local.set({ geminiApiKey: key });
    setGeminiApiKey(key);
  }, []);

  const toggleUseGemini = useCallback((val) => {
    chrome.storage.local.set({ useGemini: val });
    setUseGemini(val);
  }, []);

  return {
    profiles,
    selectedProfile,
    selectProfile,
    geminiApiKey,
    saveGeminiKey,
    useGemini,
    toggleUseGemini,
    loading,
  };
}
