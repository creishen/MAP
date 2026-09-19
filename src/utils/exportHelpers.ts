/* 
  file summary: export helper utilities for downloading table datasets as csv files or generated pdf print reports.
  responsibilities: formats data rows into csv strings and triggers browser file downloads, or opens formatted print pdf views.
  role in system: consumed by table components (VesselTable, AssuranceTable, DocumentTable) for export actions.
*/

/**
  what: exports an array of data objects to a downloadable csv file.
  how: converts object keys to header line, escapes values, builds csv blob, and triggers browser download anchor click.
  with what file: src/utils/exportHelpers.ts used by table header action controls.
*/
export function exportToCsv(filename: string, rows: Record<string, any>[]): void {
  if (!rows || rows.length === 0) return;

  const keys = Object.keys(rows[0]);
  const headerLine = keys.join(',');

  const rowLines = rows.map((row) =>
    keys
      .map((key) => {
        const val = row[key] ?? '';
        const escaped = String(val).replace(/"/g, '""');
        return `"${escaped}"`;
      })
      .join(',')
  );

  const csvContent = 'data:text/csv;charset=utf-8,' + [headerLine, ...rowLines].join('\n');
  const encodedUri = encodeURI(csvContent);

  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
  what: exports tabular data as a clean printable pdf report using arial font for document contents.
  how: generates html table view in a new print window with arial styling and triggers window.print() for saving as pdf.
  with what file: src/utils/exportHelpers.ts used by table header action controls.
*/
export function exportToPdf(title: string, headers: string[], rows: (string | number)[][]): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #0f172a; }
          h2 { border-bottom: 2px solid #0f172a; padding-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; font-size: 12px; }
          th { background-color: #f1f5f9; font-weight: bold; }
          .footer { margin-top: 20px; font-size: 10px; color: #64748b; }
        </style>
      </head>
      <body>
        <h2>Marine Assurance Platform — ${title} Report</h2>
        <div className="footer">Generated on: ${new Date().toUTCString()}</div>
        <table>
          <thead>
            <tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows
      .map((r) => `<tr>${r.map((cell) => `<td>${cell}</td>`).join('')}</tr>`)
      .join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
}
