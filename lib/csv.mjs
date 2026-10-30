// Quote CSV fields and keep user-entered spreadsheet formulas as literal text.
export function csvCell(value) {
  let text = String(value ?? '');
  if (typeof value === 'string' && (/^\s*[=+@-]/u.test(text) || /^[\t\r\n]/u.test(text))) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
