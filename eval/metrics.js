// Model-free scoring of one generated application, plus cross-JD variation.
import { lintResume } from "../api/_lib/lint.js";
import { extract, correlate, unbacked } from "../api/_lib/terms.js";

const trigrams = (t) => {
  const w = t.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  const g = new Set();
  for (let i = 0; i + 2 < w.length; i++) g.add(w.slice(i, i + 3).join(" "));
  return g;
};
const jaccard = (a, b) => {
  if (!a.size && !b.size) return 1;
  let n = 0;
  a.forEach((x) => b.has(x) && n++);
  return n / (a.size + b.size - n);
};

export const resumeText = (r) =>
  [r.summary, ...r.experience.flatMap((e) => e.bullets.map((b) => b.text)), ...r.projects.flatMap((p) => [...p.tech, ...p.bullets.map((b) => b.text)]), ...r.skills.flatMap((c) => c.items)].join("\n");

export function scoreOne(jd, result, profile) {
  const { analysis, resume, outreach } = result;
  const tm = analysis.term_map || { ...correlate(jd.text, profile), unbacked: unbacked(profile) };
  const a = { ...analysis, term_map: tm };
  const issues = lintResume(resume, profile, { analysis: a });
  const used = new Set(extract(resumeText(resume)).map((t) => t.name));
  const bullets = [...resume.experience.flatMap((e) => e.bullets), ...resume.projects.flatMap((p) => p.bullets)];
  const withNum = bullets.filter((b) => /(^|[^A-Za-z0-9-])\d/.test(b.text)).length;
  const firstWords = bullets.map((b) => b.text.split(/\s+/)[0].toLowerCase());
  const alloc = Object.fromEntries((analysis.strategy?.bullet_allocation || []).map((x) => [x.role_id, x.bullets]));
  const rolesArcOk = resume.experience.filter((e) => {
    const s = e.bullets.map((b) => (b.arc_step || "").toLowerCase()).filter(Boolean);
    return s.length && new Set(s).size === s.length;
  }).length;

  const email = outreach?.emails?.[0]?.body || "";
  const paras = email.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const words = resumeText(resume).split(/\s+/).length;

  return {
    id: jd.id,
    family: jd.family,
    archetype: analysis.archetype,
    archetype_ok: jd.expected.includes(analysis.archetype),
    reach: tm.reach,
    jd_recall: tm.matched.length ? tm.matched.filter((m) => used.has(m)).length / tm.matched.length : 1,
    unsupported: tm.gaps.filter((g) => used.has(g)),
    bridged: tm.bridgeable.filter((g) => used.has(g)),
    lint_errors: issues.filter((i) => i.severity === "error").length,
    lint_warns: issues.filter((i) => i.severity === "warn").length,
    copy_flags: issues.filter((i) => /copy of the base/.test(i.message)).length,
    metric_density: bullets.length ? withNum / bullets.length : 0,
    verb_diversity: bullets.length ? new Set(firstWords).size / bullets.length : 0,
    arc_distinct: resume.experience.length ? rolesArcOk / resume.experience.length : 0,
    allocation_ok: resume.experience.every((e) => !alloc[e.role_id] || alloc[e.role_id] === e.bullets.length),
    bullets: bullets.length,
    resume_words: words,
    email_ok: /^Hi .+,\s*\nGreetings of the day\./.test(email) && paras.length >= 4,
    linkedin_ok: (outreach?.linkedin || []).every((n) => n.text.length <= 300),
    titles: resume.experience.map((e) => `${e.role_id}:${e.title}`),
    issues,
  };
}

// How much each role's text changes between JDs. Low similarity across families = the resume really restructures.
export function variation(results) {
  const roleIds = ["lama", "nwmsu", "dxc"];
  const grams = results.map((r) => ({
    id: r.id, family: r.family,
    all: trigrams(resumeText(r.resume)),
    role: Object.fromEntries(roleIds.map((id) => [id, trigrams((r.resume.experience.find((e) => e.role_id === id)?.bullets || []).map((b) => b.text).join(" "))])),
  }));
  const pairs = { same: [], cross: [] };
  const rolePairs = Object.fromEntries(roleIds.map((id) => [id, { same: [], cross: [] }]));
  for (let i = 0; i < grams.length; i++)
    for (let j = i + 1; j < grams.length; j++) {
      const k = grams[i].family === grams[j].family ? "same" : "cross";
      pairs[k].push(jaccard(grams[i].all, grams[j].all));
      roleIds.forEach((id) => rolePairs[id][k].push(jaccard(grams[i].role[id], grams[j].role[id])));
    }
  const avg = (x) => (x.length ? x.reduce((s, v) => s + v, 0) / x.length : null);
  return {
    whole: { same_family: avg(pairs.same), cross_family: avg(pairs.cross) },
    by_role: Object.fromEntries(roleIds.map((id) => [id, { same_family: avg(rolePairs[id].same), cross_family: avg(rolePairs[id].cross) }])),
  };
}
