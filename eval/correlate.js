// Model-free analysis: how well the master profile can answer each test JD.
// Usage: node eval/correlate.js  → eval/out/correlation.md + .json
import { mkdirSync, writeFileSync } from "node:fs";
import { JDS } from "./jds.js";
import { correlate } from "../api/_lib/terms.js";
import { DEFAULT_PROFILE } from "../api/_lib/profile.js";

const pct = (x) => `${Math.round(x * 100)}%`;
const rows = JDS.map((jd) => ({ id: jd.id, family: jd.family, title: jd.title, ...correlate(jd.text, DEFAULT_PROFILE) }));

const fam = {};
rows.forEach((r) => {
  const f = (fam[r.family] ||= { n: 0, cov: 0, reach: 0, gaps: {} });
  f.n++; f.cov += r.coverage; f.reach += r.reach;
  r.gaps.forEach((g) => (f.gaps[g] = (f.gaps[g] || 0) + 1));
});
const allGaps = {};
rows.forEach((r) => r.gaps.forEach((g) => (allGaps[g] = (allGaps[g] || 0) + 1)));
const allBridges = {};
rows.forEach((r) => r.bridgeable.forEach((g) => (allBridges[g] = (allBridges[g] || 0) + 1)));

// metrics available per role: bank entries tagged to a role by the text in parentheses
const bankByRole = {};
DEFAULT_PROFILE.metricsBank.forEach((m) => (bankByRole[m.role] = (bankByRole[m.role] || 0) + 1));

const L = [];
L.push("# JD ↔ Profile Correlation (model-free)", "");
L.push("Matched = a skill you list. Bridgeable = you list a same-category tool. Context = appears in your work history but is not a listed skill. Gap = nothing.", "");
L.push("| JD | Family | Terms | Matched | Reach (matched + bridge) | Context | Gaps |", "|---|---|---|---|---|---|---|");
rows.forEach((r) => L.push(`| ${r.id} ${r.title} | ${r.family} | ${r.terms.length} | ${pct(r.coverage)} | ${pct(r.reach)} | ${r.context.join(", ") || "-"} | ${r.gaps.join(", ") || "none"} |`));
L.push("", "## By family", "", "| Family | Avg matched | Avg reach | Top gaps |", "|---|---|---|---|");
Object.entries(fam).forEach(([k, f]) =>
  L.push(`| ${k} | ${pct(f.cov / f.n)} | ${pct(f.reach / f.n)} | ${Object.entries(f.gaps).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([g, c]) => `${g} (${c})`).join(", ")} |`));
L.push("", "## Most frequent gaps across all 20", "");
Object.entries(allGaps).sort((a, b) => b[1] - a[1]).forEach(([g, c]) => L.push(`- ${g}: ${c} JDs`));
L.push("", "## Most frequent bridgeable terms", "");
Object.entries(allBridges).sort((a, b) => b[1] - a[1]).slice(0, 12).forEach(([g, c]) => L.push(`- ${g}: ${c} JDs`));
L.push("", "## Metrics available per role", "", ...Object.entries(bankByRole).map(([k, v]) => `- ${k}: ${v} bank metrics`));

mkdirSync(new URL("./out/", import.meta.url), { recursive: true });
writeFileSync(new URL("./out/correlation.md", import.meta.url), L.join("\n"));
writeFileSync(new URL("./out/correlation.json", import.meta.url), JSON.stringify({ rows, fam, allGaps, allBridges, bankByRole }, null, 2));
console.log(L.join("\n"));
