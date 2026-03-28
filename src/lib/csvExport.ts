/** Escape CSV field per RFC-style (quotes + double quotes). */
function escapeField(value: string | number | boolean | Date | null | undefined): string {
  const s =
    value instanceof Date
      ? value.toISOString()
      : value === null || value === undefined
        ? ""
        : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function rowsToCsv(headers: string[], rows: (string | number | boolean | Date | null | undefined)[][]): string {
  const head = headers.map(escapeField).join(",");
  const body = rows.map((r) => r.map(escapeField).join(",")).join("\r\n");
  return `${head}\r\n${body}`;
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
