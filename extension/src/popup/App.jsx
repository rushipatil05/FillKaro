import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, ToggleLeft, ToggleRight } from 'lucide-react';
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

export default function App() {
  const { profiles, selectedProfile, selectProfile, serverUrl, loading: profilesLoading, refetch } = useChromeStorage();

  const [pageInfo,   setPageInfo]   = useState(null);
  const [fillStatus, setFillStatus] = useState('idle'); // idle | filling | filled | error
  const [fillResult, setFillResult] = useState(null);
  const [humanMode,  setHumanMode]  = useState(false);
  const [aiEngine,   setAiEngine]   = useState(null);  // 'gemini-embedding' | 'dice' | null

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([t]) => {
      if (t) setPageInfo({ url: t.url, domain: new URL(t.url).hostname, title: t.title });
    });
  }, []);

  const handleAutofill = async () => {
    if (!selectedProfile?.fieldMap || Object.keys(selectedProfile.fieldMap).length === 0) {
      setFillStatus('error');
      setFillResult({ error: 'Please select a profile first.' });
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
        } catch (injErr) {
          console.warn('[FillKaro] Injection failed:', injErr.message);
        }
      }

      // Scan the page for form fields
      const scanRes = await sendMsg(activeTab.id, { action: 'SCAN_FORM' });
      if (!scanRes?.success) throw new Error(scanRes?.error || 'Could not scan the page.');
      const currentFields = scanRes.fields || [];
      if (!currentFields.length) throw new Error('No fillable form fields found on this page.');

      // ── Gemini AI semantic matching ──────────────────────────────────────
      // Tries to resolve which profile value belongs to each field by meaning.
      // Falls back silently to Dice coefficient if server is offline / no key.
      let enhancedProfile = { ...profile };
      let usedEngine = 'dice';

      try {
        const aiRes = await fetch(`${serverUrl}/ai/match-fields`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields: currentFields, profileMap: profile }),
          signal: AbortSignal.timeout(10000),
        });

        if (aiRes.ok) {
          const { matches, engine } = await aiRes.json();
          if (engine === 'gemini-embedding' && matches && Object.keys(matches).length > 0) {
            for (const [fieldIndex, match] of Object.entries(matches)) {
              const field = currentFields[parseInt(fieldIndex)];
              const fieldKey = field?.label || field?.ariaLabel || field?.name || field?.placeholder;
              if (fieldKey && match?.value) enhancedProfile[fieldKey] = match.value;
            }
            usedEngine = 'gemini-embedding';
          }
        }
      } catch (aiErr) {
        console.log('[FillKaro] AI unavailable → Dice fallback:', aiErr.message);
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
    <div className="flex flex-col bg-white" style={{ width: 380, minHeight: 420 }}>
      <Header pageInfo={pageInfo} />

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {/* Profile selector */}
        <ProfileSelector
          profiles={profiles}
          selected={selectedProfile}
          onSelect={p => selectProfile(p)}
          onRefresh={refetch}
          loading={profilesLoading}
        />

        {/* Human-like typing toggle */}
        <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2.5">
          <div>
            <p className="text-xs font-medium text-slate-700">Human-like typing</p>
            <p className="text-[10px] text-slate-400">Types char-by-char with delay</p>
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
                    {aiEngine === 'gemini-embedding'
                      ? '✨ Matched using Gemini AI embeddings'
                      : '🎲 Matched using Dice coefficient fallback'}
                  </p>
                )}
              </>
            )}
            {fillStatus === 'error' && (
              <p className="text-red-600">❌ {fillResult?.error}</p>
            )}
          </div>
        )}

        {/* Autofill button */}
        <button
          onClick={handleAutofill}
          disabled={fillStatus === 'filling' || !profileMap}
          className="w-full btn-primary flex items-center justify-center gap-2 py-3 disabled:opacity-50 text-sm"
        >
          <Play size={15} />
          {fillStatus === 'filling' ? 'Filling…' : 'Autofill Now'}
        </button>
      </motion.div>
    </div>
  );
}
