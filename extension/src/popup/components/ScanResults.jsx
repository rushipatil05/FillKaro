import { motion, AnimatePresence } from 'framer-motion';
import { Type, List, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

const TYPE_COLOR = {
  text:     'bg-blue-50 text-blue-600',
  email:    'bg-purple-50 text-purple-600',
  tel:      'bg-green-50 text-green-600',
  number:   'bg-orange-50 text-orange-600',
  password: 'bg-red-50 text-red-600',
  select:   'bg-teal-50 text-teal-600',
  textarea: 'bg-indigo-50 text-indigo-600',
  radio:    'bg-pink-50 text-pink-600',
  checkbox: 'bg-yellow-50 text-yellow-700',
  date:     'bg-cyan-50 text-cyan-600',
  default:  'bg-slate-100 text-slate-500',
};

export default function ScanResults({ fields, matchInfo = {} }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? fields : fields.slice(0, 4);

  if (!fields.length) return null;

  return (
    <div className="space-y-1.5">
      <AnimatePresence initial={false}>
        {shown.map((f, i) => {
          const matched = matchInfo[f.index];
          return (
            <motion.div
              key={`${f.index}-${i}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-xs ${
                matched ? 'border-green-200 bg-green-50' : 'border-slate-100 bg-white'
              }`}
            >
              <span className={`shrink-0 px-1.5 py-0.5 rounded-md font-medium uppercase text-[10px] ${TYPE_COLOR[f.type] || TYPE_COLOR.default}`}>
                {f.type}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-700 truncate">{f.label || f.name || f.id || f.placeholder || '(unnamed)'}</p>
                {matched && (
                  <p className="text-green-600 text-[10px] truncate">→ {matched.key} ({(matched.score * 100).toFixed(0)}%)</p>
                )}
              </div>
              {f.required && <span className="shrink-0 text-red-400 font-bold">*</span>}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {fields.length > 4 && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full text-xs text-slate-400 hover:text-brand-600 flex items-center justify-center gap-1 py-1 transition-colors"
        >
          {expanded ? <><ChevronUp size={12}/>Show less</> : <><ChevronDown size={12}/>{fields.length - 4} more fields</>}
        </button>
      )}
    </div>
  );
}
