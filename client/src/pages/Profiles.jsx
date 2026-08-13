import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, X, Save, Upload, Search, Zap, Trash2 } from 'lucide-react';
import { getProfiles, createProfile, updateProfile, deleteProfile } from '../api/apiClient';
import ProfileCard from '../components/ProfileCard';
import ExcelUploader from '../components/ExcelUploader';

/* ── Key-value row editor ────────────────────────────────── */
function FieldMappingEditor({ pairs, onChange }) {
  const addRow    = () => onChange([...pairs, { key: '', value: '' }]);
  const removeRow = (i) => onChange(pairs.filter((_, idx) => idx !== i));
  const updateRow = (i, field, val) =>
    onChange(pairs.map((p, idx) => (idx === i ? { ...p, [field]: val } : p)));

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_1fr_28px] gap-2 px-0.5">
        <span className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wide">Field Name</span>
        <span className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wide">Value</span>
        <span />
      </div>

      <AnimatePresence initial={false}>
        {pairs.map((pair, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            transition={{ duration: 0.12 }}
            className="grid grid-cols-[1fr_1fr_28px] gap-2 items-center"
          >
            <input className="input text-sm" placeholder="e.g. Name"  value={pair.key}   onChange={e => updateRow(i, 'key',   e.target.value)} />
            <input className="input text-sm" placeholder="e.g. Raj"   value={pair.value} onChange={e => updateRow(i, 'value', e.target.value)} />
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="w-7 h-7 flex items-center justify-center rounded-[8px]
                         text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[#FEF2F2] transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      <button
        type="button"
        onClick={addRow}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-[10px]
                   border border-dashed border-[#E5E7EB] text-xs text-[#9CA3AF]
                   hover:border-[#2563EB]/40 hover:text-[#2563EB] hover:bg-[#EFF6FF]
                   transition-colors"
      >
        <Plus size={13} /> Add Field
      </button>
    </div>
  );
}

/* ── helpers ─────────────────────────────────────────────── */
const pairsToMap = (pairs) =>
  Object.fromEntries(pairs.filter(p => p.key.trim()).map(p => [p.key.trim(), p.value.trim()]));

const mapToPairs = (map) =>
  Object.entries(map || {}).map(([key, value]) => ({ key, value }));

const EMPTY_FORM = { name: '', description: '', tags: '' };

/* ── Main page ───────────────────────────────────────────── */
export default function Profiles() {
  const [profiles, setProfiles]   = useState([]);
  const [loading,  setLoading]    = useState(true);
  const [search,   setSearch]     = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [editing,  setEditing]    = useState(null);
  const [form,     setForm]       = useState(EMPTY_FORM);
  const [pairs,    setPairs]      = useState([{ key: '', value: '' }]);
  const [tab,      setTab]        = useState('manual');
  const [excelMap, setExcelMap]   = useState({});

  const load = () =>
    getProfiles().then(setProfiles).catch(console.error).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  /* ── Filtered list by search ── */
  const filtered = profiles.filter(p => {
    const q = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.tags?.some(t => t.toLowerCase().includes(q))
    );
  });

  /* ── Open modal ── */
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
    const mapped = mapToPairs(p.fieldMap);
    setPairs(mapped.length ? mapped : [{ key: '', value: '' }]);
    setExcelMap({});
    setTab('manual');
    setShowForm(true);
  };

  /* ── Duplicate ── */
  const handleDuplicate = async (p) => {
    try {
      await createProfile({
        name:        `${p.name} (Copy)`,
        description: p.description,
        tags:        p.tags,
        fieldMap:    p.fieldMap,
      });
      await load();
    } catch (err) { console.error(err); }
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const fieldMap = tab === 'manual' ? pairsToMap(pairs) : excelMap;
    const payload  = {
      name:        form.name,
      description: form.description,
      tags:        form.tags.split(',').map(t => t.trim()).filter(Boolean),
      fieldMap,
    };
    try {
      if (editing) {
        const id = editing._id || editing.id;
        if (!id) { alert('Profile ID missing — please refresh.'); return; }
        await updateProfile(id, payload);
      } else {
        await createProfile(payload);
      }
      setShowForm(false);
      await load();
    } catch (err) { console.error(err); alert('Failed to save profile.'); }
  };

  /* ── Delete ── */
  const handleDelete = async (id) => {
    if (!id) { alert('Profile ID missing — please refresh.'); return; }
    if (!confirm('Delete this profile?')) return;
    try { await deleteProfile(id); await load(); }
    catch (err) { console.error(err); alert('Failed to delete.'); }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* ── Top header ─────────────────────────────────────── */}
      <header className="bg-white border-b border-[#E5E7EB] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">

          {/* Logo + Title */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 bg-[#2563EB] rounded-[8px] flex items-center justify-center">
              <Zap size={16} className="text-white" fill="white" />
            </div>
            <span className="text-base font-semibold text-[#111827] tracking-tight">
              Autofill Profiles
            </span>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                id="profile-search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search profiles…"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-[10px] border border-[#E5E7EB]
                           bg-[#F8FAFC] text-[#111827] placeholder-[#9CA3AF]
                           focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10
                           transition-all duration-150"
              />
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* New Profile button */}
          <button id="new-profile-btn" onClick={openCreate} className="btn-primary">
            <Plus size={15} /> New Profile
          </button>
        </div>
      </header>

      {/* ── Page body ──────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-6 py-8">

        {/* Stats row */}
        {!loading && profiles.length > 0 && (
          <p className="text-sm text-[#6B7280] mb-6">
            {filtered.length === profiles.length
              ? `${profiles.length} profile${profiles.length !== 1 ? 's' : ''}`
              : `${filtered.length} of ${profiles.length} profiles`}
          </p>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-24">
            <div className="w-6 h-6 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && profiles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] flex items-center justify-center mb-4">
              <Zap size={22} className="text-[#2563EB]" />
            </div>
            <p className="text-[#111827] font-medium mb-1">No profiles yet</p>
            <p className="text-sm text-[#6B7280] mb-6">Create your first autofill profile to get started.</p>
            <button id="empty-new-profile-btn" onClick={openCreate} className="btn-primary">
              <Plus size={15} /> New Profile
            </button>
          </div>
        )}

        {/* No search results */}
        {!loading && profiles.length > 0 && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-[#111827] font-medium mb-1">No results for "{search}"</p>
            <p className="text-sm text-[#6B7280]">Try a different name, description, or tag.</p>
          </div>
        )}

        {/* Profile grid */}
        {!loading && filtered.length > 0 && (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filtered.map((p, idx) => (
                <ProfileCard
                  key={p._id || p.id || `p-${idx}`}
                  profile={p}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* ── Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            id="profile-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/25 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-xl border border-[#E5E7EB]
                         shadow-[0_8px_32px_rgba(0,0,0,0.12)]
                         w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#F3F4F6]">
                <h2 className="text-sm font-semibold text-[#111827]">
                  {editing ? 'Edit Profile' : 'New Profile'}
                </h2>
                <button
                  id="modal-close-btn"
                  onClick={() => setShowForm(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-[8px]
                             text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#6B7280] transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

                {/* Profile name */}
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1.5">
                    Profile Name <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    id="profile-name-input"
                    className="input"
                    required
                    placeholder="e.g. Personal, Work, College"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1.5">
                    Description
                  </label>
                  <input
                    id="profile-description-input"
                    className="input"
                    placeholder="Optional — what is this profile for?"
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1.5">
                    Tags <span className="text-[#9CA3AF] font-normal">(comma-separated)</span>
                  </label>
                  <input
                    id="profile-tags-input"
                    className="input"
                    placeholder="e.g. Student, Feedback, College"
                    value={form.tags}
                    onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  />
                </div>

                {/* Tab switcher */}
                <div>
                  <div className="flex gap-1 p-1 bg-[#F3F4F6] rounded-[10px] mb-4">
                    {[
                      { id: 'manual', label: 'Manual Entry' },
                      { id: 'excel',  label: 'Upload Excel', icon: <Upload size={12} /> },
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        id={`tab-${t.id}`}
                        onClick={() => setTab(t.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium
                                    rounded-[8px] transition-all duration-150
                                    ${tab === t.id
                                      ? 'bg-white text-[#111827] shadow-sm border border-[#E5E7EB]'
                                      : 'text-[#6B7280] hover:text-[#374151]'}`}
                      >
                        {t.icon}{t.label}
                      </button>
                    ))}
                  </div>

                  {tab === 'manual' ? (
                    <FieldMappingEditor pairs={pairs} onChange={setPairs} />
                  ) : (
                    <ExcelUploader onData={data => setExcelMap(data)} />
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2.5 pt-1">
                  <button
                    id="modal-cancel-btn"
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="btn-secondary flex-1 justify-center"
                  >
                    Cancel
                  </button>
                  <button
                    id="modal-save-btn"
                    type="submit"
                    className="btn-primary flex-1 justify-center"
                  >
                    <Save size={14} />
                    {editing ? 'Update' : 'Save'} Profile
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
