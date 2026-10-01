// Turns the job description into segments tagged by keyword bucket so the
// JD can be rendered like a page marked up with highlighters.

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function buildMarks(keywords) {
  if (!keywords) return [];
  const marks = [];
  for (const [bucket, list] of [
    ['have', keywords.have],
    ['bridge', keywords.bridge],
    ['gap', keywords.gap],
  ]) {
    for (const k of list || []) for (const m of k.matches || []) marks.push({ text: m, bucket, term: k.term, via: k.via });
  }
  // Longest first so "Power BI" wins over "BI"
  return marks.sort((x, y) => y.text.length - x.text.length);
}

export function segmentJd(jd = '', keywords) {
  const marks = buildMarks(keywords);
  if (!jd || !marks.length) return jd ? [{ text: jd }] : [];
  const lookup = new Map(marks.map((m) => [m.text.toLowerCase(), m]));
  const pattern = new RegExp(
    `(?<![A-Za-z0-9])(${marks.map((m) => escapeRe(m.text)).join('|')})(?![A-Za-z0-9+#])`,
    'gi',
  );
  const out = [];
  let last = 0;
  for (const match of jd.matchAll(pattern)) {
    if (match.index > last) out.push({ text: jd.slice(last, match.index) });
    const m = lookup.get(match[0].toLowerCase());
    out.push({ text: match[0], bucket: m?.bucket, term: m?.term, via: m?.via });
    last = match.index + match[0].length;
  }
  if (last < jd.length) out.push({ text: jd.slice(last) });
  return out;
}
