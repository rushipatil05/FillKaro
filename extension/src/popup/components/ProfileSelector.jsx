import { useState, useRef, useEffect } from 'react';
import { User, Plus, Edit3, ChevronDown, Check, Briefcase, GraduationCap, FolderPlus } from 'lucide-react';

function getProfileIcon(name = '') {
  const lower = name.toLowerCase();
  if (lower.includes('work') || lower.includes('job') || lower.includes('company')) {
    return <Briefcase size={14} className="shrink-0 text-amber-500" />;
  }
  if (lower.includes('college') || lower.includes('student') || lower.includes('school') || lower.includes('edu')) {
    return <GraduationCap size={14} className="shrink-0 text-emerald-500" />;
  }
  return <User size={14} className="shrink-0 text-brand-500" />;
}

export default function ProfileSelector({ profiles, selected, onSelect, onNewProfile, onEditProfile }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (profile) => {
    onSelect(profile);
    setIsOpen(false);
  };

  const fieldCount = selected?.fieldMap ? Object.keys(selected?.fieldMap).length : 0;

  return (
    <div className="space-y-1.5 relative" ref={dropdownRef}>
      {/* Header Label & Quick Actions */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-500">Active Profile</label>
        <div className="flex items-center gap-2">
          {selected && (
            <button
              type="button"
              onClick={() => onEditProfile(selected)}
              className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-brand-600 transition-colors"
              title="Edit fields of this profile"
            >
              <Edit3 size={11} /> Edit
            </button>
          )}
          <button
            type="button"
            onClick={onNewProfile}
            className="flex items-center gap-1 text-[11px] font-medium text-brand-600 hover:text-brand-700 transition-colors"
            title="Create a new profile"
          >
            <Plus size={12} /> New
          </button>
        </div>
      </div>

      {/* Main Dropdown Trigger Card */}
      <button
        type="button"
        onClick={() => setIsOpen(v => !v)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:border-brand-400 hover:shadow-sm transition-all text-left group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center">
            {getProfileIcon(selected?.name)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-xs text-slate-800 truncate">
              {selected?.name || 'Select a Profile'}
            </p>
            <p className="text-[10px] text-slate-400">
              {fieldCount} {fieldCount === 1 ? 'field' : 'fields'} configured
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-medium text-slate-400 group-hover:text-brand-600">
            Switch
          </span>
          <ChevronDown
            size={14}
            className={`text-slate-400 group-hover:text-brand-600 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100">
          <p className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
            Your Profiles ({profiles.length})
          </p>

          <div className="max-h-44 overflow-y-auto space-y-0.5 pr-0.5">
            {profiles.map(p => {
              const isSelected = (selected?.id || selected?._id) === (p.id || p._id);
              const count = p.fieldMap ? Object.keys(p.fieldMap).length : 0;
              return (
                <button
                  key={p.id || p._id}
                  type="button"
                  onClick={() => handleSelect(p)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs transition-colors ${
                    isSelected
                      ? 'bg-brand-50 text-brand-900 font-medium'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {getProfileIcon(p.name)}
                    <span className="truncate">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-slate-400">
                      {count} {count === 1 ? 'field' : 'fields'}
                    </span>
                    {isSelected && <Check size={13} className="text-brand-600" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Create new profile shortcut inside dropdown */}
          <div className="pt-1 border-t border-slate-100 mt-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onNewProfile();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-brand-600 hover:bg-brand-50 transition-colors"
            >
              <FolderPlus size={13} />
              <span>Create New Profile</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
