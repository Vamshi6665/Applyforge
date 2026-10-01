// Prompt builders. Prompts are assembled from only the pieces a request needs,
// which keeps input tokens low: a LinkedIn-only request never carries the cover
// letter rules, and chat never resends the full job description.

export const SECTIONS = ['email', 'linkedin', 'resume', 'coverLetter', 'followUp'];
export const TONES = ['metrics', 'concise'];

export const SECTION_LABELS = {
  email: 'Recruiter email',
  linkedin: 'LinkedIn note',
  resume: 'Resume bullets',
  coverLetter: 'Cover letter',
  followUp: 'Follow-up email',
};

const HUMANIZE = `WRITING RULES (strict):
- Write like the candidate typed it: plain words, natural rhythm, no AI tells.
- Plain text only. No markdown, no ** bold, no headings.
- Never use em dashes, en dashes or double hyphens. Use commas or periods.
- No filler such as "thrilled", "leverage", "synergy", "fast-paced", "passionate about".
- NO FABRICATION. Only claim skills, tools, domains, metrics and certifications in the PROFILE. For BRIDGE keywords, connect honestly through the listed adjacent skill. Never mention GAP keywords as experience.`;

export function profileBlock(p, { includeGold = true } = {}) {
  const lines = [
    `PROFILE`,
    `Name: ${p.name} (sign as ${p.firstName || p.name.split(' ')[0]})`,
    `Headline: ${p.headline}, ${p.years} years of experience, ${p.location}`,
    `Education: ${p.education}`,
    `Certifications: ${(p.certifications || []).join(', ')}`,
    `Skills: ${(p.skills || []).join(', ')}`,
  ];
  if (p.metrics?.length) lines.push(`Real metrics (use only these numbers): ${p.metrics.join('; ')}`);
  if (p.experience?.length) {
    lines.push('Experience:');
    for (const e of p.experience) lines.push(`- ${e.role}, ${e.org} (${e.dates}): ${e.summary}`);
  }
  if (p.resumeText?.trim()) lines.push(`Resume text (facts only):\n${p.resumeText.trim().slice(0, 4000)}`);
  if (includeGold && p.goldEmail?.trim()) lines.push(`\nGOLD EMAIL (mirror this voice and structure):\n${p.goldEmail.trim()}`);
  if (includeGold && p.goldLinkedin?.trim()) lines.push(`\nGOLD LINKEDIN NOTE (mirror this voice):\n${p.goldLinkedin.trim()}`);
  return lines.join('\n');
}

const SECTION_RULES = {
  email: (p) => `email: Follow the GOLD EMAIL's three-paragraph shape exactly.
 P1: "My name is ${p.name}, and I am a ${p.headline} with ${p.years} years of experience working with [stack relevant to this JD]." then education and certifications.
 P2: "I am writing to express my interest in the [exact role] opportunity at [company]. The role strongly aligns with my experience in [real areas mapped to the JD]." plus one genuine, specific hook from the JD.
 P3: "I have attached my resume for your review. I would appreciate the opportunity to discuss how my [background] could contribute to your team at [company]."
 Close: "Thank you for your time and consideration. I look forward to hearing from you." then "Best regards," and the first name. Start with "Hi [Recruiter name]," on its own line.`,
  linkedin: () => `linkedin: One connection note, at most 280 characters, mirroring the GOLD LINKEDIN NOTE order: greeting with [Name], who I am, MS and certs, interest in the role at the company, ask to connect.`,
  resume: () => `resume: 4 bullets, each line starting "- ". Each bullet is two sentences: action with tools, then outcome with a real metric from the PROFILE. Align to HAVE and BRIDGE keywords.`,
  coverLetter: (p) => `coverLetter: Three short paragraphs plus "Sincerely," and ${p.name}. Role specific and honest, not a restatement of the resume.`,
  followUp: (p) => `followUp: A short follow-up email for 5 to 7 days after no reply. Start "Hi [Recruiter name],", reference the role, add one new value point, polite and not needy, sign with the first name.`,
};

const TONE_RULES = {
  metrics: 'TONE: metrics-forward. Put real numbers from the PROFILE up front where they fit.',
  concise: 'TONE: concise and direct. Fewer words, shorter sentences, at most one metric per paragraph.',
};

export function keywordBlock(analysis) {
  const k = analysis.keywords;
  const list = (arr, f = (x) => x.term) => (arr.length ? arr.slice(0, 18).map(f).join(', ') : 'none');
  return `JOB
Role: ${analysis.role || 'infer from JD'}
Company: ${analysis.company || 'infer from JD'}
HAVE keywords (weave in naturally): ${list(k.have)}
BRIDGE keywords (mention only through the adjacent skill): ${list(k.bridge, (x) => `${x.term} via ${x.via.join('/')}`)}
GAP keywords (do not claim): ${list(k.gap)}`;
}

export function buildGenerateMessages({ profile, analysis, sections, tone }) {
  const rules = sections.map((s) => SECTION_RULES[s](profile)).join('\n\n');
  const shape = `{${sections.map((s) => `"${s}": "<text>"`).join(', ')}}`;
  const system = `You write job application materials for one candidate.

${profileBlock(profile, { includeGold: sections.includes('email') || sections.includes('linkedin') || sections.includes('followUp') })}

${HUMANIZE}

OUTPUT RULES
${rules}

${TONE_RULES[tone]}

Respond with ONLY a JSON object of this exact shape, no prose, no code fences:
${shape}`;

  const user = `${keywordBlock(analysis)}

JOB DESCRIPTION:
${analysis.compressed.text}`;

  return { system, messages: [{ role: 'user', content: user }] };
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

const DRAFT_RE = /<draft>[\s\S]*?(<\/draft>|$)/g;

/** Collapse old drafts in history: the current draft is already in the system prompt. */
export function compactHistory(history = [], maxTurns = 6) {
  return history
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-maxTurns * 2)
    .map((m) => ({
      role: m.role,
      content: m.role === 'assistant' ? m.content.replace(DRAFT_RE, '[revised draft shown to user]').slice(0, 1500) : m.content.slice(0, 2000),
    }));
}

export function buildChatMessages({ profile, analysis, docType, draft, history, message, maxTurns, jdExcerpt }) {
  const label = SECTION_LABELS[docType] || 'draft';
  const includeGold = docType === 'email' || docType === 'linkedin' || docType === 'followUp';
  const system = `You are ApplyForge, a sharp, friendly job application coach chatting with the candidate. Be brief and concrete.

${profileBlock(profile, { includeGold })}

${analysis ? keywordBlock(analysis) : ''}
${jdExcerpt ? `\nJD EXCERPT:\n${jdExcerpt}` : ''}

${HUMANIZE}

CURRENT ${label.toUpperCase()}:
${draft?.trim() ? draft.trim() : '(empty)'}

HOW TO REPLY
- If the user asks to change, rewrite, shorten, add or fix the ${label.toLowerCase()}, reply with ONE short sentence saying what you changed, then the complete revised ${label.toLowerCase()} between <draft> and </draft>. Nothing after </draft>.
- If the user tells you how they genuinely relate to a GAP keyword, you may add it, worded exactly as honestly as they described.
- If the user asks a question (interview prep, what to emphasize, salary talk, etc.), answer in under 150 words without a <draft> block.
${docType === 'linkedin' ? '- The LinkedIn note must stay at or under 300 characters.\n' : ''}`;

  return {
    system,
    messages: [...compactHistory(history, maxTurns), { role: 'user', content: String(message).slice(0, 4000) }],
  };
}

/** Pull the revised draft (if any) out of a chat reply. */
export function extractDraft(reply = '') {
  const m = String(reply).match(/<draft>([\s\S]*?)(<\/draft>|$)/);
  if (!m) return { note: String(reply).trim(), draft: null };
  const note = String(reply).slice(0, m.index).trim();
  return { note, draft: m[1].trim() };
}
