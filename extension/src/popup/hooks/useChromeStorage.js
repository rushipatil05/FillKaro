import { useState, useEffect, useCallback } from 'react';

// Hardcoded backend URL — change to your deployed Vercel backend URL for production
const SERVER_URL = 'http://localhost:5000/api';

/**
 * useChromeStorage hook
 * Connects directly to the FillKaro backend API.
 * Ensures the website dashboard and the Chrome extension have the exact same profiles!
 */
export function useChromeStorage() {
  const [profiles,        setProfiles]        = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [geminiApiKey,    setGeminiApiKey]   = useState('');

  const fetchProfiles = useCallback(() => {
    fetch(`${SERVER_URL}/profiles`)
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setProfiles(list);
        chrome.storage.local.set({ cachedProfiles: list });

        setSelectedProfile(curr => {
          if (curr) {
            const found = list.find(p => (p._id || p.id) === (curr._id || curr.id));
            if (found) return found;
          }
          return list[0] || null;
        });
      })
      .catch((err) => {
        console.warn('[FillKaro] Server unreachable, using local cache:', err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  // Load from chrome.storage on mount, then refresh from server
  useEffect(() => {
    chrome.storage.local.get(['selectedProfileId', 'cachedProfiles', 'geminiApiKey'], (res) => {
      setGeminiApiKey(res.geminiApiKey || '');

      if (res.cachedProfiles?.length) {
        setProfiles(res.cachedProfiles);
        const found = res.cachedProfiles.find(p => (p._id || p.id) === res.selectedProfileId);
        if (found) setSelectedProfile(found);
        else setSelectedProfile(res.cachedProfiles[0]);
      }
      fetchProfiles();
    });
  }, [fetchProfiles]);

  const selectProfile = useCallback((profile) => {
    setSelectedProfile(profile);
    chrome.storage.local.set({ selectedProfileId: profile?._id || profile?.id || null });
  }, []);

  const saveProfile = useCallback(async (profileData) => {
    const isNew = !profileData._id && !profileData.id;
    const targetId = profileData._id || profileData.id;

    try {
      const url = isNew ? `${SERVER_URL}/profiles` : `${SERVER_URL}/profiles/${targetId}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const saved = await res.json();

      // Refresh from server
      fetchProfiles();
      setSelectedProfile(saved);
      return saved;
    } catch (err) {
      console.warn('[FillKaro] Save to backend failed, saving locally:', err.message);
      // Local fallback
      const fallback = { ...profileData, _id: targetId || 'p_' + Date.now() };
      setProfiles(prev => [fallback, ...prev.filter(p => (p._id || p.id) !== fallback._id)]);
      setSelectedProfile(fallback);
      return fallback;
    }
  }, [fetchProfiles]);

  const deleteProfile = useCallback(async (profileId) => {
    try {
      await fetch(`${SERVER_URL}/profiles/${profileId}`, { method: 'DELETE' });
      fetchProfiles();
    } catch (err) {
      console.warn('[FillKaro] Delete from backend failed, deleting locally:', err.message);
      setProfiles(prev => prev.filter(p => (p._id || p.id) !== profileId));
    }
  }, [fetchProfiles]);

  const saveGeminiKey = useCallback((newKey) => {
    const key = (newKey || '').trim();
    chrome.storage.local.set({ geminiApiKey: key });
    setGeminiApiKey(key);
  }, []);

  const importProfiles = useCallback((importedList) => {
    if (!Array.isArray(importedList) || importedList.length === 0) return false;
    setProfiles(importedList);
    setSelectedProfile(importedList[0]);
    chrome.storage.local.set({ cachedProfiles: importedList });
    return true;
  }, []);

  return {
    profiles,
    selectedProfile,
    selectProfile,
    saveProfile,
    deleteProfile,
    importProfiles,
    serverUrl: SERVER_URL,
    geminiApiKey,
    saveGeminiKey,
    loading,
    refetch: fetchProfiles,
  };
}
