import { useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import { exportFieldsToExcel, parseExcelToRows } from '../utils/excelUtils';

export default function ExcelActions({ fields, onImport }) {
  const inputRef = useRef();

  const handleExport = () => {
    if (!fields?.length) return;
    exportFieldsToExcel(fields);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rows = await parseExcelToRows(file);
      onImport?.(rows);   // pass ALL rows to parent
    } catch (err) {
      console.error('Excel parse error:', err);
    }
    e.target.value = '';
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleExport}
        disabled={!fields?.length}
        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 px-3 rounded-xl
                   bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200
                   transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
      >
        <Download size={13} /> Export .xlsx
      </button>
      <button
        onClick={() => inputRef.current.click()}
        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 px-3 rounded-xl
                   bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200
                   transition-all active:scale-95"
      >
        <Upload size={13} /> Import .xlsx
      </button>
      <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
    </div>
  );
}
