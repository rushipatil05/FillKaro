import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Globe, CheckCircle, AlertCircle, XCircle, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getHistory, deleteHistory } from '../api/apiClient';

const statusIcon = {
  complete: <CheckCircle size={14} className="text-green-500" />,
  partial:  <AlertCircle size={14} className="text-amber-500" />,
  failed:   <XCircle    size={14} className="text-red-500"   />,
};
const statusBadge = { complete: 'badge-green', partial: 'badge-yellow', failed: 'badge-red' };

export default function History() {
  const [data,    setData]    = useState({ docs: [], total: 0, pages: 1 });
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);

  const load = (p = 1) => {
    setLoading(true);
    getHistory(p, 15).then(d => { setData(d); setPage(p); }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    await deleteHistory(id);
    load(page);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">History</h1>
        <p className="text-slate-500 text-sm mt-1">{data.total} autofill sessions recorded</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data.docs.length === 0 ? (
        <div className="card text-center py-16">
          <Clock size={40} className="mx-auto text-slate-200 mb-3" />
          <p className="text-slate-400 text-sm">No history yet. Use the Chrome extension to autofill forms.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Domain</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Profile</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Fields</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Time</th>
                  <th className="px-4 py-3.5" />
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {data.docs.map((h, i) => (
                    <motion.tr
                      key={h._id || h.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors group"
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <Globe size={14} className="text-slate-400 shrink-0" />
                          <div>
                            <p className="font-medium text-slate-700">{h.domain}</p>
                            <p className="text-xs text-slate-400 truncate max-w-[180px]">{h.url}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">{h.profileName || '—'}</td>
                      <td className="px-4 py-3.5">
                        <span className="font-medium text-slate-700">{h.filledCount}</span>
                        <span className="text-slate-400">/{h.fieldCount}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`badge ${statusBadge[h.status]} gap-1`}>
                          {statusIcon[h.status]}{h.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                        {new Date(h.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5">
                        <button onClick={() => handleDelete(h._id || h.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100">
              <p className="text-xs text-slate-400">Page {page} of {data.pages}</p>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => load(page - 1)} className="btn-secondary px-3 py-1.5 disabled:opacity-40">
                  <ChevronLeft size={15} />
                </button>
                <button disabled={page === data.pages} onClick={() => load(page + 1)} className="btn-secondary px-3 py-1.5 disabled:opacity-40">
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
