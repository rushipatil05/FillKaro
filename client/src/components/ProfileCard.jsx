import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Edit2, Copy, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ── Three-dot dropdown ─────────────────────────────────── */
function CardMenu({ onEdit, onDuplicate, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        id="card-menu-btn"
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className="w-7 h-7 flex items-center justify-center rounded-[8px] text-[#9CA3AF]
                   hover:bg-[#F3F4F6] hover:text-[#6B7280] transition-colors"
      >
        <MoreHorizontal size={15} />
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.1 }}
          className="absolute right-0 top-8 z-50 w-40 bg-white border border-[#E5E7EB]
                     rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.10)] py-1 overflow-hidden"
        >
          <button
            id="card-menu-edit"
            onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(); }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-[#374151]
                       hover:bg-[#F8FAFC] transition-colors"
          >
            <Edit2 size={13} className="text-[#9CA3AF]" /> Edit
          </button>
          <button
            id="card-menu-duplicate"
            onClick={(e) => { e.stopPropagation(); setOpen(false); onDuplicate(); }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-[#374151]
                       hover:bg-[#F8FAFC] transition-colors"
          >
            <Copy size={13} className="text-[#9CA3AF]" /> Duplicate
          </button>
          <div className="my-1 border-t border-[#F3F4F6]" />
          <button
            id="card-menu-delete"
            onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(); }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-[#EF4444]
                       hover:bg-[#FEF2F2] transition-colors"
          >
            <Trash2 size={13} /> Delete
          </button>
        </motion.div>
      )}
    </div>
  );
}

/* ── Profile initial avatar ─────────────────────────────── */
function Avatar({ name }) {
  const letter = (name || '?')[0].toUpperCase();
  const colors = [
    ['#EFF6FF', '#2563EB'], ['#F0FDF4', '#16A34A'],
    ['#FFF7ED', '#EA580C'], ['#FDF4FF', '#9333EA'],
    ['#FFF1F2', '#E11D48'],
  ];
  const idx   = name ? name.charCodeAt(0) % colors.length : 0;
  const [bg, fg] = colors[idx];
  return (
    <div
      className="w-9 h-9 rounded-[10px] flex items-center justify-center text-sm font-semibold shrink-0"
      style={{ backgroundColor: bg, color: fg }}
    >
      {letter}
    </div>
  );
}

/* ── Main card ──────────────────────────────────────────── */
export default function ProfileCard({ profile, onEdit, onDelete, onDuplicate }) {
  const fieldCount = profile.fieldMap ? Object.keys(profile.fieldMap).length : 0;
  const tags       = (profile.tags || []).filter(Boolean);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      onClick={() => onEdit(profile)}
      className="card p-5 flex flex-col gap-3 cursor-pointer
                 hover:border-[#2563EB]/30 hover:shadow-[0_2px_12px_rgba(37,99,235,0.08)]
                 transition-all duration-150 group"
    >
      {/* ── Top row ── */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar name={profile.name} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#111827] truncate leading-snug">
              {profile.name}
            </p>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              {fieldCount} field{fieldCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Three-dot menu — always visible on hover, stop click from opening edit */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <CardMenu
            onEdit={() => onEdit(profile)}
            onDuplicate={() => onDuplicate(profile)}
            onDelete={() => {
              const id = profile._id || profile.id;
              if (id) onDelete(id);
            }}
          />
        </div>
      </div>

      {/* ── Description ── */}
      {profile.description && (
        <p className="text-xs text-[#6B7280] leading-relaxed line-clamp-2">
          {profile.description}
        </p>
      )}

      {/* ── Tags ── */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, i) => (
            <span key={i} className="tag">{tag}</span>
          ))}
        </div>
      )}

      {/* ── Footer ── */}
      <div className="pt-1 mt-auto border-t border-[#F3F4F6] flex items-center justify-between">
        <span className="text-[11px] text-[#9CA3AF]">
          Updated {formatDate(profile.updatedAt)}
        </span>
        {fieldCount > 0 && (
          <span className="text-[11px] text-[#10B981] font-medium">
            ● Active
          </span>
        )}
      </div>
    </motion.div>
  );
}
