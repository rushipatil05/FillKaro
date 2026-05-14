import { User, RefreshCw } from 'lucide-react';

export default function ProfileSelector({ profiles, selected, onSelect, onRefresh, loading }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-500">Profile</label>
        <button onClick={onRefresh} disabled={loading} className="text-slate-400 hover:text-brand-600 transition-colors disabled:opacity-50">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {profiles.length === 0 ? (
        <div className="text-center py-4 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
          No profiles found.<br />
          <a href="http://localhost:5173/profiles" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">Create one in the dashboard →</a>
        </div>
      ) : (
        <div className="space-y-1 max-h-40 overflow-y-auto pr-0.5">
          {profiles.map(p => (
            <button
              key={p._id || p.id}
              onClick={() => onSelect(p)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all text-xs ${
                (selected?._id || selected?.id) === (p._id || p.id)
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-50 hover:bg-brand-50 text-slate-700 hover:text-brand-700'
              }`}
            >
              <User size={13} className="shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{p.name}</p>
                {p.fieldMap && (
                  <p className={`text-[10px] ${(selected?._id || selected?.id) === (p._id || p.id) ? 'text-white/70' : 'text-slate-400'}`}>
                    {Object.keys(p.fieldMap).length} fields
                  </p>
                )}
              </div>
              {(selected?._id || selected?.id) === (p._id || p.id) && <div className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
