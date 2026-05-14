import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, X, Save, Upload, Trash2 } from 'lucide-react';
import { getProfiles, createProfile, updateProfile, deleteProfile } from '../api/apiClient';
import ProfileCard from '../components/ProfileCard';
import ExcelUploader from '../components/ExcelUploader';

/* ── Reusable key-value row editor ───────────────────────────── */
function FieldMappingEditor({ pairs, onChange }) {
  const addRow = () => onChange([...pairs, { key: '', value: '' }]);
  const removeRow = (i) => onChange(pairs.filter((_, idx) => idx !== i));
  const updateRow = (i, field, val) => {
    const next = pairs.map((p, idx) => idx === i ? { ...p, [field]: val } : p);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {/* Header row */}
      <div className="grid grid-cols-[1fr_1fr_28px] gap-2 px-1">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Field Name</span>
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Value</span>
        <span />
      </div>

      {/* Data rows */}
      <AnimatePresence initial={false}>
        {pairs.map((pair, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-[1fr_1fr_28px] gap-2 items-center"
          >
            <input
              className="input text-sm"
              placeholder="e.g. Name"
              value={pair.key}
              onChange={e => updateRow(i, 'key', e.target.value)}
            />
            <input
              className="input text-sm"
              placeholder="e.g. Raj"
              value={pair.value}
              onChange={e => updateRow(i, 'value', e.target.value)}
            />
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Add row button */}
      <button
        type="button"
        onClick={addRow}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-slate-200
                   text-xs text-slate-400 hover:text-brand-600 hover:border-brand-300 hover:bg-brand-50 transition-colors"
      >
        <Plus size={13} /> Add Field
      </button>
    </div>
  );
}

/* ── helpers ─────────────────────────────────────────────────── */
const pairsToMap = (pairs) =>
  Object.fromEntries(pairs.filter(p => p.key.trim()).map(p => [p.key.trim(), p.value.trim()]));

const mapToPairs = (map) =>
  Object.entries(map || {}).map(([key, value]) => ({ key, value }));

const EMPTY_FORM = { name: '', description: '', tags: '' };

/* ── Main page ───────────────────────────────────────────────── */
export default function Profiles() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [pairs, setPairs] = useState([{ key: '', value: '' }]); // row-based editor
  const [tab, setTab] = useState('manual'); // 'manual' | 'excel'
  const [excelMap, setExcelMap] = useState({});

  const load = () =>
    getProfiles().then(setProfiles).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setPairs([{ key: '', value: '' }]);
    setExcelMap({});
    setTab('manual');
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description || '', tags: (p.tags || []).join(', ') });
    setPairs(mapToPairs(p.fieldMap).length ? mapToPairs(p.fieldMap) : [{ key: '', value: '' }]);
    setExcelMap({});
    setTab('manual');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fieldMap = tab === 'manual' ? pairsToMap(pairs) : excelMap;
    const payload = {
      name: form.name,
      description: form.description,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      fieldMap,
    };
    try {
      if (editing) {
        const profileId = editing._id || editing.id;
        if (!profileId) {
          console.error('Cannot update: Profile ID is missing');
          alert('Error: Profile ID is missing. Please refresh and try again.');
          return;
        }
        await updateProfile(profileId, payload);
      } else {
        await createProfile(payload);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      console.error('Submit failed:', err);
      alert('Failed to save profile. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (!id) {
      console.error('Cannot delete: Profile ID is missing');
      alert('Error: Profile ID is missing. Please refresh and try again.');
      return;
    }
    if (!confirm('Delete this profile?')) return;
    try {
      await deleteProfile(id);
      await load();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete profile. Please try again.');
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Profiles</h1>
          <p className="text-slate-500 text-sm mt-1">Saved field mappings for autofill</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Profile
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-400 text-sm">No profiles yet. Create one or upload an Excel file.</p>
          <button onClick={openCreate} className="btn-primary mt-4 inline-flex items-center gap-2"><Plus size={15} />Create Profile</button>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {profiles.map((p, idx) => (
              <ProfileCard key={p._id || p.id || `profile-${idx}`} profile={p} onEdit={openEdit} onDelete={handleDelete} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Modal ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h2 className="font-semibold text-slate-900">{editing ? 'Edit Profile' : 'New Profile'}</h2>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Profile name */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">Profile Name *</label>
                  <input className="input" required value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Student Profile" />
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">Description</label>
                  <input className="input" value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Optional note" />
                </div>

                {/* Tags */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">Tags (comma separated)</label>
                  <input className="input" value={form.tags}
                    onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                    placeholder="Student, Feedback, College" />
                </div>

                {/* Tab switcher */}
                <div>
                  <div className="flex gap-2 mb-3">
                    <button type="button" onClick={() => setTab('manual')}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${tab === 'manual' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      Manual Entry
                    </button>
                    <button type="button" onClick={() => setTab('excel')}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${tab === 'excel' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Upload size={12} /> Upload Excel
                    </button>
                  </div>

                  {tab === 'manual' ? (
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-2 block">
                        Field Mappings
                        <span className="ml-1.5 text-slate-400 font-normal">— enter each field and its value</span>
                      </label>
                      <FieldMappingEditor pairs={pairs} onChange={setPairs} />

                      {/* Live JSON preview */}
                      {pairs.some(p => p.key.trim()) && (
                        <div className="mt-3 rounded-xl bg-slate-50 border border-slate-100 p-3">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">JSON Preview</p>
                          <pre className="text-[11px] text-slate-600 font-mono overflow-x-auto whitespace-pre-wrap break-all">
                            {JSON.stringify(pairsToMap(pairs), null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <ExcelUploader onData={data => setExcelMap(data)} />
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2">
                    <Save size={15} />{editing ? 'Update' : 'Save'} Profile
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
