// ApplyForge evaluation harness.
//
//   npm run eval                      full pipeline + recruiter judge on all 20 JDs (needs OPENAI_API_KEY)
//   npm run eval -- --only da3,ds3    subset
//   npm run eval -- --no-judge        skip the LLM judge (metrics only)
//   npm run eval -- --stretch         generate in stretch mode
//   npm run eval -- --fixtures eval/reference   score saved outputs without calling the API
//
// Output: eval/out/report.md, eval/out/summary.json, eval/out/results/<id>.json

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { JDS } from "./jds.js";
import { scoreOne, variation } from "./metrics.js";
import { JUDGE_SYSTEM, judgeSchema, judgeInput } from "./judge.js";
import { DEFAULT_PROFILE } from "../api/_lib/profile.js";
import { structured } from "../api/_lib/llm.js";
import analyze from "../api/analyze.js";
import resumeH from "../api/resume.js";
import review from "../api/review.js";
import outreachH from "../api/outreach.js";

// ── args and env ──
const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n, d) => (args.includes(`--${n}`) ? args[args.indexOf(`--${n}`) + 1] : d);
if (existsSync(".env")) for (const line of readFileSync(".env", "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const only = opt("only", "") ? opt("only").split(",") : null;
const fixtures = opt("fixtures", null);
const stretch = flag("stretch");
const concurrency = Number(opt("concurrency", 3));
const model = opt("model", process.env.OPENAI_MODEL || "gpt-4o");
process.env.OPENAI_API_KEY ||= process.env.OPENAI_KEY || process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_SECRET_KEY || "";
const useJudge = !flag("no-judge") && !!process.env.OPENAI_API_KEY;
if (!fixtures && !process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY is not set. Add it to .env, or use --fixtures <dir> to score saved outputs.");
  process.exit(1);
}

const OUT = new URL("./out/", import.meta.url);
mkdirSync(new URL("./results/", OUT), { recursive: true });
const req = { method: "POST", headers: { "x-openai-model": model } };

async function invoke(handler, body) {
  let status = 200, data;
  const res = { status(c) { status = c; return res; }, json(d) { data = d; return res; } };
  await handler({ ...req, body }, res);
  if (status !== 200) throw new Error(data?.error || `HTTP ${status}`);
  return data;
}

const plain = (r, p) => {
  const L = [p.name.toUpperCase(), r.summary, "", "PROFESSIONAL EXPERIENCE"];
  r.experience.forEach((e) => { L.push(`${e.company} | ${e.title} | ${e.dates}`); e.bullets.forEach((b) => L.push(`• ${b.label}: ${b.text}`)); });
  (r.projects || []).forEach((x) => { L.push(`${x.name} | ${x.tech.join(", ")}`); x.bullets.forEach((b) => L.push(`• ${b.label}: ${b.text}`)); });
  L.push("", "TECHNICAL SKILLS", ...r.skills.map((s) => `${s.category}: ${s.items.join(", ")}`), "", "CERTIFICATIONS", r.certifications.join(" | "));
  return L.join("\n");
};

async function runOne(jd) {
  const t0 = Date.now();
  let result;
  if (fixtures) {
    const f = new URL(`../${fixtures.replace(/^\.?\/?/, "")}/${jd.id}.json`, import.meta.url);
    if (!existsSync(f)) return null;
    result = JSON.parse(readFileSync(f, "utf8"));
  } else {
    const base = { jd: jd.text, profile: DEFAULT_PROFILE, stretch };
    const { analysis } = await invoke(analyze, base);
    const draft = await invoke(resumeH, { ...base, analysis });
    const rev = await invoke(review, { ...base, analysis, resume: draft.resume });
    const outreach = await invoke(outreachH, { ...base, analysis, resume: rev.resume, recipient: "", company: jd.company });
    result = { analysis, draft: draft.resume, resume: rev.resume, outreach };
  }
  if (useJudge && !result.judge) {
    result.judge = await structured(req, { system: JUDGE_SYSTEM, schema: judgeSchema, temperature: 0, user: judgeInput(jd, result, DEFAULT_PROFILE, plain(result.resume, DEFAULT_PROFILE)) });
    result.judge_source = model;
  }
  result.metrics = scoreOne(jd, result, DEFAULT_PROFILE);
  result.seconds = Math.round((Date.now() - t0) / 1000);
  writeFileSync(new URL(`./results/${jd.id}.json`, OUT), JSON.stringify(result, null, 2));
  console.log(`✓ ${jd.id} ${result.analysis.archetype}${result.judge ? ` judge ${avgScore(result.judge).toFixed(1)} ${result.judge.decision}` : ""} (${result.seconds}s)`);
  return { jd, ...result };
}

const avgScore = (j) => Object.values(j.scores).reduce((s, v) => s + v, 0) / Object.values(j.scores).length;

// ── run with limited concurrency ──
const todo = JDS.filter((j) => !only || only.includes(j.id));
const done = [];
const failures = [];
await Promise.all(Array.from({ length: Math.min(concurrency, todo.length) }, async () => {
  while (todo.length) {
    const jd = todo.shift();
    try { const r = await runOne(jd); if (r) done.push(r); }
    catch (e) { failures.push({ id: jd.id, error: e.message }); console.error(`✗ ${jd.id}: ${e.message}`); }
  }
}));
done.sort((a, b) => JDS.indexOf(a.jd) - JDS.indexOf(b.jd));
if (!done.length) { console.error("No results."); process.exit(1); }

// ── report ──
const pct = (x) => (x == null ? "n/a" : `${Math.round(x * 100)}%`);
const mean = (xs) => (xs.length ? xs.reduce((s, v) => s + v, 0) / xs.length : null);
const M = done.map((r) => r.metrics);
const judged = done.filter((r) => r.judge);
const v = variation(done.map((r) => ({ id: r.jd.id, family: r.jd.family, resume: r.resume })));

const summary = {
  n: done.length, failures,
  archetype_accuracy: mean(M.map((m) => +m.archetype_ok)),
  judge_avg: judged.length ? mean(judged.map((r) => avgScore(r.judge))) : null,
  advance_rate: judged.length ? mean(judged.map((r) => +(r.judge.decision === "advance"))) : null,
  jd_recall: mean(M.map((m) => m.jd_recall)),
  unsupported_claims: M.reduce((s, m) => s + m.unsupported.length, 0),
  lint_errors: M.reduce((s, m) => s + m.lint_errors, 0),
  metric_density: mean(M.map((m) => m.metric_density)),
  verb_diversity: mean(M.map((m) => m.verb_diversity)),
  arc_distinct: mean(M.map((m) => m.arc_distinct)),
  allocation_ok: mean(M.map((m) => +m.allocation_ok)),
  requirement_coverage: mean(M.map((m) => m.requirement_coverage).filter((x) => x != null)),
  lifecycle_ok: mean(M.map((m) => +m.lifecycle_ok)),
  role_evidence_flags: M.reduce((s, m) => s + m.role_evidence_flags, 0),
  lama_min4: mean(M.map((m) => +(m.lama_bullets >= 4))),
  email_ok: mean(M.map((m) => +m.email_ok)),
  linkedin_ok: mean(M.map((m) => +m.linkedin_ok)),
  variation: v,
};

const L = [];
L.push(`# ApplyForge Evaluation Report`, "", `Model: ${fixtures ? `fixtures (${fixtures})` : model} · Mode: ${stretch ? "stretch" : "strict"} · JDs: ${done.length}${failures.length ? ` · Failed: ${failures.map((f) => f.id).join(", ")}` : ""}`, "");
L.push("## Scorecard", "", "| Measure | Result | Target |", "|---|---|---|");
L.push(`| Role type read correctly | ${pct(summary.archetype_accuracy)} | 100% |`);
L.push(`| Recruiter judge average (1 to 5) | ${summary.judge_avg?.toFixed(2) ?? "not judged"} | 4.0+ |`);
L.push(`| Recruiter would advance | ${pct(summary.advance_rate)} | 70%+ on reachable JDs |`);
L.push(`| JD tools you have that made it onto the resume | ${pct(summary.jd_recall)} | 85%+ |`);
L.push(`| Claims of tools you do not have | ${summary.unsupported_claims} | 0 |`);
L.push(`| Lint errors after review | ${summary.lint_errors} | 0 |`);
L.push(`| Bullets with a number | ${pct(summary.metric_density)} | 40%+ |`);
L.push(`| Distinct opening verbs | ${pct(summary.verb_diversity)} | 85%+ |`);
L.push(`| Roles with distinct arc stages | ${pct(summary.arc_distinct)} | 100% |`);
L.push(`| Bullet allocation followed | ${pct(summary.allocation_ok)} | 100% |`);
L.push(`| LAMA Desserts has 4+ bullets | ${pct(summary.lama_min4)} | 100% |`);
L.push(`| JD requirements visible in their mapped role | ${pct(summary.requirement_coverage)} | 90%+ |`);
L.push(`| Roles in lifecycle order | ${pct(summary.lifecycle_ok)} | 100% |`);
L.push(`| Tools placed in a role that never used them | ${summary.role_evidence_flags} | 0 |`);
L.push(`| Email structure correct | ${pct(summary.email_ok)} | 100% |`);
L.push(`| LinkedIn ≤ 300 chars | ${pct(summary.linkedin_ok)} | 100% |`);

L.push("", "## How much the resume changes between JDs", "", "Trigram overlap of resume text between pairs of JDs. Lower across families means real restructuring.", "", "| Text | Same family | Different family |", "|---|---|---|");
L.push(`| Whole resume | ${pct(v.whole.same_family)} | ${pct(v.whole.cross_family)} |`);
Object.entries(v.by_role).forEach(([k, x]) => L.push(`| ${k} bullets | ${pct(x.same_family)} | ${pct(x.cross_family)} |`));

L.push("", "## Per JD", "", "| JD | Expected | Got | Reach | Recall | Gaps claimed | Lint err | Metrics | Judge | Decision |", "|---|---|---|---|---|---|---|---|---|---|");
done.forEach((r) => {
  const m = r.metrics;
  L.push(`| ${r.jd.id} ${r.jd.title} | ${r.jd.expected.join(" / ")} | ${m.archetype_ok ? "✓" : "✗"} ${m.archetype} | ${pct(m.reach)} | ${pct(m.jd_recall)} | ${m.unsupported.join(", ") || "none"} | ${m.lint_errors} | ${pct(m.metric_density)} | ${r.judge ? avgScore(r.judge).toFixed(1) : "-"} | ${r.judge?.decision || "-"} |`);
});

const fams = [...new Set(done.map((r) => r.jd.family))];
L.push("", "## By family", "", "| Family | Judge | Advance | Recall | Metrics |", "|---|---|---|---|---|");
fams.forEach((f) => {
  const rs = done.filter((r) => r.jd.family === f), js = rs.filter((r) => r.judge);
  L.push(`| ${f} | ${js.length ? mean(js.map((r) => avgScore(r.judge))).toFixed(2) : "-"} | ${js.length ? pct(mean(js.map((r) => +(r.judge.decision === "advance")))) : "-"} | ${pct(mean(rs.map((r) => r.metrics.jd_recall)))} | ${pct(mean(rs.map((r) => r.metrics.metric_density)))} |`);
});

if (judged.length) {
  const dims = Object.keys(judged[0].judge.scores);
  L.push("", "## Judge scores by dimension", "", `| ${dims.join(" | ")} |`, `|${dims.map(() => "---").join("|")}|`);
  L.push(`| ${dims.map((d) => mean(judged.map((r) => r.judge.scores[d])).toFixed(2)).join(" | ")} |`);
  const bySection = {};
  judged.forEach((r) => r.judge.problems.forEach((p) => {
    const key = (p.section.match(/summary|skills|dxc|lama|northwest|nwmsu|project|email|linkedin|education|cert/i)?.[0] || "other").toLowerCase().replace("northwest", "nwmsu");
    (bySection[key] ||= []).push(`[${p.severity}] ${r.jd.id}: ${p.issue}`);
  }));
  L.push("", "## Recurring problems (judge)", "");
  Object.entries(bySection).sort((a, b) => b[1].length - a[1].length).forEach(([k, xs]) => {
    L.push(`### ${k} (${xs.length})`, ...xs.slice(0, 12).map((x) => `- ${x}`), "");
  });
  L.push("## Rule suggestions from the judge", "", ...[...new Set(judged.flatMap((r) => r.judge.rule_suggestions))].map((x) => `- ${x}`));
}

const lintFreq = {};
M.forEach((m) => m.issues.forEach((i) => { const k = `${i.severity}: ${i.message.replace(/"[^"]*"/g, '"…"').replace(/\d+/g, "N")}`; lintFreq[k] = (lintFreq[k] || 0) + 1; }));
L.push("", "## Lint findings across all JDs", "", ...Object.entries(lintFreq).sort((a, b) => b[1] - a[1]).map(([k, c]) => `- ${c}× ${k}`));

L.push("", "## Detail", "");
done.forEach((r) => {
  const a = r.analysis;
  L.push(`### ${r.jd.id} · ${r.jd.title} (${r.jd.company})`, `Test: ${r.jd.trap}`, "");
  L.push(`- Read as **${a.archetype}** (${a.seniority}). Mandate: ${a.core_mandate}`);
  L.push(`- Allocation: ${(a.strategy?.bullet_allocation || []).map((x) => `${x.role_id} ${x.bullets}`).join(", ")} · Titles: ${r.metrics.titles.join(", ")}`);
  (a.requirement_map || []).forEach((q) => L.push(`  - "${q.jd_wording}" → ${q.role_id}`));
  if (r.judge) {
    L.push(`- 8-second take: ${r.judge.eight_second_take}`);
    r.judge.problems.forEach((p) => L.push(`- Problem [${p.severity}] ${p.section}: ${p.issue}`));
    if (r.judge.missing_for_this_jd.length) L.push(`- Missing: ${r.judge.missing_for_this_jd.join("; ")}`);
  }
  L.push("");
});

writeFileSync(new URL("./report.md", OUT), L.join("\n"));
writeFileSync(new URL("./summary.json", OUT), JSON.stringify(summary, null, 2));
console.log(`\nReport: eval/out/report.md`);
