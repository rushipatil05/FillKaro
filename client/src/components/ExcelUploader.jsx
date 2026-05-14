import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileSpreadsheet, X, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ExcelUploader({ onData }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName]   = useState('');
  const [preview, setPreview]     = useState(null);

  const processFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const wb   = XLSX.read(e.target.result, { type: 'array' });
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
      if (!rows.length) return;
      const fieldMap = rows[0]; // first row treated as key→value map
      setPreview(fieldMap);
      onData?.(fieldMap);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
          dragging ? 'border-brand-400 bg-brand-50' : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50'
        }`}
      >
        <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => processFile(e.target.files[0])} />
        <FileSpreadsheet size={32} className="mx-auto text-slate-300 mb-2" />
        <p className="text-sm font-medium text-slate-600">Drop your Excel file here</p>
        <p className="text-xs text-slate-400 mt-1">or click to browse · .xlsx, .xls, .csv</p>
      </div>

      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-green-50 border border-green-200 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle size={15} />
                <span className="text-sm font-medium">{fileName}</span>
              </div>
              <button onClick={() => { setPreview(null); setFileName(''); }} className="text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(preview).slice(0, 6).map(([k, v]) => (
                <div key={k} className="bg-white rounded-lg px-2.5 py-1.5 text-xs">
                  <span className="text-slate-400">{k}: </span>
                  <span className="font-medium text-slate-700">{String(v)}</span>
                </div>
              ))}
            </div>
            {Object.keys(preview).length > 6 && (
              <p className="text-xs text-slate-400 mt-2 text-center">+{Object.keys(preview).length - 6} more fields</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
