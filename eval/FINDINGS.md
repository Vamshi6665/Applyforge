# Evaluation Findings — Round 1 (Oct 16, 2026)

## What was tested

| Layer | How | Scope |
|---|---|---|
| JD ↔ profile correlation | Model-free term matching (`npm run eval:correlate`) | All 20 JDs |
| Rule satisfiability | Reference resumes written by Claude following ApplyForge's exact prompts, scored by the harness (`npm run eval:reference`) | 3 hardest JDs: da3, ds3, swe2 |
| Code path | Full pipeline + judge against a mock OpenAI server | 3 JDs |
| Real model quality | `npm run eval` with your OpenAI key (GPT is blocked from the build workspace) | **Pending: your run** |

## Correlation results (20 JDs)

| Family | Your tools matched | Matched + close equivalents | Hardest JD |
|---|---|---|---|
| Data analyst | 83% | 95% | da4 Product Analyst: A/B testing, statistics |
| Data engineer | 66% | 84% | de4 Streaming: Kafka, Flink, Scala (38% reach) |
| Data scientist / AI | 56% | 72% | ds3 GenAI: RAG, vector DBs, LangChain (43% reach) |
| Software engineer | 65% | 83% | swe4 Java: Java, Spring Boot, Kafka (60% reach) |

Data analyst and Azure/Snowflake data engineering are your strongest lanes. GenAI-RAG, streaming, and Java roles are true low-fit JDs: ApplyForge now warns before you spend an application on them.

## Problems found and fixed

| # | Problem | Evidence | Fix |
|---|---|---|---|
| 1 | Metrics could be moved between roles (a DXC "90%" inside a LAMA bullet) | No ownership on numbers | Every bank metric is tagged with its role; lint blocks cross-role use |
| 2 | Northwest Missouri State had zero metrics, so ML/LLM resumes went number-free where they matter most | Bank analysis: nwmsu 0 | Added real counts already in your record: 4 languages parsed, 3 LLMs, 2 SDKs; ApplyForge: 4 stages, 20-JD suite |
| 3 | Tools listed in Skills with no work behind them (dbt, Terraform, Docker, Lambda, Synapse, Delta Lake, Tableau) could be written into bullets with invented context | 10 unbacked tools | They may appear in Skills only; lint errors if they appear in a bullet |
| 4 | JD tools you have were not guaranteed to appear; JD tools you lack could slip in | No term-level check | Deterministic term map (matched / bridgeable / history-only / gap) attached to every analysis; lint enforces it |
| 5 | Low-fit JDs looked the same as strong ones | ds3 43%, de4 38% reach | Analysis tab shows profile reach and warns below 65% |
| 6 | Forced 15–16 experience bullets pushed irrelevant DXC volume onto AI and SWE resumes | Writing ds3 and swe2 | Experience 13–16, projects 2–3 bullets; allocation decided per JD |
| 7 | Supporting roles had no arc that fit (DXC on an LLM role) | Writing ds3 | Supporting roles use their own discipline's arc and lead with the stage nearest the mandate |
| 8 | **I had added facts you never stated**: Java on EdgeCare; Parquet and SQL on Instacart; "Software Engineer" as an allowed DXC title | Lint flagged "Java" on the swe2 resume | Removed. Your profile now only contains what you have told me |
| 9 | The matcher counted Java as your skill because CodeRepoReader parses Java files; it counted "forecasting" as a gap although you prepared forecasting datasets | Correlation run | Skills come only from your skill list and project stacks; a "history" category allows true mentions without listing them as skills |
| 10 | LinkedIn drafts ran 2–16 characters over 300 | All 3 reference notes | Prompt targets 230–270; code still cuts anything over 300 |

## Reference run (after fixes)

| Measure | Result |
|---|---|
| Role type read correctly | 3/3, including the analyst-titled data engineering trap |
| JD tools you have that appear | 100% |
| Tools you lack that appear | 0 |
| Lint errors | 0 |
| Bullets with a number | 45% |
| Resume text shared between different role families | 9% (LAMA 7%, NWMSU 6%, DXC 15%) |

The last row is the "velocity of change" you asked about: two resumes for different role types share only about 9% of their wording, and your LAMA and Northwest Missouri bullets change almost completely.

## Needs your input (blocks better resumes)

1. **Projects are thin.** Instacart has 1 fact, EdgeCare 1, XAI 1. Every bullet beyond those facts is either invented or flagged. Give 3–4 real details each: data volume, tables, checks, language (Java or Kotlin for EdgeCare?), model used.
2. **Skills you may have but haven't recorded:** Kafka (an older resume version had a Spark/Kafka streaming bullet), pytest or Jest, TypeScript, A/B testing, statistics coursework. If real, add them in Profile; de4, swe1, swe2, and da4 improve immediately.
3. **Titles.** LAMA can show as Data Engineer / Data Analyst / Software Engineer and NWMSU as AI or Data Research Assistant. Titles are checked in background verification; confirm which ones you are comfortable with.

## How to run the real evaluation

```bash
cp .env.example .env        # add OPENAI_API_KEY
npm run eval                # 20 JDs, full pipeline + recruiter judge, about 10 to 15 minutes
open eval/out/report.md
```

The report adds judge scores per dimension, advance rate, recurring problems by section, and the judge's rule suggestions. Bring it back and we fix the rules from it.


---

# Round 2 — Structure update (v2.3)

Changes requested: no Projects section; LAMA Desserts at least 4 bullets; Northwest Missouri 3 to 4; DXC 6 to 8; each JD requirement shown in the role where the work really happened; lifecycle order inside every role; JD wording used where it is true.

| Measure (3 reference resumes, after the change) | Result |
|---|---|
| Lint errors | 0 |
| LAMA Desserts with 4+ bullets | 100% |
| JD requirements visible in their mapped role | 100% |
| Roles in lifecycle order | 100% |
| Tools placed in a role that never used them | 0 |
| Claims of tools you do not have | 0 |
| Wording shared between different role families | 11% (LAMA 6%, NWMSU 5%, DXC 21%) |
| One page in DOCX at 10.5 pt | 3/3 |

What the new checks caught in my own reference writing: an outdated stage name, the weak opener "Writes", and a resume one bullet short of the 15 minimum. All fixed.

Trade-off to know: with Projects gone, tools seen only in personal projects (React, Node.js, Airflow) can appear in Technical Skills but not in bullets. Software and AI resumes lean on LAMA, Northwest Missouri, and DXC alone, and software resumes carry fewer numbers (33% vs the 40% target).
