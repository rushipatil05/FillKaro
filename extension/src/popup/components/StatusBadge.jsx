import { CheckCircle, AlertCircle, XCircle, Loader2, Clock } from 'lucide-react';

const STATUS_CONFIG = {
  idle:       { icon: Clock,        text: 'Ready',         cls: 'bg-slate-100 text-slate-500'  },
  scanning:   { icon: Loader2,      text: 'Scanning…',     cls: 'bg-blue-50 text-blue-600'     },
  done:       { icon: CheckCircle,  text: 'Scan complete', cls: 'bg-green-50 text-green-600'   },
  filling:    { icon: Loader2,      text: 'Filling…',      cls: 'bg-blue-50 text-blue-600'     },
  filled:     { icon: CheckCircle,  text: 'Filled!',       cls: 'bg-green-50 text-green-600'   },
  error:      { icon: XCircle,      text: 'Error',         cls: 'bg-red-50 text-red-500'       },
  'no-content': { icon: AlertCircle, text: 'No access',   cls: 'bg-amber-50 text-amber-600'   },
};

export default function StatusBadge({ status, extra }) {
  const cfg  = STATUS_CONFIG[status] || STATUS_CONFIG.idle;
  const Icon = cfg.icon;
  const spin = status === 'scanning' || status === 'filling';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.cls}`}>
      <Icon size={12} className={spin ? 'animate-spin' : ''} />
      {cfg.text}{extra ? ` · ${extra}` : ''}
    </span>
  );
}
