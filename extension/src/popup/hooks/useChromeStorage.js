import { useState, useEffect, useCallback } from 'react';

const API_BASE = 'http://localhost:5000/api';

/**
 * Wraps chrome.storage.local get/set with React state.
 * Also fetches and caches profiles from the backend server.
 */
export function useChromeStorage() {
  const [profiles,        setProfiles]        = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [serverUrl,       setServerUrlState]  = useState(API_BASE);
  const [loading,         setLoading]         = useState(true);

  // Load from chrome.storage on mount
  useEffect(() => {
    chrome.storage.local.get(['selectedProfileId', 'cachedProfiles', 'serverUrl'], (res) => {
      const url = res.serverUrl || API_BASE;
      setServerUrlState(url);
      if (res.cachedProfiles?.length) {
        setProfiles(res.cachedProfiles);
        const found = res.cachedProfiles.find(p => (p._id || p.id) === res.selectedProfileId);
        if (found) setSelectedProfile(found);
      }
      setLoading(false);
      // Refresh from server in background
      fetchProfiles(url);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfiles = useCallback((url) => {
    fetch(`${url || serverUrl}/profiles`)
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setProfiles(list);
        chrome.storage.local.set({ cachedProfiles: list });
      })
      .catch(() => {}); // silently fail — use cached
  }, [serverUrl]);

  const selectProfile = useCallback((profile) => {
    setSelectedProfile(profile);
    chrome.storage.local.set({ selectedProfileId: profile?._id || profile?.id || null });
  }, []);

  const saveServerUrl = useCallback((url) => {
    setServerUrlState(url);
    chrome.storage.local.set({ serverUrl: url });
    fetchProfiles(url);
  }, [fetchProfiles]);

  return { profiles, selectedProfile, selectProfile, serverUrl, saveServerUrl, loading, refetch: () => fetchProfiles(serverUrl) };
}
