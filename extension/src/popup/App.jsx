import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, ToggleLeft, ToggleRight, Settings, X, Eye, EyeOff, Save, Download, Upload, Check } from 'lucide-react';
import Header          from './components/Header';
import ProfileSelector from './components/ProfileSelector';
import ProfileEditor   from './components/ProfileEditor';
import { useChromeStorage } from './hooks/useChromeStorage';

/** Promise-based chrome.tabs.sendMessage with configurable timeout */
function sendMsg(tabId, msg, ms = 8000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Timeout after ' + ms + 'ms')), ms);
    chrome.tabs.sendMessage(tabId, msg, (res) => {
      clearTimeout(t);
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve(res);
    });
  });
}

/**
 * Call Gemini directly from the extension using the user's own API key.
 * Uses the generateContent REST endpoint — zero backend needed.
 */
async function callGeminiDirect(apiKey, fields, profileMap) {
  if (!apiKey) return null;

  const fieldLabels = fields.map((f, i) => {
    const label = f.ariaLabel || f.label || f.name || f.placeholder || `field_${i}`;
    return `${i}: ${label}`;
  }).join('\n');

  const profileKeys = Object.keys(profileMap).join(', ');

  const prompt = `You are a form-filling assistant. Match each form field to the best profile key.

FORM FIELDS (index: label):
${fieldLabels}

PROFILE KEYS available: ${profileKeys}

Respond ONLY with a JSON object mapping field index (as string) to profile key name.
Example: {"0": "First Name", "1": "Email"}
Only include fields you are confident about. No explanation.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 512 },
      }),
      signal: AbortSignal.timeout(12000),
    }
  );

  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  const mapping = JSON.parse(jsonMatch[0]);

  const enhanced = { ...profileMap };
  for (const [idxStr, profileKey] of Object.entries(mapping)) {
    const idx = parseInt(idxStr);
    const field = fields[idx];
    if (!field || !profileMap[profileKey]) continue;
    const label = field.ariaLabel || field.label || field.name || field.placeholder;
    if (label) enhanced[label] = profileMap[profileKey];
  }
  return enhanced;
}

/* ── Settings Panel ────────────────────────────────────── */
function SettingsPanel({ geminiApiKey, profiles, onSaveKey, onImportProfiles, onClose }) {
  const [key,     setKey]     = useState(geminiApiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const fileInputRef = useRef(null);

  const handleSave = () => {
    onSaveKey(key);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(profiles, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `fillkaro-profiles-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result);
        if (Array.isArray(parsed) && parsed.length > 0) {
          onImportProfiles(parsed);
          setImportStatus('success');
          setTimeout(() => setImportStatus(null), 3000);
        } else {
          setImportStatus('error');
        }
      } catch {
        setImportStatus('error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.15 }}
      className="flex-1 p-4 space-y-4 overflow-y-auto"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800">Settings</p>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Gemini API Key */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-600">
          Gemini API Key <span className="text-[10px] font-normal text-slate-400">(optional)</span>
        </label>
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={key}
            onChange={e => setKey(e.target.value)}
            placeholder="AIza…"
            className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 pr-9 focus:outline-none focus:ring-2 focus:ring-brand-400 text-slate-700 placeholder-slate-300"
          />
          <button
            onClick={() => setShowKey(v => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        </div>
        <p className="text-[10px] text-slate-400">
          Your own Google Gemini API key for smart AI field matching.{' '}
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-500 underline"
          >
            Get a free key →
          </a>
        </p>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="w-full btn-primary flex items-center justify-center gap-1.5 py-2 text-xs font-medium"
      >
        {saved ? (
          <><span>✅</span> Key Saved!</>
        ) : (
          <><Save size={13} /> Save API Key</>
        )}
      </button>

      {/* Backup & Restore */}
      <div className="border-t border-slate-100 pt-3 space-y-2">
        <p className="text-[11px] font-semibold text-slate-700">Backup &amp; Restore</p>
        <p className="text-[10px] text-slate-400">
          Export your profiles to a JSON file or import them on another device.
        </p>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center justify-center gap-1.5 py-2 px-3 border border-slate-200 rounded-xl text-xs text-slate-600 hover:bg-slate-50 transition-colors font-medium"
          >
            <Download size={13} /> Export JSON
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-1.5 py-2 px-3 border border-slate-200 rounded-xl text-xs text-slate-600 hover:bg-slate-50 transition-colors font-medium"
          >
            <Upload size={13} /> Import JSON
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json,application/json"
            className="hidden"
          />
        </div>

        {importStatus === 'success' && (
          <p className="text-[10px] text-emerald-600 flex items-center gap-1">
            <Check size={12} /> Profiles imported successfully!
          </p>
        )}
        {importStatus === 'error' && (
          <p className="text-[10px] text-red-500">
            Invalid JSON file. Please upload a valid profiles file.
          </p>
        )}
      </div>

      {/* Engine explanation */}
      <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-[10px]">
        <p className="font-semibold text-slate-500 uppercase tracking-wide">Privacy Guarantee</p>
        <p className="text-slate-500">
          🔒 <strong>100% Local:</strong> Your profile data is stored only inside your browser extension and never transmitted to any external server.
        </p>
      </div>
    </motion.div>
  );
}

/* ── Main App ──────────────────────────────────────────── */
export default function App() {
  const {
    profiles,
    selectedProfile,
    selectProfile,
    saveProfile,
    deleteProfile,
    importProfiles,
    geminiApiKey,
    saveGeminiKey,
    loading: profilesLoading,
  } = useChromeStorage();

  const [pageInfo,        setPageInfo]        = useState(null);
  const [fillStatus,      setFillStatus]      = useState('idle'); // idle | filling | filled | error
  const [fillResult,      setFillResult]      = useState(null);
  const [humanMode,       setHumanMode]       = useState(false);
  const [aiEngine,        setAiEngine]        = useState(null);  // 'gemini' | 'dice' | null
  const [activeView,      setActiveView]      = useState('main'); // 'main' | 'settings' | 'editor'
  const [editingProfile,  setEditingProfile]  = useState(null);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([t]) => {
      if (!t || !t.url) {
        setPageInfo({ url: '', domain: '', title: '' });
        return;
      }
      let domain = '';
      try {
        domain = new URL(t.url).hostname;
      } catch {
        domain = '';
      }
      setPageInfo({ url: t.url, domain, title: t.title || '' });
    });
  }, []);

  const handleNewProfile = () => {
    setEditingProfile(null);
    setActiveView('editor');
  };

  const handleEditProfile = (profile) => {
    setEditingProfile(profile);
    setActiveView('editor');
  };

  const handleSaveProfileData = (profileData) => {
    saveProfile(profileData);
    setActiveView('main');
  };

  const handleDeleteProfileData = (profileId) => {
    deleteProfile(profileId);
    setActiveView('main');
  };

  // Chrome does not allow scripting on chrome:// or other system pages
  const isSystemPage = (url) => {
    if (!url) return true;
    return (
      url.startsWith('chrome://') ||
      url.startsWith('chrome-extension://') ||
      url.startsWith('about:') ||
      url.startsWith('edge://') ||
      url.startsWith('brave://') ||
      url.startsWith('data:') ||
      url === ''
    );
  };

  const onSystemPage = isSystemPage(pageInfo?.url || '');

  const handleAutofill = async () => {
    if (onSystemPage) {
      setFillStatus('error');
      setFillResult({ error: 'Navigate to a real website first — FillKaro cannot run on Chrome system pages.' });
      return;
    }

    if (!selectedProfile?.fieldMap || Object.keys(selectedProfile.fieldMap).length === 0) {
      setFillStatus('error');
      setFillResult({ error: 'Please select or configure a profile with fields first.' });
      return;
    }

    const profile = Object.fromEntries(Object.entries(selectedProfile.fieldMap));

    setFillStatus('filling');
    setFillResult(null);
    setAiEngine(null);

    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!activeTab?.id) throw new Error('No active tab found.');

      // Inject content script if not already present
      let needsInject = false;
      try {
        const ping = await sendMsg(activeTab.id, { action: 'PING' }, 1500);
        needsInject = !ping?.ok;
      } catch {
        needsInject = true;
      }

      if (needsInject) {
        try {
          await chrome.scripting.executeScript({ target: { tabId: activeTab.id }, files: ['content.js'] });
          await new Promise(r => setTimeout(r, 400));
        } catch {
          throw new Error('Could not connect to this page. Try refreshing the tab first, then try again.');
        }
      }

      // Scan the page for form fields
      const scanRes = await sendMsg(activeTab.id, { action: 'SCAN_FORM' });
      if (!scanRes?.success) throw new Error(scanRes?.error || 'Could not scan the page.');
      const currentFields = scanRes.fields || [];
      if (!currentFields.length) throw new Error('No fillable form fields found on this page.');

      // ── AI matching: user's own Gemini key → direct API call ──────────
      let enhancedProfile = { ...profile };
      let usedEngine = 'dice';

      if (geminiApiKey) {
        try {
          const aiProfile = await callGeminiDirect(geminiApiKey, currentFields, profile);
          if (aiProfile && Object.keys(aiProfile).length > Object.keys(profile).length) {
            enhancedProfile = aiProfile;
            usedEngine = 'gemini';
          }
        } catch (aiErr) {
          console.log('[FillKaro] Gemini direct call fallback:', aiErr.message);
        }
      }

      setAiEngine(usedEngine);

      // Fill the fields
      const res = await sendMsg(
        activeTab.id,
        {
          action:     'AUTOFILL',
          fields:     currentFields,
          profileMap: enhancedProfile,
          options:    { humanMode, threshold: 0.42, delayBetween: humanMode ? 100 : 50 },
        },
        30000,
      );

      if (!res?.success) throw new Error(res?.error || 'Autofill failed.');
      setFillResult(res);
      setFillStatus('filled');
    } catch (err) {
      setFillStatus('error');
      setFillResult({ error: err.message });
    }
  };

  const profileMap = selectedProfile?.fieldMap
    ? Object.fromEntries(Object.entries(selectedProfile.fieldMap))
    : null;

  return (
    <div className="flex flex-col bg-white" style={{ width: 380, minHeight: 460 }}>
      <Header
        pageInfo={pageInfo}
        onSettingsClick={() => setActiveView(v => (v === 'settings' ? 'main' : 'settings'))}
        isSettingsOpen={activeView === 'settings'}
      />

      <AnimatePresence mode="wait">
        {activeView === 'settings' ? (
          <SettingsPanel
            key="settings"
            geminiApiKey={geminiApiKey}
            profiles={profiles}
            onSaveKey={saveGeminiKey}
            onImportProfiles={importProfiles}
            onClose={() => setActiveView('main')}
          />
        ) : activeView === 'editor' ? (
          <ProfileEditor
            key="editor"
            profile={editingProfile}
            onSave={handleSaveProfileData}
            onDelete={handleDeleteProfileData}
            onCancel={() => setActiveView('main')}
          />
        ) : (
          <motion.div
            key="main"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {/* Profile selector */}
            <ProfileSelector
              profiles={profiles}
              selected={selectedProfile}
              onSelect={selectProfile}
              onNewProfile={handleNewProfile}
              onEditProfile={handleEditProfile}
            />

            {/* Human-like typing toggle */}
            <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2.5">
              <div>
                <p className="text-xs font-medium text-slate-700">Human-like typing</p>
                <p className="text-[10px] text-slate-400">Types char-by-char with slight delay</p>
              </div>
              <button
                onClick={() => setHumanMode(m => !m)}
                className="text-brand-600 transition-transform active:scale-90"
              >
                {humanMode ? <ToggleRight size={24} /> : <ToggleLeft size={24} className="text-slate-300" />}
              </button>
            </div>

            {/* Matching engine indicator */}
            <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2">
              <div>
                <p className="text-xs font-medium text-slate-700">Matching engine</p>
                <p className="text-[10px] text-slate-400">
                  {geminiApiKey ? '✨ Gemini AI (your key)' : '🎲 Dice coefficient (no key set)'}
                </p>
              </div>
              <button
                onClick={() => setActiveView('settings')}
                className="text-slate-400 hover:text-brand-600 transition-colors"
                title="Configure in Settings"
              >
                <Settings size={15} />
              </button>
            </div>

            {/* Result banner */}
            {fillStatus !== 'idle' && (
              <div className={`rounded-xl p-3 text-xs space-y-1 ${
                fillStatus === 'filled' ? 'bg-green-50 border border-green-200'
                : fillStatus === 'error' ? 'bg-red-50 border border-red-100'
                : 'bg-blue-50 border border-blue-100'
              }`}>
                {fillStatus === 'filling' && (
                  <p className="text-blue-600 flex items-center gap-1.5">
                    <span className="animate-spin inline-block">⚙</span> Scanning &amp; filling fields…
                  </p>
                )}
                {fillStatus === 'filled' && fillResult && (
                  <>
                    <p className="font-medium text-green-700">✅ Filled {fillResult.filled}/{fillResult.total} fields</p>
                    {aiEngine && (
                      <p className="text-[10px] text-green-500">
                        {aiEngine === 'gemini'
                          ? '✨ Matched using your Gemini API key'
                          : '🎲 Matched using Dice coefficient'}
                      </p>
                    )}
                  </>
                )}
                {fillStatus === 'error' && (
                  <p className="text-red-600">❌ {fillResult?.error}</p>
                )}
              </div>
            )}

            {/* System page warning — show instead of making user click first */}
            {onSystemPage && (
              <div className="rounded-xl p-3 text-xs bg-amber-50 border border-amber-200 text-amber-800 space-y-0.5">
                <p className="font-semibold">⚠️ System page detected</p>
                <p className="text-amber-700">
                  Open a real website (e.g. a Google Form, job application, or college admission form), then click the FillKaro icon again.
                </p>
              </div>
            )}

            {/* Autofill button */}
            <button
              onClick={handleAutofill}
              disabled={onSystemPage || fillStatus === 'filling' || !profileMap || Object.keys(profileMap).length === 0}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3 disabled:opacity-50 text-sm"
            >
              <Play size={15} />
              {fillStatus === 'filling' ? 'Filling…' : 'Autofill Now'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
