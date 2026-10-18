import test from "node:test";
import assert from "node:assert/strict";
import { lintResume, autofix, enforceLinkedIn } from "../api/_lib/lint.js";
import { DEFAULT_PROFILE } from "../api/_lib/profile.js";
import { analysisSchema, resumeSchema, outreachSchema } from "../api/_lib/schemas.js";
import { GOOD_RESUME } from "./fixture.js";

const errors = (r) => lintResume(r, DEFAULT_PROFILE).filter((i) => i.severity === "error");

test("a spec-compliant resume has no lint errors", () => {
  assert.deepEqual(errors(GOOD_RESUME), []);
});

test("weak openers, invented numbers, clients, and soft skills are caught", () => {
  const r = structuredClone(GOOD_RESUME);
  r.experience[2].bullets[0].text = "Used Python to work on pipelines for AT&T that processed 12 million rows each day for reporting teams.";
  r.skills[0].items.push("Stakeholder Management");
  const msgs = errors(r).map((i) => i.message).join(" | ");
  assert.match(msgs, /Weak opener/);
  assert.match(msgs, /"12" is not in the metrics bank/);
  assert.match(msgs, /Client name/);
  assert.match(msgs, /not a technical skill/);
});

test("tool names with digits are not treated as metrics", () => {
  const r = structuredClone(GOOD_RESUME);
  r.experience[2].bullets[3].text = "Architected raw and curated Amazon S3 layers with GPT-4o tagging, ADLS Gen2 mirrors, and PL-300 aligned Power BI models for regional reporting consumers.";
  assert.deepEqual(errors(r), []);
});

test("autofix strips em dashes and markdown", () => {
  const r = structuredClone(GOOD_RESUME);
  r.summary = "Data Engineer — **builder** of pipelines";
  assert.equal(autofix(r).summary, "Data Engineer, builder of pipelines");
});

test("LinkedIn note is always at most 300 characters", () => {
  const long = "Hi Sarah, I'm Vamshi, a Data Engineer with 4+ years building Azure and AWS pipelines in PySpark, Databricks, and Snowflake. I recently completed my MS in Computer Science and hold DP-203, PL-300, and AWS certifications. I'm very interested in the Senior Data Engineer role on your platform team and would be glad to connect and learn more about it.";
  const out = enforceLinkedIn(long);
  assert.ok(out.length <= 300, `length ${out.length}`);
  assert.match(out, /\.$/);
});

test("structured output schemas satisfy strict-mode rules", () => {
  const walk = (s, path) => {
    if (s.type === "object") {
      assert.equal(s.additionalProperties, false, path);
      assert.deepEqual(Object.keys(s.properties).sort(), [...s.required].sort(), path);
      Object.entries(s.properties).forEach(([k, v]) => walk(v, `${path}.${k}`));
    } else if (s.type === "array") walk(s.items, `${path}[]`);
  };
  [analysisSchema, resumeSchema, outreachSchema].forEach((x) => walk(x.schema, x.name));
});

test("every role has a lens for every archetype", async () => {
  const { ARCHETYPES } = await import("../api/_lib/schemas.js");
  DEFAULT_PROFILE.experience.forEach((e) =>
    ARCHETYPES.filter((a) => a !== "other").forEach((a) => assert.ok(e.lenses?.[a], `${e.id} missing ${a}`)));
});

test("prompts include the industry arcs and allocation rules", async () => {
  const { ANALYZE_SYSTEM, resumeSystem, ARCS } = await import("../api/_lib/prompts.js");
  assert.match(ANALYZE_SYSTEM, /bullet_allocation/);
  assert.match(resumeSystem({ stretch: false }), /ALL THREE ROLES ARE REWRITTEN/);
  assert.ok(resumeSystem({ stretch: false }).includes(ARCS.data_engineer[0]));
});

test("allocation mismatch, repeated arc stage, and copied base text are flagged", () => {
  const r = structuredClone(GOOD_RESUME);
  r.experience[0].bullets[0].arc_step = "Ingestion and Integration";
  r.experience[0].bullets[1].arc_step = "Ingestion and Integration";
  r.experience[1].bullets[0].text = DEFAULT_PROFILE.experience[1].facts[0];
  const analysis = { strategy: { bullet_allocation: [{ role_id: "dxc", bullets: 7, why: "" }] } };
  const msgs = lintResume(r, DEFAULT_PROFILE, { analysis }).map((i) => i.message).join(" | ");
  assert.match(msgs, /allocated 7/);
  assert.match(msgs, /same stage/);
  assert.match(msgs, /copy of the base profile/);
});

test("a metric cannot be claimed by a role that does not own it", () => {
  const r = structuredClone(GOOD_RESUME);
  r.experience[0].bullets[0].text = "Engineers a Supabase PostgreSQL inventory platform with validation rules that reduced recurring reporting errors by more than 90% for owners.";
  const msgs = errors(r).map((i) => i.message).join(" | ");
  assert.match(msgs, /"90%" is a dxc metric/);
  const ok = structuredClone(GOOD_RESUME);
  ok.experience[1].bullets[2].text = "Benchmarked 2 agent SDKs across 3 LLMs on context handling, tool integration, and response quality, contributing results to a co-authored research paper.";
  assert.deepEqual(errors(ok), []);
});

test("v2.3 structure: LAMA needs 4+, no projects, tools stay in their own role", () => {
  const r = structuredClone(GOOD_RESUME);
  r.experience[0].bullets = r.experience[0].bullets.slice(0, 3);
  r.projects = [{ name: "X", tech: [], bullets: [] }];
  r.experience[0].bullets[0].text = "Engineers Snowflake ingestion for a small-business inventory platform, loading sales and vendor records into curated tables for owner purchasing decisions.";
  const all = lintResume(r, DEFAULT_PROFILE).map((i) => i.message).join(" | ");
  assert.match(all, /LAMA Desserts always needs at least 4/);
  assert.match(all, /no Projects section/);
  assert.match(all, /"Snowflake" is not in your LAMA Desserts LLC record/);
});

test("lifecycle order and JD requirement coverage are checked", () => {
  const r = structuredClone(GOOD_RESUME);
  const steps = ["Downstream Delivery and Impact", "CI/CD and Release", "Ingestion and Integration", "Data Quality and Validation", "Data Modeling and Warehousing", "Observability and Incident Recovery", "Requirements and Source Mapping", "Orchestration and Incremental Loads"];
  r.experience[2].bullets.forEach((b, i) => (b.arc_step = steps[i]));
  const analysis = { requirement_map: [
    { requirement: "x", jd_wording: "own on-call for failed loads", role_id: "dxc", evidence: "" },
    { requirement: "y", jd_wording: "source-to-target reconciliation", role_id: "dxc", evidence: "" },
  ] };
  const msgs = lintResume(r, DEFAULT_PROFILE, { analysis }).map((i) => i.message).join(" | ");
  assert.match(msgs, /lifecycle order/);
  assert.match(msgs, /"own on-call for failed loads" is mapped to DXC Technology but not visible/);
  assert.doesNotMatch(msgs, /source-to-target reconciliation" is mapped/);
});
