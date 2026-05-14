import * as XLSX from 'xlsx';

/**
 * Export detected form fields to a user-friendly .xlsx.
 */
export function exportFieldsToExcel(fields, filename = 'autoform_fields.xlsx') {
  const wb = XLSX.utils.book_new();

  /* ── Main data entry sheet ─────────────────────────────── */
  const headerRow = {};
  fields.forEach((f) => {
    const label = f.label || f.placeholder || f.name || f.id || `field_${f.index}`;
    headerRow[label] = '';
  });

  const rows = [headerRow];
  const ws = XLSX.utils.json_to_sheet(rows);

  const colWidths = fields.map(f => {
    const label = f.label || f.placeholder || f.name || f.id || `field_${f.index}`;
    return { wch: Math.max(15, label.length + 2) };
  });
  ws['!cols'] = colWidths;

  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let C = range.s.c; C <= range.e.c; C++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c: C })];
    if (cell) cell.s = { font: { bold: true } };
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Data');

  /* ── Instructions sheet ──────────────────────────────── */
  const instrRows = [
    { Instructions: '1. Fill in the data in the "Data" sheet with your information.' },
    { Instructions: '2. Save this file and import it back using the extension (Import .xlsx button).' },
    { Instructions: '3. OR upload it to the Dashboard → Profiles page to save it as a reusable profile.' },
    { Instructions: '' },
    { Instructions: 'TIPS:' },
    { Instructions: '• Enter one complete record per row.' },
    { Instructions: '• You can leave cells blank — those fields will be skipped.' },
    { Instructions: '• To add multiple records, simply add more rows below the first one.' },
  ];
  const instrWs = XLSX.utils.json_to_sheet(instrRows);
  instrWs['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, instrWs, 'Instructions');

  XLSX.writeFile(wb, filename);
}

/**
 * Convert a single Excel row object into a key→value profile map.
 */
export function rowToProfileMap(row) {
  const map = {};
  Object.entries(row).forEach(([key, val]) => {
    const v = String(val ?? '').trim();
    if (key && v) map[key] = v;
  });
  return map;
}

/**
 * Parse an imported .xlsx and return ALL rows as an array of plain objects.
 * Each element is { label: string, map: { [fieldName]: value } }
 *
 * The caller can then let the user pick which row to use.
 */
export function parseExcelToRows(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!rows.length) return resolve([]);

        const headers = Object.keys(rows[0]);

        // Detect column names (case-insensitive)
        const col = (candidates) =>
          headers.find(h => candidates.some(c => h.toLowerCase().includes(c.toLowerCase()))) || '';

        const fieldCol = col(['field', 'label', 'question', 'key']);
        const valueCol = col(['value']);
        const nameCol  = col(['name (attr)', 'name attr', 'name_attr']);
        const idCol    = col(['id (attr)', 'id attr', 'id_attr']);

        // Legacy format: "Field" / "Value" columns  →  single-map result wrapped in array
        if (fieldCol || valueCol) {
          const map = {};
          rows.forEach((row, i) => {
            const key   = String(row[fieldCol] || row[nameCol] || row[idCol] || `field_${i + 1}`).trim();
            const value = String(row[valueCol] || '').trim();
            if (key && value) map[key] = value;
          });
          const label = Object.values(map)[0] || 'Row 1';
          return resolve([{ label, map }]);
        }

        // Simplified format: headers = field names, each row = one person's data
        // ── First header that looks like a "Name" column is used as the row label ──
        const nameHeader = headers.find(h =>
          /^name$/i.test(h.trim()) || /full.?name/i.test(h) || /^(your.?)?name$/i.test(h)
        ) || headers[0];

        const result = rows
          .map((row, i) => {
            const map = {};
            headers.forEach(header => {
              const v = String(row[header] ?? '').trim();
              if (v) map[header] = v;
            });
            const label = map[nameHeader] || `Row ${i + 1}`;
            return { label, map };
          })
          .filter(r => Object.keys(r.map).length > 0); // skip fully empty rows

        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

// ── Legacy alias kept so old callers don't break ──────────────────────────────
export function parseExcelToProfileMap(file) {
  return parseExcelToRows(file).then(rows => (rows[0]?.map ?? {}));
}
