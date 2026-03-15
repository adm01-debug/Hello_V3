/**
 * Export utilities for CSV and data export
 */

export interface ExportColumn {
  key: string;
  label: string;
  format?: (value: unknown) => string;
}

/**
 * Export data as CSV file and trigger download
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  filename: string
): void {
  if (data.length === 0) return;

  // BOM for UTF-8 Excel compatibility
  const BOM = '\uFEFF';
  
  // Header row
  const header = columns.map(c => `"${c.label}"`).join(';');
  
  // Data rows
  const rows = data.map(row =>
    columns.map(col => {
      const value = row[col.key];
      const formatted = col.format ? col.format(value) : String(value ?? '');
      return `"${formatted.replace(/"/g, '""')}"`;
    }).join(';')
  );

  const csv = BOM + [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, `${filename}.csv`);
}

/**
 * Export data as JSON file
 */
export function exportToJSON<T>(data: T[], filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  downloadBlob(blob, `${filename}.json`);
}

/**
 * Generate a simple HTML report and trigger download
 */
export function exportToHTML<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  title: string,
  filename: string
): void {
  const tableRows = data.map(row =>
    `<tr>${columns.map(col => {
      const value = row[col.key];
      const formatted = col.format ? col.format(value) : String(value ?? '');
      return `<td style="border:1px solid #ddd;padding:8px">${escapeHtml(formatted)}</td>`;
    }).join('')}</tr>`
  ).join('\n');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    table { border-collapse: collapse; width: 100%; margin-top: 16px; }
    th { background: #f5f5f5; border: 1px solid #ddd; padding: 10px; text-align: left; }
    td { border: 1px solid #ddd; padding: 8px; }
    tr:nth-child(even) { background: #fafafa; }
    .footer { margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
  <p>Total de registros: ${data.length}</p>
  <table>
    <thead><tr>${columns.map(c => `<th>${escapeHtml(c.label)}</th>`).join('')}</tr></thead>
    <tbody>${tableRows}</tbody>
  </table>
  <div class="footer">Relatório gerado automaticamente pelo sistema Hello Contact Center.</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  downloadBlob(blob, `${filename}.html`);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, c => map[c] || c);
}
