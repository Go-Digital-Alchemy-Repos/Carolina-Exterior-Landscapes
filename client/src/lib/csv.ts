function hasFormulaPrefix(value: string): boolean {
  let index = 0;
  while (index < value.length && value.charCodeAt(index) <= 0x20) index += 1;
  return ["=", "+", "-", "@"].includes(value[index] ?? "");
}

export function encodeCsvCell(value: unknown): string {
  let text = value === null || value === undefined ? "" : String(value);
  if (hasFormulaPrefix(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function encodeCsv(rows: unknown[][]): string {
  return `\uFEFF${rows.map((row) => row.map(encodeCsvCell).join(",")).join("\r\n")}`;
}
