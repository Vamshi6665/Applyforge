# ApplyForge Specification v2.3 — Personalized Resume Forge

ApplyForge is a single-user tool for Vamshi Krishna Balupari. Paste a job description (JD); ApplyForge returns three deliverables built for that JD only:

1. A one-page resume, fully restructured around what the role actually is
2. A three-paragraph recruiter email
3. A LinkedIn connection request of 300 characters or fewer

This document is the source of truth. The prompts in `api/_lib/prompts.js` and the checks in `api/_lib/lint.js` implement it. Change behavior here first, then in code.

---

## 1. Principles

| # | Principle | What it means in practice |
|---|-----------|---------------------------|
| P1 | **Read the role, not the keywords** | The JD is analyzed for the job to be done, who the person answers to, what they own, and what success looks like. Keywords come last. |
| P2 | **Restructure, don't decorate** | Every section of the resume (headline, summary, every role's bullets, skills order) is rebuilt around the role archetype. Adding keywords to an unchanged resume is a failure. |
| P3 | **Technically sound** | Every bullet must describe a mechanism that would hold up in a technical interview: the tool does what the bullet says it did, in a sensible order, at a believable scale. |
| P4 | **Natural, not keyword-stuffed** | A technology appears in a bullet because it was the right tool for the work described, never because the JD listed it. |
| P5 | **Honest** | No invented employers, degrees, certifications, or numbers. Framing may change; facts may not. Anything stretched is listed for review (see §6). |
| P6 | **Different JD → different resume** | Two JDs with different archetypes must produce visibly different headlines, summaries, bullet sets, bullet allocation, and skill orders. |

---

## 2. Stage 1 — JD Analysis

The analyzer reads the JD the way a hiring manager would, and returns a structured brief. Nothing is written for the resume until this brief exists.

### 2.1 Questions the analysis must answer

1. **Role archetype.** Which of these is the job really? `data_analyst_bi`, `data_engineer`, `analytics_engineer`, `data_scientist_ml`, `ml_llm_engineer`, `software_engineer`, `business_analyst`, `product_analyst`, `other`. The title is evidence, not the answer: a "Data Analyst" whose duties are building ingestion pipelines is a data engineer.
2. **Core mandate.** One or two sentences: what is this person accountable for delivering?
3. **Ownership mode.** Does the person own business decisions and reporting (analyst / BI owner), own data movement and reliability (pipeline maintainer), own models and experiments (scientist), or own software features (engineer)?
4. **Business context.** Industry, data domain, internal vs. client-facing, team shape.
5. **Success signals.** What would make this hire successful in 6 to 12 months?
6. **Primary stack.** The technologies the work is built on, each with the JD line that proves it.
7. **Secondary stack.** Supporting tools that appear but are not central.
8. **Must-haves vs. nice-to-haves.**
9. **Operating expectations.** Stakeholder work, on-call, documentation, mentoring, ambiguity.
10. **Seniority.** Entry, mid, senior, lead, from scope and years, not title alone.

### 2.2 Candidate fit (against the master profile)

- **Strong matches** — requirement plus the real evidence in the profile.
- **Bridgeable** — requirement the profile covers with an adjacent tool or practice, plus the honest bridge.
- **True gaps** — requirement the profile does not cover. These are never claimed on the resume.

### 2.3 Resume strategy (output of analysis, input to Stage 2)

- Headline title to use on the resume
- Summary angle (what the first sentence must prove)
- Emphasis for each role: which real work to lead with and which stack to frame it in
- Bullet allocation per role (§3.2a)
- Requirement map (§3.2c)
- Skill category order

---

## 3. Stage 2 — Resume Restructuring

### 3.1 Layout (one page, US Letter)

Modeled on the reference resume's structure, not its wording.

```
                           VAMSHI KRISHNA BALUPARI
       Houston, TX | phone | email | LinkedIn | GitHub
──────────────────────────────────────────────────────────────
Summary paragraph, 3 lines, opens with the headline title.

PROFESSIONAL EXPERIENCE
──────────────────────────────────────────────────────────────
Company                                              Mon YYYY – Mon YYYY
Title                                                         Location
 • Bold Lead-In Label: action + mechanism + stack + outcome/metric
 ...
TECHNICAL SKILLS   (Category : items)
CERTIFICATIONS
EDUCATION
```

- Font: Times New Roman (serif), 10 to 10.5 pt body, 0.5 in margins. Auto-shrink to 9.5 pt minimum to stay on one page.
- Section headers uppercase, bold, full-width rule beneath.
- Company and dates on one line (dates right-aligned); title and location on the next.

### 3.2 Every role is re-angled for the JD

All three roles are rewritten for every JD. None of them keeps default bullets.

- **Lenses.** Each role in the master profile has a lens per archetype: the same real work, described from the angle that role type cares about. Example for LAMA Desserts: data engineer → ingestion, append-only history, migration, validation; BI analyst → KPIs, DAX, reorder thresholds, owner reviews; software engineer → auth, schema with triggers and RLS, deployed web app. Lenses carry "do not claim" notes (e.g., no ML model at LAMA).
- **Blending.** When a JD mixes disciplines, the analysis picks a lead lens and a secondary one for each role.
- **Titles.** A title from the role's `altTitles` is used when it matches the archetype.
- **DXC** is one block with no client names.
- **No copying.** Bullets are newly written; a lint check flags any bullet that reads like a copy of the base profile.

### 3.2a Bullet allocation (set by the analysis, per JD)

There is **no Projects section**. Project work is written inside the role where it happened: the inventory system under LAMA Desserts (never named TIFA), CodeRepoReader and the SHAP/Anchor framework under Northwest Missouri State. Personal projects (Instacart, ApplyForge, EdgeCare) are not shown; their tools can appear in Technical Skills only.

| Role | Bullets | Weighted toward |
|---|---|---|
| LAMA Desserts LLC | 4 to 5, never fewer than 4 (US experience) | BI, analytics, full-stack, small-team ownership roles |
| Northwest Missouri State University | 3 to 4 | ML, LLM, research roles |
| DXC Technology | 6 to 8 | pipeline, BI, warehouse, platform roles |

Total: 15 to 17 experience bullets. The analysis explains each allocation.

### 3.2b Industry arcs in lifecycle order

Each role reads like a project its owner took from definition to impact. The **first bullet** is the role's strongest proof of the JD's mandate. **Every bullet after it follows lifecycle order**: define → design → build → test and validate → deploy and operate → impact. Two bullets in one role never sit on the same stage.

| Archetype | Arc stages, in order |
|---|---|
| data_engineer | Requirements and Source Mapping → Pipeline Design and Architecture → Ingestion and Integration → Distributed Transformation → Data Modeling and Warehousing → Data Quality and Validation → Orchestration and Incremental Loads → CI/CD and Release → Observability and Incident Recovery → Downstream Delivery and Impact |
| data_analyst_bi | Requirements and KPI Definition → Data Model Design → SQL Analysis and Data Preparation → Semantic Modeling and DAX → Validation and Reconciliation → Dashboard and Self-Service Delivery → Data Governance and Access → Adoption, UAT, and Training → Insight and Decision Impact |
| analytics_engineer | Source Profiling and Mapping → Model Design → Layered Transformation → Dimensional Modeling → Testing and Reconciliation → Semantic Layer → Release and Orchestration → Documentation and Lineage → Stakeholder Enablement |
| data_scientist_ml | Problem Framing → Data and Feature Engineering → Modeling → Evaluation and Error Analysis → Explainability and Responsible AI → Forecasting and Scenario Analysis → Deployment and Monitoring → Communication of Results |
| ml_llm_engineer | Problem Definition → LLM Application Architecture → Context Grounding → Agents and Tool Use → Evaluation and Benchmarking → Serving and Deployment → Data Foundations → Reliability and Cost |
| software_engineer | Requirements and Scope → System Design → Backend and Data Model → Frontend and UX → Security and Auth → Testing and Validation → CI/CD and Release → Deployment and Operations → Performance and Reliability |
| business_analyst | Requirements Elicitation → Process and Gap Analysis → Solution Design and Specifications → Metrics Definition → Data Analysis → UAT and Acceptance → Release and Training → Stakeholder Communication → Delivery and Adoption |
| product_analyst | Metrics Definition → Instrumentation and Data Design → Product Analytics → Experimentation and Evaluation → Dashboards and Self-Service → Insight to Roadmap → Stakeholder Communication |

A role carrying the mandate uses the archetype's arc; a supporting role uses its own discipline's arc (DXC on an LLM role uses the data engineer arc, framed as the data foundations behind AI).

### 3.2c Requirement map and JD wording

The analysis maps 6 to 10 key JD requirements to the role with real evidence (`requirement_map`: requirement, the JD's exact 3 to 8 word phrase, role, evidence). It checks LAMA Desserts first, then Northwest Missouri State, then DXC, and maps to `none` when no role can back it.

- Every mapped requirement appears in its role's bullets.
- Where the JD's wording truthfully describes the work, the bullet uses the JD's own words, so the hiring manager recognizes their requirement.
- Mirroring wording never adds a tool, domain, scale, or claim the facts do not support. `none` requirements are never claimed.
- A tool appears in a role's bullet only if that role's record shows it (no moving Snowflake into LAMA or Supabase into DXC).

### 3.3 Bullet formation (learned from the reference resume)

Every bullet follows this pattern:

```
<Bold Lead-In Label>: <Strong verb> <what was built/decided> <using which stack, in a sensible order>, <producing which measurable or concrete outcome>
```

Rules:

1. **Lead-in label.** 2 to 4 words, Title Case, names the arc stage in the role's own terms (`Reconciliation Automation:`, `Semantic Modeling:`, `Model Evaluation:`). Labels are unique within a role.
2. **Verb.** Opens with a strong, specific past-tense verb (present tense for the current role). Banned openers: *used, wrote, worked, helped, assisted, responsible for, participated, was involved, handled, did, made, tasked with*. A verb may be used at most twice on the whole resume.
3. **Mechanism.** Say how, not only what: the stage, the technique, the design decision.
4. **Stack in context.** Tools appear inside the action, in the order they were used, never as a trailing list.
5. **Outcome.** End with the result: a metric from the metrics bank, or a concrete business or technical effect (who used it, what decision it enabled, what it prevented).
6. **Length.** 18 to 34 words; must fit in two printed lines.
7. **Metrics.** At least 40% of bullets carry a number. Numbers come only from the metrics bank (§5). Do not invent new numbers.
8. **Vocabulary.** Senior practitioner register: *architected, engineered, orchestrated, instrumented, reconciled, productionized, modeled, partitioned, benchmarked, operationalized, standardized, translated*. No filler: *various, multiple tasks, etc., synergy, cutting-edge, passionate, leveraged synergies*.
9. **Punctuation.** No em dashes, no double hyphens, no markdown in content, no first-person pronouns.

### 3.4 Archetype framing guide

| Archetype | Headline | Lead every role with | Skills order |
|---|---|---|---|
| data_analyst_bi | Data Analyst | KPI ownership, Power BI/DAX models, SQL analysis, stakeholder decisions | BI, SQL/Languages, Data Prep, Cloud |
| data_engineer | Data Engineer | Pipeline design, PySpark/Spark, orchestration, data quality, reliability | Languages, Processing, Integration, Warehousing, Cloud |
| analytics_engineer | Analytics Engineer | dbt-style modeling, star schemas, semantic layers, tested SQL | SQL/Modeling, Warehousing, BI, Orchestration |
| data_scientist_ml | Data Scientist | Feature engineering, evaluation, explainability, experiments | ML, Languages, Data, Cloud |
| ml_llm_engineer | AI/ML Engineer | LLM apps, agents, SDK benchmarking, evaluation | LLM/AI, Languages, Backend, Cloud |
| software_engineer | Software Engineer | Services, APIs, data models, testing, deployment | Languages, Frameworks, Data, DevOps |
| business_analyst / product_analyst | Business / Product Analyst | Requirements, metrics definition, analysis, UAT | Analysis, BI, SQL, Tools |

Analysis-led emphasis always overrides this table when the JD calls for something specific.

### 3.5 Technical skills section

- **Only technologies.** Languages, frameworks, libraries, platforms, services, databases, tools, and named methodologies (Agile/Scrum allowed under "Practices" only if the JD stresses them).
- **Never:** soft skills, duties, or concepts phrased as skills (*communication, stakeholder management, problem solving, data-driven decisions, attention to detail, data pipelines, reporting*).
- 4 to 6 categories, ordered by the archetype. Inside each category, JD-relevant items first.
- Only technologies in the master profile's skill inventory, plus approved stretch items (§6).

### 3.6 Summary

3 lines, about 55 to 70 words. Sentence 1: headline title + 4+ years + the two or three capabilities the role is about. Sentence 2: the strongest proof (a bank metric). Sentence 3: M.S. + the certifications relevant to this role.

---

## 4. Stage 3 — Quality Review

Every generated resume passes through:

1. **Deterministic lint** (`api/_lib/lint.js`): banned openers, verb repetition, bullet length, missing labels, em dashes, numbers not in the metrics bank, non-technical skills, duplicate labels, summary length, allocation mismatch, LAMA under 4 bullets, a projects section, repeated arc stage, lifecycle order, tools outside their role's record, JD requirements not visible in their mapped role, and bullets copied from the base profile.
2. **Critic pass** (LLM): receives the resume, the analysis, and the lint report; rewrites only the failing or weak bullets; checks technical soundness (tool order, believable scale, tool actually capable of the claim) and whether the resume reads as the target archetype.
3. **Re-lint**, then auto-fix punctuation. Remaining issues are shown in the UI.

---

## 5. Master profile and metrics bank

`api/_lib/profile.js` holds the facts: contact, roles, dates, real work, projects, skill inventory, certifications, education, and the metrics bank. The UI Profile editor overrides it (saved in the browser).

Metrics bank (only numbers the resume may use):

- 40+ regional sources consolidated
- ~5 million reporting records
- 90%+ reduction in recurring reporting errors
- 25% reduction in storage-related escalations
- 80% utilization threshold used for proactive upgrades
- 7 paper and spreadsheet logs replaced; 8 CSV exports migrated (TIFA)
- 4+ years of experience; GPA 4.0

The model may propose a new metric only in `suggested_metrics` for Vamshi to confirm. It never appears in the resume until he adds it to the bank.

---

## 5a. Evidence and term map

Every analysis carries a deterministic term map (`api/_lib/terms.js`) of the JD's technologies:

| Class | Meaning | Allowed on resume |
|---|---|---|
| matched | in the skill inventory | yes; JD core tools must appear |
| bridgeable | same category as a tool he has | stretch mode only, listed for review |
| history | appears in his work facts but is not a claimed skill (prepared data *for* forecasting; parsed Java files) | only exactly as the facts say; never in Skills |
| gap | nothing equivalent | never |

Tools in the skill inventory that no experience role supports (`unbacked`, including tools seen only in personal projects) may appear in Technical Skills only, never in a bullet. Metrics carry a role tag and may only be used in that role's bullets. Profile reach below 65% shows a low-fit warning.

## 6. Honesty controls

- **Strict mode (default):** bullets and skills use only technologies in the skill inventory. JD technologies outside it are listed under *Gaps* in the analysis.
- **Stretch mode (toggle):** the resume may name JD technologies that are close equivalents of proven ones (same category, e.g., Airflow ↔ ADF orchestration, BigQuery ↔ Snowflake). Every stretched item is listed in `review_notes.stretched_claims` with the real basis, so interview prep can cover it.
- Never invented in either mode: employers, titles, dates, degrees, certifications, numbers, domain regulation experience.

---

## 7. Stage 4 — Outreach

### 7.1 Recruiter email (three paragraphs)

```
Subject: <Role Title> | <short value phrase>

Hi <Name>,
Greetings of the day.

P1  Who I am + interest. "I am Vamshi Krishna, a <headline> with over four years of experience <2 capabilities matching the mandate>. I hold a master's degree in Applied Computer Science and am interested in the <exact role title> position<at Company>."

P2  The fit paragraph (the most important). 3 to 5 sentences of real experience mapped to the JD's core mandate: what was built, with which stack, with 1 to 2 bank metrics. Close with one sentence tying it to the team's stated focus.

P3  Close. Resume attached; welcome to learn more about the role and team; look forward to next steps.

<Signature block from profile>
```

Two variants: **Metrics-forward** and **Concise**.

### 7.2 LinkedIn connection request

- Hard limit: 300 characters including spaces (enforced in code).
- Order: greeting → who I am in role terms → MS + relevant certs → interest in the specific role/company → connect ask.
- Two variants. If the recipient name is unknown, use `Hi [Name],`.

---

## 8. Evaluation and learning loop

- **Test set:** 20 labeled JDs in `eval/jds.js` (5 data analyst, 5 data engineer, 5 data scientist/AI, 5 software engineer), including traps (analyst title with engineering duties) and low-fit cases.
- **Harness:** `npm run eval` runs the full pipeline and a recruiter + hiring-manager judge (`eval/judge.js`, 8 scored dimensions, advance/maybe/reject, located problems, rule suggestions), plus model-free metrics: role type accuracy, JD tool recall, unsupported claims, lint errors, metric density, verb diversity, arc distinctness, allocation, outreach structure, and cross-JD text overlap.
- **Loop:** run eval → read recurring problems and rule suggestions → change this spec and the prompts → rerun and compare.
- **Approved examples:** "Approve as example" stores the final resume (with manual edits) per role type; the newest 2 for the same role type are sent as style references on future runs.
- **Outcomes:** each history entry can be marked Applied / Recruiter reply / Interview / Offer / Rejected.
- **Fine-tuning:** "Export fine-tuning data" writes approved examples in OpenAI chat JSONL. Fine-tuning is worth it only after roughly 50+ approved examples; until then, examples-in-context plus rule changes give most of the gain.
- **Database (optional):** `db/schema.sql` moves runs, examples, and outcomes from the browser into Supabase for multi-device history and response-rate analysis by role type.

## 9. Application architecture

| Layer | Choice |
|---|---|
| Frontend | React + Vite, single page, light professional UI |
| Backend | Vercel serverless functions in `/api` (also run by Vite in local dev) |
| Model | OpenAI SDK, `gpt-4o` default (`OPENAI_MODEL`), JSON Schema structured outputs |
| Key | `OPENAI_API_KEY` env var; optional per-browser key in Settings |
| Endpoints | `POST /api/analyze`, `POST /api/resume`, `POST /api/review`, `POST /api/outreach` |
| Exports | DOCX (docx library), PDF (print stylesheet), plain text copy |
| Storage | Browser localStorage: profile override, settings, last 20 runs |

"Training" the bot means this spec compiled into system prompts, a structural reference for bullet formation, the master profile, deterministic lint, and a critic pass. No fine-tuning is required; editing this spec and `prompts.js` changes behavior immediately.
