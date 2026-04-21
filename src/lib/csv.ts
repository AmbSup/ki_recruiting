// Minimaler CSV-Parser nach RFC 4180 (ohne Dependency).
// Unterstützt: Komma-Trenner, "…" Quoting mit "" als Escape, CRLF + LF.
// Für komplexere Fälle (Tab-Trenner, andere Encodings) Papaparse ziehen.

export function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        cur.push(field); field = "";
      } else if (ch === "\r") {
        // handled via \n
      } else if (ch === "\n") {
        cur.push(field); field = "";
        rows.push(cur); cur = [];
      } else {
        field += ch;
      }
    }
  }
  if (field.length > 0 || cur.length > 0) { cur.push(field); rows.push(cur); }

  if (rows.length === 0) return { headers: [], rows: [] };
  const headers = (rows[0] ?? []).map((h) => h.trim().toLowerCase());
  const dataRows: Record<string, string>[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    // Leerzeile überspringen
    if (row.length === 1 && row[0].trim() === "") continue;
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => { obj[h] = (row[idx] ?? "").trim(); });
    dataRows.push(obj);
  }
  return { headers, rows: dataRows };
}
