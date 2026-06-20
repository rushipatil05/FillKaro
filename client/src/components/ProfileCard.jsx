import { motion } from 'framer-motion';
import { User, Edit2, Trash2, Tag } from 'lucide-react';

export default function ProfileCard({ profile, onEdit, onDelete }) {
  const fieldCount = profile.fieldMap ? Object.keys(profile.fieldMap).length : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      className="card flex flex-col gap-4 group border border-slate-200/80"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
            <User size={18} className="text-brand-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">{profile.name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {fieldCount} field{fieldCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(profile)} className="p-1.5 rounded-lg hover:bg-brand-50 text-slate-400 hover:text-brand-600 transition-colors">
            <Edit2 size={14} />
          </button>
          <button onClick={() => {
            const profileId = profile._id || profile.id;
            if (profileId) onDelete(profileId);
            else console.error('Profile ID is missing:', profile);
          }} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {profile.description && (
        <p className="text-xs text-slate-500 line-clamp-2">{profile.description}</p>
      )}

      {profile.tags?.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {profile.tags.filter(tag => tag && tag.trim()).map((tag, idx) => (
            <span key={`${tag}-${idx}`} className="badge-blue flex items-center gap-1">
              <Tag size={10} />{tag}
            </span>
          ))}
        </div>
      )}

      <div className="bg-slate-50/80 rounded-2xl p-3 space-y-1.5">
        {Object.entries(profile.fieldMap || {}).slice(0, 4).map(([k, v]) => (
          <div key={k} className="flex justify-between text-xs">
            <span className="text-slate-400 font-medium truncate max-w-[40%]">{k}</span>
            <span className="text-slate-600 truncate max-w-[55%] text-right">{v}</span>
          </div>
        ))}
        {fieldCount > 4 && (
          <p className="text-xs text-slate-400 text-center pt-1">+{fieldCount - 4} more fields</p>
        )}
      </div>
    </motion.div>
  );
}
