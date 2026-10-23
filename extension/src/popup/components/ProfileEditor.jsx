import { useState } from 'react';
import { Plus, Trash2, ArrowLeft, Save, Sparkles } from 'lucide-react';

const COMMON_SUGGESTIONS = [
  'Full Name', 'First Name', 'Last Name', 'Email', 'Phone',
  'Address', 'City', 'State', 'Pin Code', 'Country',
  'College', 'Degree', 'Branch', 'Graduation Year', 'CGPA',
  'LinkedIn', 'GitHub', 'Portfolio'
];

export default function ProfileEditor({ profile, onSave, onDelete, onCancel }) {
  const [name, setName] = useState(profile?.name || '');
  const [pairs, setPairs] = useState(() => {
    if (!profile?.fieldMap) return [{ key: '', value: '' }];
    const entries = Object.entries(profile.fieldMap);
    return entries.length > 0
      ? entries.map(([key, value]) => ({ key, value }))
      : [{ key: '', value: '' }];
  });

  const addRow = (initialKey = '') => {
    setPairs(prev => [...prev, { key: initialKey, value: '' }]);
  };

  const removeRow = (index) => {
    setPairs(prev => prev.filter((_, idx) => idx !== index));
  };

  const updateRow = (index, field, val) => {
    setPairs(prev => prev.map((p, idx) => (idx === index ? { ...p, [field]: val } : p)));
  };

  const handleSuggestionClick = (suggestedKey) => {
    const exists = pairs.some(p => p.key.trim().toLowerCase() === suggestedKey.toLowerCase());
    if (!exists) {
      // Find an empty row or append
      const emptyIdx = pairs.findIndex(p => !p.key.trim() && !p.value.trim());
      if (emptyIdx !== -1) {
        updateRow(emptyIdx, 'key', suggestedKey);
      } else {
        addRow(suggestedKey);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = name.trim() || 'Untitled Profile';
    const fieldMap = {};
    for (const p of pairs) {
      const k = p.key.trim();
      if (k) {
        fieldMap[k] = p.value.trim();
      }
    }

    onSave({
      ...(profile || {}),
      name: trimmedName,
      fieldMap,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-4 space-y-3.5 overflow-y-auto">
      {/* Top action row */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <p className="text-xs font-semibold text-slate-800">
          {profile?.id || profile?._id ? 'Edit Profile' : 'New Profile'}
        </p>
        {profile?.id || profile?._id ? (
          <button
            type="button"
            onClick={() => {
              if (confirm(`Delete "${name}" profile?`)) {
                onDelete(profile.id || profile._id);
              }
            }}
            className="text-red-500 hover:text-red-700 transition-colors p-1"
            title="Delete profile"
          >
            <Trash2 size={14} />
          </button>
        ) : <div className="w-4" />}
      </div>

      {/* Profile Name */}
      <div className="space-y-1">
        <label className="text-[11px] font-medium text-slate-600">Profile Name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Personal, Work, College"
          className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400 font-medium"
          required
        />
      </div>

      {/* Field suggestions */}
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
          <Sparkles size={11} className="text-brand-500" />
          <span>Quick add common fields:</span>
        </div>
        <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto py-0.5">
          {COMMON_SUGGESTIONS.map(s => {
            const hasIt = pairs.some(p => p.key.trim().toLowerCase() === s.toLowerCase());
            return (
              <button
                key={s}
                type="button"
                onClick={() => handleSuggestionClick(s)}
                disabled={hasIt}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                  hasIt
                    ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-default'
                    : 'border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50 text-slate-600 hover:text-brand-700'
                }`}
              >
                + {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Field pairs list */}
      <div className="space-y-2 flex-1">
        <label className="text-[11px] font-medium text-slate-600">Field Values</label>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {pairs.map((pair, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <input
                type="text"
                value={pair.key}
                onChange={e => updateRow(idx, 'key', e.target.value)}
                placeholder="Field (e.g. Email)"
                className="w-1/2 text-[11px] border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-400"
              />
              <input
                type="text"
                value={pair.value}
                onChange={e => updateRow(idx, 'value', e.target.value)}
                placeholder="Value"
                className="w-1/2 text-[11px] border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-400"
              />
              <button
                type="button"
                onClick={() => removeRow(idx)}
                className="text-slate-300 hover:text-red-500 transition-colors p-1"
                title="Remove field"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => addRow()}
          className="w-full py-1.5 border border-dashed border-slate-200 hover:border-brand-300 hover:bg-brand-50/50 rounded-lg text-[11px] text-slate-500 hover:text-brand-600 flex items-center justify-center gap-1 transition-colors"
        >
          <Plus size={12} /> Add custom field
        </button>
      </div>

      {/* Actions */}
      <div className="pt-2 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="w-1/3 py-2 text-xs border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="w-2/3 btn-primary flex items-center justify-center gap-1.5 py-2 text-xs font-medium"
        >
          <Save size={13} /> Save Profile
        </button>
      </div>
    </form>
  );
}
