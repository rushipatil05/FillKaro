import { Zap, Settings } from 'lucide-react';

export default function Header({ pageInfo, onSettingsClick, isSettingsOpen }) {
  return (
    <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
          <Zap size={14} className="text-white" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm leading-none">FillKaro</p>
          {pageInfo?.domain ? (
            <p className="text-white/70 text-[11px] mt-0.5 truncate max-w-[210px]">{pageInfo.domain}</p>
          ) : (
            <p className="text-white/60 text-[10px] mt-0.5">100% Local &amp; Private</p>
          )}
        </div>
      </div>

      <button
        onClick={onSettingsClick}
        title="Settings & Backup"
        className={`p-1.5 rounded-lg transition-colors ${
          isSettingsOpen ? 'bg-white/20 text-white' : 'text-white/80 hover:text-white hover:bg-white/10'
        }`}
      >
        <Settings size={15} />
      </button>
    </div>
  );
}
