import { useState, useEffect, useCallback } from 'react';

const SERVER_URL = 'http://localhost:5000/api';

/**
 * Wraps chrome.storage.local get/set with React state.
 * Fetches and caches profiles from the backend server.
 * Server URL is hardcoded — no user-configurable setting needed.
 */
export function useChromeStorage() {
  const [profiles,        setProfiles]        = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [loading,         setLoading]         = useState(true);

  const fetchProfiles = useCallback(() => {
    fetch(`${SERVER_URL}/profiles`)
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setProfiles(list);
        chrome.storage.local.set({ cachedProfiles: list });
      })
      .catch(() => {}); // silently fail — use cached
  }, []);

  // Load from chrome.storage on mount, then refresh from server
  useEffect(() => {
    chrome.storage.local.get(['selectedProfileId', 'cachedProfiles'], (res) => {
      if (res.cachedProfiles?.length) {
        setProfiles(res.cachedProfiles);
        const found = res.cachedProfiles.find(p => (p._id || p.id) === res.selectedProfileId);
        if (found) setSelectedProfile(found);
      }
      setLoading(false);
      fetchProfiles();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectProfile = useCallback((profile) => {
    setSelectedProfile(profile);
    chrome.storage.local.set({ selectedProfileId: profile?._id || profile?.id || null });
  }, []);

  return { profiles, selectedProfile, selectProfile, serverUrl: SERVER_URL, loading, refetch: fetchProfiles };
}
