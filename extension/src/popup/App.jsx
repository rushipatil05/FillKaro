import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan, Bot, Settings2, Play, ToggleLeft, ToggleRight, AlertTriangle, ChevronDown } from 'lucide-react';
import Header          from './components/Header';
import ScanResults     from './components/ScanResults';
import ProfileSelector from './components/ProfileSelector';
import ExcelActions    from './components/ExcelActions';
import StatusBadge     from './components/StatusBadge';
import { useFormScan }      from './hooks/useFormScan';
import { useChromeStorage } from './hooks/useChromeStorage';
import { findBestMatch }    from './utils/fuzzyMatch';

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

const TABS = [
  { id: 'scan',     label: 'Scan',     icon: Scan     },
  { id: 'autofill', label: 'Autofill', icon: Bot      },
  { id: 'settings', label: 'Settings', icon: Settings2 },
];

export default function App() {
  const [tab, setTab] = useState('scan');

  const { fields, status: scanStatus, error: scanError, scan, clearScan } = useFormScan();
  const { profiles, selectedProfile, selectProfile, serverUrl, saveServerUrl, loading: profilesLoading, refetch } = useChromeStorage();

  // Page info (domain / title)
  const [pageInfo, setPageInfo] = useState(null);

  // Autofill state
  const [fillStatus,  setFillStatus]  = useState('idle'); // idle | filling | filled | error
  const [fillResult,  setFillResult]  = useState(null);
  const [humanMode,   setHumanMode]   = useState(false);

  // Excel import state — persisted to chrome.storage
  // importedRows: Array<{ label: string, map: { [key]: value } }>
  // selectedRowIdx: number (which row the user picked)
  const [importedRows,    setImportedRows]    = useState(null);   // null = no import
  const [selectedRowIdx,  setSelectedRowIdx]  = useState(0);

  // Settings form
  const [urlInput, setUrlInput] = useState(serverUrl);

  /* ── Restore imported Excel from storage on popup open ── */
  useEffect(() => {
    chrome.storage.local.get(['importedRows', 'selectedRowIdx'], (res) => {
      if (res.importedRows?.length) {
        setImportedRows(res.importedRows);
        setSelectedRowIdx(res.selectedRowIdx ?? 0);
      }
    });
  }, []);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([t]) => {
      if (t) setPageInfo({ url: t.url, domain: new URL(t.url).hostname, title: t.title });
    });
  }, []);

  /* ── Derived: current map from selected Excel row ── */
  const importedMap = importedRows?.length
    ? (importedRows[selectedRowIdx]?.map ?? importedRows[0]?.map ?? null)
    : null;

  /* ── Persist Excel state whenever it changes ── */
  const handleImport = (rows) => {
    setImportedRows(rows);
    setSelectedRowIdx(0);
    chrome.storage.local.set({ importedRows: rows, selectedRowIdx: 0 });
    setTab('autofill');
  };

  const handleRowChange = (idx) => {
    setSelectedRowIdx(idx);
    chrome.storage.local.set({ selectedRowIdx: idx });
  };

  const clearImport = () => {
    setImportedRows(null);
    setSelectedRowIdx(0);
    chrome.storage.local.remove(['importedRows', 'selectedRowIdx']);
  };

  // Compute match preview for scan results
  const matchInfo = useCallback(() => {
    const profile = importedMap
      ? { fieldMap: importedMap }
      : selectedProfile;
    if (!profile?.fieldMap || !fields.length) return {};
    const keys = Object.keys(profile.fieldMap);
    const info  = {};
    fields.forEach(f => {
      const m = findBestMatch(f, keys);
      if (m.key) info[f.index] = m;
    });
    return info;
  }, [fields, selectedProfile, importedMap])();

  const handleAutofill = async () => {
    // Build profile map first — bail if nothing selected
    const profile = importedMap
      ? importedMap
      : selectedProfile?.fieldMap
        ? Object.fromEntries(Object.entries(selectedProfile.fieldMap))
        : null;

    if (!profile || Object.keys(profile).length === 0) {
      setFillStatus('error');
      setFillResult({ error: 'Please select a profile or import an Excel file first.' });
      return;
    }

    setFillStatus('filling');
    setFillResult(null);

    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!activeTab?.id) throw new Error('No active tab found.');

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
          console.warn('[AutoForm AI popup] Injection failed:', injErr.message);
        }
      }

      // Get fresh fields directly from the page
      const scanRes = await sendMsg(activeTab.id, { action: 'SCAN_FORM' });
      if (!scanRes?.success) throw new Error(scanRes?.error || 'Could not scan the page.');
      const currentFields = scanRes.fields || [];

      if (!currentFields.length) throw new Error('No fillable form fields found on this page.');

      const res = await sendMsg(
        activeTab.id,
        {
          action:     'AUTOFILL',
          fields:     currentFields,
          profileMap: profile,
          options:    { humanMode, threshold: 0.42, delayBetween: humanMode ? 100 : 50 },
        },
        30000,
      );

      if (!res?.success) throw new Error(res?.error || 'Autofill failed.');

      setFillResult(res);
      setFillStatus('filled');

      // Log to server (fire-and-forget)
      if (pageInfo) {
        fetch(`${serverUrl}/history`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain:      pageInfo.domain,
            url:         pageInfo.url,
            title:       pageInfo.title || '',
            fieldCount:  res.total,
            filledCount: res.filled,
            profileName: importedRows
              ? (importedRows[selectedRowIdx]?.label || 'Excel Import')
              : (selectedProfile?.name || 'Excel Import'),
            profileUsed: selectedProfile?._id || selectedProfile?.id || null,
            status:      res.filled === res.total ? 'complete'
                       : res.filled > 0           ? 'partial' : 'failed',
          }),
        }).catch(() => {});
      }
    } catch (err) {
      setFillStatus('error');
      setFillResult({ error: err.message });
    }
  };

  const profileMap = importedMap || (selectedProfile?.fieldMap
    ? Object.fromEntries(Object.entries(selectedProfile.fieldMap))
    : null);

  return (
    <div className="flex flex-col bg-white" style={{ width: 380, minHeight: 480 }}>
      <Header pageInfo={pageInfo} />

      {/* Tab Bar */}
      <div className="flex border-b border-slate-100 bg-slate-50">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all relative ${
              tab === id ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Icon size={13} />
            {label}
            {tab === id && (
              <motion.div layoutId="tabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">

          {/* ── SCAN TAB ── */}
          {tab === 'scan' && (
            <motion.div key="scan" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-3">
              <div className="flex items-center justify-between">
                <StatusBadge status={scanStatus} extra={fields.length ? `${fields.length} fields` : ''} />
                {fields.length > 0 && (
                  <button onClick={clearScan} className="text-xs text-slate-400 hover:text-slate-600">Clear</button>
                )}
              </div>

              {scanError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-600">
                  <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                  {scanError}
                </div>
              )}

              <button
                onClick={scan}
                disabled={scanStatus === 'scanning'}
                className="w-full btn-primary flex items-center justify-center gap-2 py-2.5 disabled:opacity-60"
              >
                <Scan size={15} />
                {scanStatus === 'scanning' ? 'Scanning…' : fields.length ? 'Re-scan Form' : 'Scan Form'}
              </button>

              {fields.length > 0 && (
                <>
                  <p className="text-xs text-slate-400">{fields.length} fields detected · {Object.keys(matchInfo).length} will be matched</p>
                  <ScanResults fields={fields} matchInfo={matchInfo} />
                  <ExcelActions fields={fields} onImport={handleImport} />
                </>
              )}
            </motion.div>
          )}

          {/* ── AUTOFILL TAB ── */}
          {tab === 'autofill' && (
            <motion.div key="autofill" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
              <ProfileSelector
                profiles={profiles}
                selected={selectedProfile}
                onSelect={p => { selectProfile(p); clearImport(); }}
                onRefresh={refetch}
                loading={profilesLoading}
              />

              {/* ── Excel import banner + row picker ── */}
              {importedRows?.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span>📊 Excel imported ({importedRows.length} {importedRows.length === 1 ? 'record' : 'records'})</span>
                    <button onClick={clearImport} className="text-amber-500 hover:text-amber-700 font-medium">✕</button>
                  </div>

                  {/* Row picker — only shown when there are multiple rows */}
                  {importedRows.length > 1 && (
                    <div className="flex items-center gap-2">
                      <span className="text-amber-600 shrink-0">Fill as:</span>
                      <div className="relative flex-1">
                        <select
                          value={selectedRowIdx}
                          onChange={e => handleRowChange(Number(e.target.value))}
                          className="w-full appearance-none bg-white border border-amber-200 rounded-lg px-2 py-1 pr-6 text-xs text-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-300"
                        >
                          {importedRows.map((row, i) => (
                            <option key={i} value={i}>{row.label}</option>
                          ))}
                        </select>
                        <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-amber-500 pointer-events-none" />
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] text-amber-500">
                    {Object.keys(importedMap ?? {}).length} field values loaded
                  </p>
                </div>
              )}

              {/* Human mode toggle */}
              <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2.5">
                <div>
                  <p className="text-xs font-medium text-slate-700">Human-like typing</p>
                  <p className="text-[10px] text-slate-400">Types char-by-char with delay</p>
                </div>
                <button onClick={() => setHumanMode(m => !m)} className="text-brand-600 transition-transform active:scale-90">
                  {humanMode ? <ToggleRight size={24} /> : <ToggleLeft size={24} className="text-slate-300" />}
                </button>
              </div>

              {/* Fill status result */}
              {fillStatus !== 'idle' && (
                <div className={`rounded-xl p-3 text-xs space-y-1 ${fillStatus === 'filled' ? 'bg-green-50 border border-green-200' : fillStatus === 'error' ? 'bg-red-50 border border-red-100' : 'bg-blue-50'}`}>
                  {fillStatus === 'filled' && fillResult && (
                    <p className="font-medium text-green-700">✅ Filled {fillResult.filled}/{fillResult.total} fields</p>
                  )}
                  {fillStatus === 'error' && <p className="text-red-600">❌ {fillResult?.error}</p>}
                  {fillStatus === 'filling' && <p className="text-blue-600 flex items-center gap-1"><span className="animate-spin inline-block">⚙</span> Filling fields…</p>}
                </div>
              )}

              <div className="space-y-2">
                {!fields.length && (
                  <p className="text-xs text-slate-400 text-center py-2">
                    No fields scanned yet.{' '}
                    <button onClick={() => setTab('scan')} className="text-brand-600 hover:underline">Go to Scan →</button>
                  </p>
                )}
                <button
                  onClick={handleAutofill}
                  disabled={fillStatus === 'filling' || !profileMap}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-2.5 disabled:opacity-50"
                >
                  <Play size={15} />
                  {fillStatus === 'filling' ? 'Filling…' : 'Autofill Now'}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── SETTINGS TAB ── */}
          {tab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-1">Server URL</p>
                <p className="text-xs text-slate-400 mb-3">The local API server address for syncing profiles.</p>
                <input
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder="http://localhost:5000/api"
                />
                <button
                  onClick={() => saveServerUrl(urlInput)}
                  className="mt-2 w-full btn-primary py-2 text-xs"
                >
                  Save & Reconnect
                </button>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-2.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Dashboard</span>
                  <a href="http://localhost:5173" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">Open →</a>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Profiles cached</span>
                  <span className="font-medium text-slate-700">{profiles.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Version</span>
                  <span className="font-medium text-slate-700">1.0.0</span>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
