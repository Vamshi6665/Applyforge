import { KEYWORD_LIBRARY } from './keywordLibrary.js';

/** Rough token estimate (about 4 characters per token for English text). */
export const estimateTokens = (text = '') => Math.ceil(String(text).length / 4);

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Word-boundary regex that also works for terms like C++, C#, .NET and Node.js */
function termRegex(term) {
  return new RegExp(`(?<![A-Za-z0-9])${escapeRe(term)}(?![A-Za-z0-9+#])`, 'gi');
}

const normalize = (s) => String(s).toLowerCase().replace(/[^a-z0-9+#]/g, '');

// ---------------------------------------------------------------------------
// JD compression: strip boilerplate before it is ever sent to a model.
// ---------------------------------------------------------------------------

const BOILERPLATE_HEADING =
  /^(benefits|perks|what we offer|why (you'?ll love|join)|our benefits|compensation|pay (range|transparency)|salary|equal (employment )?opportunity|eeo|diversity|accommodations?|disclaimer|privacy|legal|how to apply|application process|e-verify)\b/i;

const BOILERPLATE_LINE =
  /(equal opportunity employer|without regard to|race, color|sexual orientation|gender identity|veteran status|disability status|reasonable accommodation|e-verify|401\(k\)|paid time off|\bPTO\b|dental|vision insurance|medical insurance|health insurance|parental leave|wellness stipend|pay range|salary range|base salary|we are an equal|background check|drug (test|screen)|click apply|apply now|cookie)/i;

const isHeading = (line) => line.length > 0 && line.length <= 60 && !/[.!?]$/.test(line) && /^[\p{L}][\p{L}\s&'/()-]*:?$/u.test(line);

export function compressJd(raw = '', maxChars = 12000) {
  const original = String(raw).replace(/\r/g, '');
  const lines = original.split('\n').map((l) => l.replace(/\s+/g, ' ').trim());
  const kept = [];
  const seen = new Set();
  let skipping = false;

  for (const line of lines) {
    if (!line) continue;
    const plain = line.replace(/^[#*\-•\s]+/, '').replace(/[*_]+/g, '');
    if (isHeading(plain)) {
      skipping = BOILERPLATE_HEADING.test(plain.replace(/:$/, ''));
      if (skipping) continue;
    }
    if (skipping) continue;
    if (BOILERPLATE_LINE.test(plain)) continue;
    const key = normalize(plain);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    kept.push(plain);
  }

  let text = kept.join('\n');
  let truncated = false;
  if (text.length > maxChars) {
    const cut = text.slice(0, maxChars);
    const lastStop = Math.max(cut.lastIndexOf('\n'), cut.lastIndexOf('. '));
    text = cut.slice(0, lastStop > maxChars * 0.6 ? lastStop + 1 : maxChars).trim();
    truncated = true;
  }

  return {
    text,
    truncated,
    stats: {
      originalChars: original.length,
      compressedChars: text.length,
      savedTokens: Math.max(0, estimateTokens(original) - estimateTokens(text)),
    },
  };
}

// ---------------------------------------------------------------------------
// Role and company detection
// ---------------------------------------------------------------------------

const ROLE_WORDS =
  /\b(engineer|analyst|scientist|developer|manager|intern|specialist|architect|consultant|associate|lead|administrator|designer|director|researcher|strategist|coordinator|programmer)\b/i;

const clean = (s = '') =>
  s
    .replace(/[*_#]+/g, '')
    .replace(/\s*[|–—-]\s*(remote|hybrid|on-?site|full[- ]time|part[- ]time|contract).*$/i, '')
    .replace(/[.,;:]+$/, '')
    .trim()
    .slice(0, 80);

export function detectRoleAndCompany(jd = '') {
  const text = String(jd);
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let role = '';
  let company = '';

  const labeled = (label) => {
    const m = text.match(new RegExp(`^\\s*(?:${label})\\s*[:\\-–]\\s*(.+)$`, 'im'));
    return m ? clean(m[1]) : '';
  };
  role = labeled('job title|position title|position|title|role');
  company = labeled('company|company name|employer|organization|client');

  if (!role) {
    for (const line of lines.slice(0, 8)) {
      if (line.length <= 90 && line.split(/\s+/).length <= 10 && ROLE_WORDS.test(line) && !/\b(is|are|we|you|as an?)\b/i.test(line) && !/^join\b/i.test(line)) {
        const at = line.split(/\s+(?:at|@)\s+/i);
        role = clean(at[0]);
        if (!company && at[1]) company = clean(at[1]);
        break;
      }
    }
  }
  const NAME = "([A-Z][\\w&.'-]*(?:[ \\t]+[A-Z][\\w&.'-]*){0,3})";
  const trimRole = (r) => clean(r.split(/\s+(?:to|who|that|for|with|in|on|and|where|responsible)\s+/i)[0]);
  if (!company || !role) {
    const hiring = text.match(new RegExp(`${NAME}[ \\t]+(?:is|are)[ \\t]+(?:hiring|looking for|seeking)[ \\t]+(?:an?[ \\t]+)?([^.\\n,]{3,70})`));
    if (hiring) {
      company ||= clean(hiring[1]);
      if (!role && ROLE_WORDS.test(hiring[2])) role = trimRole(hiring[2]);
    }
  }
  if (!company || !role) {
    const join = text.match(new RegExp(`[Jj]oin[ \\t]+(?:the[ \\t]+)?${NAME}[ \\t]+(?:team[ \\t]+)?as[ \\t]+(?:an?[ \\t]+)?([^.\\n,]{3,70})`));
    if (join) {
      company ||= clean(join[1]);
      if (!role && ROLE_WORDS.test(join[2])) role = trimRole(join[2]);
    }
  }
  if (!company) {
    const about = text.match(/^\s*about\s+(?!the\s+(?:role|job|team|position|opportunity)\b|us\b|you\b)([A-Z][\w&.'-]*(?:[ \t]+[A-Z][\w&.'-]*){0,3})[ \t]*:?[ \t]*$/im);
    if (about) company = clean(about[1]);
  }
  if (!company) {
    const atCo = text.match(/\b(?:at|with)[ \t]+([A-Z][\w&.'-]+(?:[ \t]+[A-Z][\w&.'-]+){0,2})(?:,|\.|[ \t]+we\b|[ \t]+is\b)/);
    if (atCo && !/^(The|This|Our|We)$/.test(atCo[1])) company = clean(atCo[1]);
  }
  return { role, company };
}

// ---------------------------------------------------------------------------
// Keyword gap analysis
// ---------------------------------------------------------------------------

function profileHaystack(profile = {}) {
  const skills = (profile.skills || []).map(normalize);
  const prose = [
    profile.resumeText || '',
    ...(profile.experience || []).map((e) => `${e.role} ${e.org} ${e.summary}`),
    ...(profile.metrics || []),
    ...(profile.certifications || []),
  ].join('\n');
  return { skills: new Set(skills), prose };
}

function profileHas(entry, hay) {
  const forms = [entry.term, ...entry.aliases];
  if (forms.some((f) => hay.skills.has(normalize(f)))) return true;
  return forms.some((f) => termRegex(f).test(hay.prose));
}

/**
 * Split JD keywords into three honest buckets:
 *  have      - already supported by the profile
 *  bridge    - not claimed, but an adjacent real skill makes it safe to mention
 *  gap       - genuinely outside the profile; flagged, never written in
 */
export function analyzeKeywords(jd = '', profile = {}) {
  const hay = profileHaystack(profile);
  const have = [];
  const bridge = [];
  const gap = [];

  for (const entry of KEYWORD_LIBRARY) {
    const forms = [entry.term, ...entry.aliases];
    const found = new Set();
    let count = 0;
    for (const f of forms) {
      const matches = String(jd).match(termRegex(f));
      if (matches) {
        count += matches.length;
        matches.forEach((m) => found.add(m));
      }
    }
    if (!count) continue;

    const item = { term: entry.term, group: entry.group, count, matches: [...found] };
    if (profileHas(entry, hay)) {
      have.push(item);
      continue;
    }
    const via = entry.adjacent.filter((a) => {
      const adj = KEYWORD_LIBRARY.find((e) => e.term === a) || { term: a, aliases: [] };
      return profileHas(adj, hay);
    });
    if (via.length) bridge.push({ ...item, via });
    else gap.push(item);
  }

  const byWeight = (a, b) => b.count - a.count || a.term.localeCompare(b.term);
  have.sort(byWeight);
  bridge.sort(byWeight);
  gap.sort(byWeight);

  const total = have.length + bridge.length + gap.length;
  const score = total ? Math.round(((have.length + bridge.length * 0.5) / total) * 100) : 0;
  return { have, bridge, gap, score };
}

export function analyzeJob(jd, profile, maxChars) {
  const compressed = compressJd(jd, maxChars);
  const detected = detectRoleAndCompany(jd);
  const keywords = analyzeKeywords(jd, profile);
  return { ...detected, keywords, compressed };
}
