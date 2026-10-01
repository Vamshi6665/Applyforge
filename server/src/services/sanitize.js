// Post-processing that enforces the house writing rules no matter which model
// produced the text. Models drift; this guarantees the output contract.

export const LINKEDIN_LIMIT = 300;

const FILLER = [
  'thrilled', 'leverage', 'leveraging', 'synergy', 'synergies', 'fast-paced', 'passionate about',
  'i am excited to', "i'm excited to", 'cutting-edge', 'game-changer', 'rockstar', 'ninja',
  'dynamic team', 'results-driven', 'go-getter', 'hit the ground running', 'delve', 'tapestry',
  'in today\'s', 'spearheaded', 'unwavering', 'testament to',
];

export function humanize(text = '') {
  let t = String(text);
  t = t.replace(/\r/g, '');
  t = t.replace(/\*\*(.+?)\*\*/gs, '$1').replace(/__(.+?)__/gs, '$1');
  t = t.replace(/(^|\s)\*(\S[^*\n]*?\S)\*(?=\s|[.,;:!?]|$)/g, '$1$2');
  t = t.replace(/^\s{0,3}#{1,6}\s+/gm, '');
  t = t.replace(/^[ \t]*[*•][ \t]+/gm, '- ');
  // Dashes used as punctuation become commas. Hyphenated words are untouched.
  t = t.replace(/\s*[—–]\s*/g, ', ');
  t = t.replace(/\s+--+\s+/g, ', ').replace(/(\w)--+(\w)/g, '$1, $2');
  t = t.replace(/[ \t]+,/g, ',').replace(/,\s*,/g, ',').replace(/,(\S)/g, (m, c) => (/\d/.test(c) ? m : `, ${c}`));
  t = t.replace(/[ \t]{2,}/g, ' ');
  t = t.replace(/\n{3,}/g, '\n\n');
  return t.trim();
}

/** Trim to a character limit, preferring a sentence end, then a word boundary. */
export function fitToLimit(text, limit = LINKEDIN_LIMIT) {
  const t = String(text).trim();
  if (t.length <= limit) return t;
  const cut = t.slice(0, limit);
  const sentenceEnd = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  if (sentenceEnd > limit * 0.6) return cut.slice(0, sentenceEnd + 1).trim();
  if (/[.!?]$/.test(cut)) return cut;
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : limit - 1).replace(/[,;:]$/, '')}.`.slice(0, limit);
}

/** Lightweight quality checks shown next to each draft. */
export function checkQuality(text = '', { type } = {}) {
  const issues = [];
  const lower = text.toLowerCase();
  const filler = FILLER.filter((f) => lower.includes(f));
  if (filler.length) issues.push(`Filler phrases: ${filler.join(', ')}`);
  if (/[—–]|--/.test(text)) issues.push('Contains dashes used as punctuation');
  if (/\*\*/.test(text)) issues.push('Contains markdown bold');
  if (/\[(company|role|name|title)\]/i.test(text) && type !== 'linkedin') issues.push('Has an unfilled placeholder');
  if (type === 'linkedin' && text.length > LINKEDIN_LIMIT) issues.push(`Over ${LINKEDIN_LIMIT} characters`);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return { chars: text.length, words, issues };
}

export function cleanDoc(text, type) {
  let out = humanize(text);
  if (type === 'linkedin') out = fitToLimit(out.replace(/\n+/g, ' '), LINKEDIN_LIMIT);
  if (type === 'resume') {
    out = out
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => (l.startsWith('- ') ? l : `- ${l.replace(/^[-\d.)\s]+/, '')}`))
      .join('\n');
  }
  return out;
}
