export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: Array<{ key: keyof T; header: string }>,
) {
  if (data.length === 0) return;

  const cols = columns || Object.keys(data[0]).map((key) => ({ key, header: key }));

  const headers = cols.map((c) => c.header);
  const rows = data.map((row) =>
    cols.map((c) => {
      const val = row[c.key];
      const str = val == null ? "" : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    }),
  );

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
