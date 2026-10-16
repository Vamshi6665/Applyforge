# ApplyForge Evaluation Report

Model: fixtures (eval/reference) · Mode: strict · JDs: 3

## Scorecard

| Measure | Result | Target |
|---|---|---|
| Role type read correctly | 100% | 100% |
| Recruiter judge average (1 to 5) | not judged | 4.0+ |
| Recruiter would advance | n/a | 70%+ on reachable JDs |
| JD tools you have that made it onto the resume | 100% | 85%+ |
| Claims of tools you do not have | 0 | 0 |
| Lint errors after review | 0 | 0 |
| Bullets with a number | 45% | 40%+ |
| Distinct opening verbs | 93% | 85%+ |
| Roles with distinct arc stages | 100% | 100% |
| Bullet allocation followed | 100% | 100% |
| Email structure correct | 100% | 100% |
| LinkedIn ≤ 300 chars | 100% | 100% |

## How much the resume changes between JDs

Trigram overlap of resume text between pairs of JDs. Lower across families means real restructuring.

| Text | Same family | Different family |
|---|---|---|
| Whole resume | n/a | 9% |
| lama bullets | n/a | 7% |
| nwmsu bullets | n/a | 6% |
| dxc bullets | n/a | 15% |

## Per JD

| JD | Expected | Got | Reach | Recall | Gaps claimed | Lint err | Metrics | Judge | Decision |
|---|---|---|---|---|---|---|---|---|---|
| da3 Data Analyst | data_engineer / analytics_engineer | ✓ data_engineer | 100% | 100% | none | 0 | 47% | - | - |
| ds3 Generative AI Engineer | ml_llm_engineer | ✓ ml_llm_engineer | 43% | 100% | none | 0 | 50% | - | - |
| swe2 Junior Full-Stack Engineer | software_engineer | ✓ software_engineer | 86% | 100% | none | 0 | 39% | - | - |

## By family

| Family | Judge | Advance | Recall | Metrics |
|---|---|---|---|---|
| data_analyst | - | - | 100% | 47% |
| data_scientist | - | - | 100% | 50% |
| software_engineer | - | - | 100% | 39% |

## Lint findings across all JDs

- 1× warn: Only N of N bullets carry a number; target N%.

## Detail

### da3 · Data Analyst (Fieldstone Retail)
Test: Title says analyst; duties are ingestion pipelines, Airflow, dbt, BigQuery (archetype trap + GCP gap)

- Read as **data_engineer** (mid). Mandate: Own the ingestion and transformation pipelines that load POS, e-commerce, and loyalty data into the warehouse, keep them reliable, and make the tables answer merchandising questions.
- Allocation: dxc 7, lama 5, nwmsu 3, instacart 2, applyforge 2 · Titles: lama:Data Engineer, nwmsu:Data Research Assistant, dxc:Data Engineer

### ds3 · Generative AI Engineer (Clearwater Legal Tech)
Test: RAG, vector DBs, LangChain, evals; CodeRepoReader should lead, no RAG claim

- Read as **ml_llm_engineer** (mid). Mandate: Build grounded LLM features over large legal document sets and prove their accuracy, groundedness, and latency with evaluation harnesses.
- Allocation: nwmsu 5, dxc 5, lama 3, applyforge 3, xai 2 · Titles: lama:Data Associate, nwmsu:AI Research Assistant, dxc:Data Engineer

### swe2 · Junior Full-Stack Engineer (Mosaic Health Apps)
Test: React + TypeScript + Node + Postgres; TypeScript gap

- Read as **software_engineer** (entry). Mandate: Ship full-stack features end to end: React UI, Node.js API, PostgreSQL schema, authentication and access control, tests, and deployment.
- Allocation: lama 5, dxc 5, nwmsu 3, applyforge 3, edgecare 2 · Titles: lama:Software Engineer, nwmsu:Research Assistant, dxc:Data Engineer
