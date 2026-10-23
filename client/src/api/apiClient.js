const STORAGE_KEY = 'fillkaro_profiles';

// Default initial profiles if none exist yet
const DEFAULT_PROFILES = [
  {
    _id: 'default_1',
    name: 'Personal',
    description: 'My primary personal information',
    tags: ['personal'],
    fieldMap: {
      'Full Name': 'Rushikesh',
      'Email': 'rushi@gmail.com',
      'Address': 'Mumbai, Maharashtra',
      'Phone number': '9123456780',
      'Review': 'Gooood'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

function getStoredProfiles() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PROFILES));
      return DEFAULT_PROFILES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PROFILES;
  }
}

function saveStoredProfiles(profiles) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    // Broadcast to FillKaro extension content script running on this tab
    window.postMessage({ type: 'FILLKARO_SYNC_TO_EXTENSION', profiles }, '*');
  } catch (err) {
    console.warn('[FillKaro] LocalStorage save failed:', err);
  }
}

// Listen for sync from extension if extension has newer profiles
if (typeof window !== 'undefined') {
  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data) return;
    if (event.data.type === 'FILLKARO_SYNC_FROM_EXTENSION') {
      if (Array.isArray(event.data.profiles) && event.data.profiles.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(event.data.profiles));
        window.dispatchEvent(new CustomEvent('fillkaro_profiles_updated', { detail: event.data.profiles }));
      }
    }
  });

  // Request sync from extension on initial load
  setTimeout(() => {
    window.postMessage({ type: 'FILLKARO_REQUEST_EXTENSION_PROFILES' }, '*');
    // Also push current profiles to extension right away
    window.postMessage({ type: 'FILLKARO_SYNC_TO_EXTENSION', profiles: getStoredProfiles() }, '*');
  }, 300);
}

// ── Profiles CRUD (100% Local) ──────────────────────────────
export const getProfiles = async () => {
  return getStoredProfiles();
};

export const createProfile = async (data) => {
  const profiles = getStoredProfiles();
  const newProfile = {
    ...data,
    _id: 'p_' + Date.now(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const updated = [newProfile, ...profiles];
  saveStoredProfiles(updated);
  return newProfile;
};

export const updateProfile = async (id, data) => {
  const profiles = getStoredProfiles();
  const idx = profiles.findIndex(p => (p._id || p.id) === id);
  if (idx === -1) throw new Error('Profile not found');
  const updatedProfile = {
    ...profiles[idx],
    ...data,
    updatedAt: new Date().toISOString()
  };
  profiles[idx] = updatedProfile;
  saveStoredProfiles(profiles);
  return updatedProfile;
};

export const deleteProfile = async (id) => {
  const profiles = getStoredProfiles();
  const filtered = profiles.filter(p => (p._id || p.id) !== id);
  saveStoredProfiles(filtered);
  return { success: true };
};
