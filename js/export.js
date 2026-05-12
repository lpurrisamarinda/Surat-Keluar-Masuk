import { formatDate } from './utilities.js';

function normalizeForExport(data) {
  return data.map((item) => ({
    'ID': item.id,
    'Nomor Surat': item.noSurat,
    'Tanggal Surat': item.tanggalSurat || item.tanggalMasuk || '',
    'Tujuan / Pengirim': item.tujuanSurat || item.pengirim || '',
    'Perihal': item.perihal || '',
    'Sifat Surat': item.sifatSurat || '',
    'Status': item.status || '',
    'Lampiran': item.lampiran?.name || '',
    'Keterangan': item.keterangan || '',
    'Dibuat': formatDate(item.createdAt)
  }));
}

export function exportCSV(data, filename = 'surat-export.csv') {
  const rows = normalizeForExport(data);
  const headers = Object.keys(rows[0] || {});
  const output = [headers.join(','), ...rows.map((row) => headers.map((key) => `"${String(row[key] || '').replace(/"/g, '""')}"`).join(','))].join('\r\n');
  const blob = new Blob([output], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportExcel(data, filename = 'surat-export.xlsx') {
  if (!window.XLSX) {
    throw new Error('Library XLSX tidak tersedia.');
  }
  const rows = normalizeForExport(data);
  const worksheet = window.XLSX.utils.json_to_sheet(rows);
  const workbook = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(workbook, worksheet, 'Surat');
  const wbout = window.XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
