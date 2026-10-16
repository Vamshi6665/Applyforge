// Deterministic quality checks from SPEC §3.3–3.6 and §5. Pure functions, no I/O.
import { extract } from "./terms.js";

export const BANNED_OPENERS = [
  "used", "use", "uses", "wrote", "write", "writes", "worked", "work", "works", "helped", "help", "helps",
  "assisted", "assist", "assists", "responsible", "participated", "participate", "was", "were", "handled",
  "handle", "did", "made", "make", "tasked", "involved", "utilized", "utilize", "tried", "learned",
];

export const NON_TECH_SKILLS = [
  "communication", "stakeholder", "problem solving", "problem-solving", "teamwork", "collaboration",
  "leadership", "attention to detail", "critical thinking", "time management", "data-driven",
  "storytelling", "presentation", "ownership", "analytical thinking", "business acumen", "reporting",
  "data pipelines", "decision making", "decision-making", "documentation", "mentoring", "adaptability",
];

const BUDGET = { lama: [2, 5], nwmsu: [2, 5], dxc: [4, 7] };

const trigrams = (t) => {
  const w = t.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  const g = new Set();
  for (let i = 0; i + 2 < w.length; i++) g.add(w.slice(i, i + 3).join(" "));
  return g;
};
const overlap = (a, b) => {
  if (!a.size || !b.size) return 0;
  let n = 0;
  a.forEach((x) => b.has(x) && n++);
  return n / a.size; // share of the bullet that appears verbatim in one source sentence
};

function sourceSentences(profile) {
  const out = [];
  profile.experience.forEach((e) => { out.push(...(e.facts || []), ...Object.values(e.lenses || {})); });
  profile.projects.forEach((p) => out.push(...(p.facts || [])));
  return out.flatMap((t) => t.split(/(?<=[.;:])\s+/)).filter((t) => t.split(" ").length > 6).map(trigrams);
}

const words = (s) => (s || "").trim().split(/\s+/).filter(Boolean);
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9.+#]/g, "");

function allowedNumbers(profile) {
  const set = new Set();
  const add = (txt) =>
    (String(txt).match(/\d+(?:\.\d+)?/g) || []).forEach((n) => set.add(n.replace(/\.0+$/, "")));
  profile.metricsBank.forEach((m) => add(m.value));
  add(JSON.stringify(profile.projects));
  add(JSON.stringify(profile.experience));
  add(JSON.stringify(profile.skillInventory));
  add(JSON.stringify(profile.certifications));
  return set;
}

// number (with + or % suffix when present) -> roles that own it in the metrics bank
function numberOwners(profile) {
  const own = {};
  profile.metricsBank.forEach((m) => {
    const mm = String(m.value).match(/(\d+(?:\.\d+)?)(\+|%)?/);
    if (!mm) return;
    const key = mm[1].replace(/\.0+$/, "") + (mm[2] || "");
    (own[key] ||= new Set()).add(m.role || "general");
  });
  return own;
}

function numbersWithSuffix(text) {
  const out = [];
  const re = /(^|[^A-Za-z0-9\-])(\d+(?:[.,]\d+)?)(\+|%)?(?![A-Za-z0-9])/g;
  let m;
  while ((m = re.exec(text))) out.push(m[2].replace(/,/g, "").replace(/\.0+$/, "") + (m[3] || ""));
  return out;
}

function projectRole(profile, name) {
  const n = norm(name);
  const p = profile.projects.find((x) => n.includes(norm(x.name).slice(0, 10)) || norm(x.name).includes(n.slice(0, 10)));
  return p?.role || "personal";
}

function inventorySet(profile) {
  const s = new Set();
  Object.values(profile.skillInventory).flat().forEach((x) => s.add(norm(x)));
  return s;
}

function numbersIn(text) {
  // standalone numbers only: skip ones glued to letters (S3, GPT-4o, 70B, Gen2, PL-300)
  const out = [];
  const re = /(^|[^A-Za-z0-9\-])(\d+(?:[.,]\d+)?)(?![A-Za-z0-9])/g;
  let m;
  while ((m = re.exec(text))) out.push(m[2].replace(/,/g, "").replace(/\.0+$/, ""));
  return out;
}

export function autofix(resume) {
  const clean = (s) =>
    String(s)
      .replace(/\*\*/g, "")
      .replace(/\s*(—|--)\s*/g, ", ")
      .replace(/\s+,/g, ",")
      .replace(/\s{2,}/g, " ")
      .trim();
  const r = structuredClone(resume);
  r.summary = clean(r.summary);
  r.experience.forEach((e) => e.bullets.forEach((b) => { b.label = clean(b.label).replace(/:$/, ""); b.text = clean(b.text); }));
  r.projects.forEach((p) => p.bullets.forEach((b) => { b.label = clean(b.label).replace(/:$/, ""); b.text = clean(b.text); }));
  return r;
}

export function lintResume(resume, profile, { stretch = false, approvedStretch = [], analysis = null } = {}) {
  const issues = [];
  const push = (severity, where, message) => issues.push({ severity, where, message });
  const allowNums = allowedNumbers(profile);
  const inv = inventorySet(profile);
  const sources = sourceSentences(profile);
  const alloc = {};
  (analysis?.strategy?.bullet_allocation || []).forEach((a) => (alloc[a.role_id] = a.bullets));
  approvedStretch.forEach((x) => inv.add(norm(x)));

  const owners = numberOwners(profile);
  const bankRoles = new Set(profile.metricsBank.map((m) => m.role));
  const verbCount = {};
  let bulletTotal = 0;
  let withMetric = 0;

  const checkBullet = (b, where, labelsSeen, role) => {
    bulletTotal++;
    const w = words(b.text);
    const first = (w[0] || "").toLowerCase().replace(/[^a-z]/g, "");
    if (!b.label || words(b.label).length > 5) push("error", where, "Missing or overlong lead-in label (2 to 4 words).");
    if (labelsSeen.has(norm(b.label || ""))) push("warn", where, `Duplicate label "${b.label}" in this section.`);
    labelsSeen.add(norm(b.label || ""));
    if (BANNED_OPENERS.includes(first)) push("error", where, `Weak opener "${w[0]}". Start with a strong, specific verb.`);
    if (first) verbCount[first] = (verbCount[first] || 0) + 1;
    if (w.length < 16) push("warn", where, `Too thin (${w.length} words). Add mechanism or outcome.`);
    if (w.length > 36) push("warn", where, `Too long (${w.length} words). Must fit two lines.`);
    if (/\b(I|my|me|we|our)\b/.test(b.text)) push("error", where, "First-person pronoun.");
    if (/(—|--)/.test(b.text)) push("warn", where, "Em dash or double hyphen.");
    if (/\b(various|etc\.?|synergy|cutting-edge|passionate|responsible for)\b/i.test(b.text)) push("warn", where, "Filler wording.");
    const nums = numbersIn(b.text);
    if (nums.length) withMetric++;
    nums.forEach((n) => { if (!allowNums.has(n)) push("error", where, `Number "${n}" is not in the metrics bank. Remove it or add it to the bank.`); });
    numbersWithSuffix(b.text).forEach((key) => {
      const o = owners[key] || owners[key.replace(/[+%]$/, "")];
      if (o && !o.has("general") && !o.has(role))
        push("error", where, `"${key}" is a ${[...o].join("/")} metric; it cannot be claimed here.`);
    });
    const tg = trigrams(b.text);
    if (sources.some((src) => overlap(tg, src) >= 0.5)) push("warn", where, "Reads like a copy of the base profile. Rewrite it for this JD.");
  };

  resume.experience.forEach((e) => {
    const labels = new Set();
    const [lo, hi] = BUDGET[e.role_id] || [2, 7];
    if (alloc[e.role_id] && e.bullets.length !== alloc[e.role_id]) push("warn", e.company, `Has ${e.bullets.length} bullets; the role analysis allocated ${alloc[e.role_id]}.`);
    else if (e.bullets.length < lo || e.bullets.length > hi) push("warn", e.company, `Has ${e.bullets.length} bullets; allowed ${lo} to ${hi}.`);
    const steps = e.bullets.map((b) => (b.arc_step || "").toLowerCase()).filter(Boolean);
    const dup = steps.find((x, i) => steps.indexOf(x) !== i);
    if (dup) push("warn", e.company, `Two bullets cover the same stage ("${dup}"). Each bullet should cover a distinct stage.`);
    e.bullets.forEach((b, i) => checkBullet(b, `${e.company} #${i + 1}`, labels, e.role_id));
    if (e.bullets.length >= 3 && bankRoles.has(e.role_id) && !e.bullets.some((b) => numbersIn(b.text).length))
      push("warn", e.company, "No metric in this role although the metrics bank has numbers for it.");
    if (/at&t|vfs/i.test(JSON.stringify(e))) push("error", e.company, "Client name present. DXC is written without clients.");
  });
  resume.projects.forEach((p) => {
    const labels = new Set();
    const role = projectRole(profile, p.name);
    const pid = profile.projects.find((x) => x.role === role && norm(p.name).includes(norm(x.name).slice(0, 10)))?.id;
    if (p.bullets.length < 2 || p.bullets.length > 3) push("warn", p.name, `Has ${p.bullets.length} bullets; projects take 2 or 3.`);
    else if (pid && alloc[pid] && alloc[pid] !== p.bullets.length) push("warn", p.name, `Has ${p.bullets.length} bullets; the role analysis allocated ${alloc[pid]}.`);
    p.bullets.forEach((b, i) => checkBullet(b, `${p.name} #${i + 1}`, labels, role));
  });

  Object.entries(verbCount).forEach(([v, c]) => { if (c > 2) push("warn", "Verbs", `"${v}" opens ${c} bullets; max 2.`); });
  if (bulletTotal && withMetric / bulletTotal < 0.4) push("warn", "Metrics", `Only ${withMetric} of ${bulletTotal} bullets carry a number; target 40%.`);

  const tm = analysis?.term_map;
  if (tm) {
    const text = [resume.summary, ...resume.experience.flatMap((e) => e.bullets.map((b) => b.text)), ...resume.projects.flatMap((p) => [...p.tech, ...p.bullets.map((b) => b.text)]), ...resume.skills.flatMap((c) => c.items)].join(" \n ");
    const used = new Set(extract(text).map((t) => t.name));
    tm.gaps.filter((g) => used.has(g)).forEach((g) => push("error", "Honesty", `"${g}" is a gap in your profile but appears on the resume.`));
    if (!stretch) tm.bridgeable.filter((g) => used.has(g)).forEach((g) => push("warn", "Honesty", `"${g}" is only bridgeable (strict mode). Name your real equivalent or turn on stretch mode.`));
    const core = new Set(extract([...(analysis.primary_stack || []).map((x) => x.item), ...(analysis.must_haves || [])].join(" \n ")).map((t) => t.name));
    if (tm.unbacked?.length) {
      const bulletText = [...resume.experience.flatMap((e) => e.bullets), ...resume.projects.flatMap((p) => p.bullets)].map((b) => b.text).join(" \n ");
      const inBullets = new Set(extract(bulletText).map((t) => t.name));
      tm.unbacked.filter((u) => inBullets.has(u)).forEach((u) => push("error", "Evidence", `"${u}" appears in a bullet, but no work in your profile shows it. Keep it in Skills or add the real work to your profile.`));
    }
    if (tm.context?.length) {
      const skillText = new Set(extract(resume.skills.flatMap((c) => c.items).join(" \n ")).map((t) => t.name));
      tm.context.filter((c) => skillText.has(c)).forEach((c) => push("error", "Honesty", `"${c}" appears in your history but is not a skill you claim; keep it out of Technical Skills.`));
    }
    tm.matched.filter((m) => core.has(m) && !used.has(m)).forEach((m) => push("warn", "Coverage", `JD core tool "${m}" is in your profile but missing from the resume.`));
  }

  const sw = words(resume.summary).length;
  if (sw < 45 || sw > 80) push("warn", "Summary", `Summary is ${sw} words; target 55 to 70.`);
  numbersIn(resume.summary).forEach((n) => { if (!allowNums.has(n)) push("error", "Summary", `Number "${n}" not in the metrics bank.`); });

  resume.skills.forEach((cat) => {
    cat.items.forEach((item) => {
      const low = item.toLowerCase();
      if (NON_TECH_SKILLS.some((t) => low.includes(t))) push("error", `Skills / ${cat.category}`, `"${item}" is not a technical skill.`);
      else if (!stretch && !inv.has(norm(item))) push("warn", `Skills / ${cat.category}`, `"${item}" is not in the skill inventory (strict mode).`);
    });
  });

  return issues;
}

export function enforceLinkedIn(text, max = 300) {
  const t = text.replace(/\s+/g, " ").replace(/(—|--)/g, ",").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const lastStop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "));
  return lastStop > 150 ? cut.slice(0, lastStop + 1) : cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;]$/, "") + ".";
}
