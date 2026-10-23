import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, ToggleLeft, ToggleRight, X, Eye, EyeOff, Save } from 'lucide-react';
import Header          from './components/Header';
import ProfileSelector from './components/ProfileSelector';
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
 * AI matching using Google's gemini-embedding-001 (free, fast, accurate).
 * Embeds field labels + profile keys → cosine similarity → best match per field.
 */
async function matchWithEmbeddings(apiKey, fields, profileMap) {
  if (!apiKey) return null;

  const profileKeys = Object.keys(profileMap);

  // Build richer text for each field — combine label AND placeholder for better context
  // e.g. "comments your comment" matches "review" much better than just "comments"
  const fieldLabels = fields.map(f => {
    const label = (f.label || f.ariaLabel || f.name || '').toLowerCase().trim();
    const hint  = (f.placeholder || '').toLowerCase().trim();
    return hint && hint !== label ? `${label} ${hint}` : label || f.type || '';
  });

  // Only embed fields that have a label
  const validIndices = fieldLabels
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => t.length > 0)
    .map(({ i }) => i);

  if (!validIndices.length || !profileKeys.length) return null;

  // Embed profile keys directly for clean semantic comparison
  const profileTexts = profileKeys.map(k => k.toLowerCase().trim());

  const allTexts = [
    ...validIndices.map(i => fieldLabels[i]),
    ...profileTexts,
  ];

  // Embed everything in parallel — gemini-embedding-001 on v1 (not v1beta)
  const embeddings = await Promise.all(
    allTexts.map(async (text) => {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-embedding-001:embedContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: { parts: [{ text }] },
            taskType: 'SEMANTIC_SIMILARITY',
          }),
          signal: AbortSignal.timeout(10000),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`Embedding ${res.status}: ${err?.error?.message || 'failed'}`);
      }
      const data = await res.json();
      return data.embedding.values;
    })
  );

  const fieldEmbeddings = embeddings.slice(0, validIndices.length);
  const keyEmbeddings   = embeddings.slice(validIndices.length);

  // Cosine similarity
  function cosine(a, b) {
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i]; magA += a[i] * a[i]; magB += b[i] * b[i];
    }
    return (!magA || !magB) ? 0 : dot / (Math.sqrt(magA) * Math.sqrt(magB));
  }

  // In gemini-embedding-001:
  // Related concepts (e.g. Location vs Address) score 0.85 - 0.95
  // Unrelated concepts score < 0.82
  const THRESHOLD = 0.82;
  const MIN_GAP   = 0.01;
  const aiMatches = {};

  validIndices.forEach((fieldIdx, embIdx) => {
    const scores = keyEmbeddings.map(keyEmb => cosine(fieldEmbeddings[embIdx], keyEmb));

    let bestScore = -1, bestKeyIdx = -1;
    let secondScore = -1;
    for (let k = 0; k < scores.length; k++) {
      if (scores[k] > bestScore) {
        secondScore = bestScore;
        bestScore   = scores[k];
        bestKeyIdx  = k;
      } else if (scores[k] > secondScore) {
        secondScore = scores[k];
      }
    }

    const gap = bestScore - secondScore;
    console.log(
      `[FillKaro] Field "${fieldLabels[fieldIdx]}" → best: "${profileKeys[bestKeyIdx]}" (${bestScore.toFixed(3)}, gap ${gap.toFixed(3)})`
    );

    const isMatch = (bestScore >= THRESHOLD && gap >= MIN_GAP) || bestScore >= 0.86;
    if (isMatch && bestKeyIdx >= 0) {
      aiMatches[fieldIdx] = {
        key:   profileKeys[bestKeyIdx],
        value: profileMap[profileKeys[bestKeyIdx]],
      };
    }
  });

  console.log('[FillKaro] Embedding matched:', Object.keys(aiMatches).length, '/', fields.length, 'fields');
  return Object.keys(aiMatches).length > 0 ? aiMatches : null;
}

/* ── Settings Panel ────────────────────────────────────── */
function SettingsPanel({ geminiApiKey, onSaveKey, onClose }) {
  const [key,     setKey]     = useState(geminiApiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [saved,   setSaved]   = useState(false);

  const handleSave = () => {
    onSaveKey(key);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
          Gemini API Key <span className="text-[10px] font-normal text-slate-400">(Priority matching)</span>
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
          When provided, Gemini AI matching is prioritized first, falling back to Dice coefficient if needed.{' '}
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
    </motion.div>
  );
}

/* ── Main App ──────────────────────────────────────────── */
export default function App() {
  const {
    profiles,
    selectedProfile,
    selectProfile,
    geminiApiKey,
    saveGeminiKey,
  } = useChromeStorage();

  const [pageInfo,    setPageInfo]    = useState(null);
  const [fillStatus,  setFillStatus]  = useState('idle'); // idle | filling | filled | error
  const [fillResult,  setFillResult]  = useState(null);
  const [humanMode,   setHumanMode]   = useState(false);
  const [aiEngine,    setAiEngine]    = useState(null);  // 'gemini' | 'dice' | null
  const [activeView,  setActiveView]  = useState('main'); // 'main' | 'settings'

  // Automatically scan for open dashboard tabs and pull latest profiles
  const scanAndSyncFromDashboard = async () => {
    try {
      const tabs = await chrome.tabs.query({});
      for (const t of tabs) {
        if (!t?.id || !t?.url) continue;
        if (t.url.includes('localhost') || t.url.includes('127.0.0.1') || t.url.includes('fillkaro')) {
          try {
            const results = await chrome.scripting.executeScript({
              target: { tabId: t.id },
              func: () => {
                try {
                  return localStorage.getItem('fillkaro_profiles');
                } catch {
                  return null;
                }
              },
            });
            const raw = results?.[0]?.result;
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed) && parsed.length > 0) {
                await chrome.storage.local.set({ cachedProfiles: parsed });
                console.log('[FillKaro] Auto-synced', parsed.length, 'profiles from open tab:', t.url);
                return true;
              }
            }
          } catch {}
        }
      }
    } catch (e) {
      console.warn('[FillKaro] Auto-sync scan error:', e.message);
    }
    return false;
  };

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

    // Auto-sync from dashboard on popup open
    scanAndSyncFromDashboard();
  }, []);

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

      // ── AI Matching: gemini-embedding-001 → Dice fallback ──
      let aiMatches = {};
      let usedEngine = 'dice';
      let aiError = null;

      if (geminiApiKey) {
        try {
          const embMatches = await matchWithEmbeddings(geminiApiKey, currentFields, profile);
          if (embMatches && Object.keys(embMatches).length > 0) {
            aiMatches = embMatches;
            usedEngine = 'embedding';
          }
        } catch (err) {
          aiError = err.message;
          console.warn('[FillKaro] Embedding failed, falling back to Dice:', err.message);
        }
      }

      setAiEngine(usedEngine);

      // Fill the fields
      const res = await sendMsg(
        activeTab.id,
        {
          action:     'AUTOFILL',
          fields:     currentFields,
          profileMap: profile,
          options:    {
            humanMode,
            threshold: 0.42,
            delayBetween: humanMode ? 100 : 50,
            aiMatches,
          },
        },
        30000,
      );

      if (!res?.success) throw new Error(res?.error || 'Autofill failed.');
      setFillResult({ ...res, ...(aiError ? { aiError } : {}) });
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
    <div className="flex flex-col bg-white" style={{ width: 380, minHeight: 400 }}>
      <Header
        pageInfo={pageInfo}
        onSettingsClick={() => setActiveView(v => (v === 'settings' ? 'main' : 'settings'))}
        isSettingsOpen={activeView === 'settings'}
        onSyncClick={scanAndSyncFromDashboard}
      />

      <AnimatePresence mode="wait">
        {activeView === 'settings' ? (
          <SettingsPanel
            key="settings"
            geminiApiKey={geminiApiKey}
            onSaveKey={saveGeminiKey}
            onClose={() => setActiveView('main')}
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
            {/* Clean Profile Dropdown Selector */}
            <ProfileSelector
              profiles={profiles}
              selected={selectedProfile}
              onSelect={selectProfile}
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
                          ? '✨ Matched using Gemini AI'
                          : aiEngine === 'embedding'
                          ? '🧠 Matched using AI Embeddings'
                          : '🎲 Matched using Dice coefficient'}
                      </p>
                    )}
                    {fillResult.aiError && (
                      <p className="text-[10px] text-amber-600 border-t border-green-200 pt-1 mt-1">
                        ⚠️ AI fallback: {fillResult.aiError}
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
