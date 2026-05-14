import { Zap, ExternalLink } from 'lucide-react';

export default function Header({ pageInfo }) {
  return (
    <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
          <Zap size={14} className="text-white" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm leading-none">AutoForm AI</p>
          {pageInfo?.domain && (
            <p className="text-white/60 text-xs mt-0.5 truncate max-w-[200px]">{pageInfo.domain}</p>
          )}
        </div>
      </div>
      <a
        href="http://localhost:5173"
        target="_blank"
        rel="noopener noreferrer"
        title="Open Dashboard"
        className="text-white/70 hover:text-white transition-colors"
      >
        <ExternalLink size={15} />
      </a>
    </div>
  );
}
