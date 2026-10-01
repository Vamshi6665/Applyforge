// Deterministic drafts built from the profile and the JD analysis.
// Used by the offline demo model so the whole app (and the test suite) works
// with no API key at all. Real models replace this with tailored writing.

const joinList = (arr) => {
  const a = arr.filter(Boolean);
  if (a.length <= 1) return a[0] || '';
  return `${a.slice(0, -1).join(', ')}, and ${a[a.length - 1]}`;
};

export function buildTemplateDrafts({ profile: p, analysis, tone = 'metrics' }) {
  const role = analysis.role || 'open';
  const company = analysis.company || 'your company';
  const first = p.firstName || p.name.split(' ')[0];
  const have = analysis.keywords.have.map((k) => k.term);
  const bridge = analysis.keywords.bridge;
  const stack = joinList((have.length ? have : p.skills).slice(0, 6));
  const areas = joinList((have.length ? have : p.skills).slice(0, 4));
  const metric = p.metrics?.[0] ? p.metrics[0].charAt(0).toLowerCase() + p.metrics[0].slice(1) : '';
  const metric2 = p.metrics?.[1] ? p.metrics[1].charAt(0).toLowerCase() + p.metrics[1].slice(1) : '';
  const certs = p.certsShort || (p.certifications || []).join(', ');
  const bridgeLine = bridge.length
    ? ` My work with ${bridge[0].via[0]} also maps closely to your use of ${bridge[0].term}.`
    : '';
  const metricsLine = tone === 'metrics' && metric ? ` In past roles I ${metric} and ${metric2}.` : '';

  const email = `Hi [Recruiter name],
My name is ${p.name}, and I am a ${p.headline} with ${p.years} years of experience working with ${stack}. I recently completed my ${p.education.split(',')[0]} and hold ${certs}.
I am writing to express my interest in the ${role} opportunity at ${company}. The role strongly aligns with my experience in ${areas}.${metricsLine}${bridgeLine}
I have attached my resume for your review. I would appreciate the opportunity to discuss how my technical background and ability to own data systems end to end could contribute to your team at ${company}.
Thank you for your time and consideration. I look forward to hearing from you.
Best regards,
${first}`;

  const linkedin = `Hi [Name], I'm ${first}, a ${p.headline} with ${p.years} years of experience. I recently completed my ${p.educationShort || 'MS'} and hold ${certs}. I'm interested in the ${role} role at ${company} and would be glad to connect.`;

  // Demo bullets reuse the profile's own wording only, so nothing is invented.
  const resume = (p.experience || [])
    .slice(0, 4)
    .map((e) => {
      const [lead, ...rest] = e.summary.split(/[.;]\s*/).filter(Boolean);
      const tail = rest.length ? `${rest.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('. ')}.` : `Worked as ${e.role} at ${e.org}.`;
      return `- ${lead.trim()}. ${tail}`;
    })
    .join('\n');

  const coverLetter = `Dear Hiring Manager,

I am applying for the ${role} position at ${company}. I am a ${p.headline} with ${p.years} years of experience, and I recently completed my ${p.education}.

Most of my work has been building and running data systems people rely on every day, with ${stack}.${tone === 'metrics' && metric ? ` That includes work where I ${metric}.` : ''}${bridgeLine}

I would welcome the chance to talk about how I can help ${company}. Thank you for your time.

Sincerely,
${p.name}`;

  const followUp = `Hi [Recruiter name],
I wanted to follow up on my application for the ${role} role at ${company}. I am still very interested, and since applying I have been thinking about how my experience with ${have[0] || p.skills[0]} could help your team get value from its data quickly.
Happy to share more detail or work samples if useful. Thank you again for your time.
Best regards,
${first}`;

  return { email, linkedin, resume, coverLetter, followUp };
}

const EDIT_INTENT = /\b(shorter|shorten|concise|trim|cut|longer|expand|metric|numbers|formal|casual|friendl|rewrite|redo|rephrase|change|fix|add|remove|make|replace|update|improve|tweak|warmer|confident)\b/i;

/** Offline demo chat reply. Applies a few simple edits so the flow is testable. */
export function templateChatReply({ docType, draft = '', message = '', analysis, profile }) {
  const msg = String(message);
  if (!EDIT_INTENT.test(msg)) {
    const have = analysis?.keywords?.have?.slice(0, 3).map((k) => k.term) || [];
    const gap = analysis?.keywords?.gap?.slice(0, 2).map((k) => k.term) || [];
    return `Offline demo answer. For this role, lead with ${have.length ? have.join(', ') : 'your strongest tools'}${
      profile?.metrics?.[0] ? ` and a number like "${profile.metrics[0]}"` : ''
    }.${gap.length ? ` Be ready to say honestly how you would ramp up on ${gap.join(' and ')}.` : ''} Connect a real model in Settings for full answers.`;
  }

  let revised = draft;
  let note = 'Offline demo edit applied.';
  if (/\b(shorter|shorten|concise|trim|cut)\b/i.test(msg)) {
    revised = draft
      .split('\n')
      .map((line) => {
        const sentences = line.match(/[^.!?]+[.!?]+/g);
        return sentences && sentences.length > 2 ? sentences.slice(0, 2).join('').trim() : line;
      })
      .join('\n');
    note = 'Trimmed each paragraph to its two strongest sentences.';
  } else if (/\b(metric|numbers)\b/i.test(msg) && profile?.metrics?.length) {
    const m = profile.metrics[0];
    revised = draft.includes(m) ? draft : draft.replace(/\n/, `\n${m}. `);
    note = 'Moved a real metric to the top.';
  } else if (/\bformal\b/i.test(msg)) {
    revised = draft.replace(/^Hi\b/m, 'Dear').replace(/\bI'm\b/g, 'I am');
    note = 'Made the greeting and wording more formal.';
  }
  if (docType === 'linkedin' && revised.length > 300) revised = `${revised.slice(0, 296).trim()}...`;
  return `${note}\n<draft>\n${revised}\n</draft>`;
}
