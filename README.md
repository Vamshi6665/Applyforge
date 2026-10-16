# ApplyForge v2 — Personalized Resume Forge

Paste a job description. ApplyForge analyzes what the role actually is, restructures Vamshi's whole resume around it, runs a technical review, and writes the recruiter email and LinkedIn note.

Behavior is defined in **[SPEC.md](./SPEC.md)**. Prompts live in `api/_lib/prompts.js`, facts in `api/_lib/profile.js`, quality rules in `api/_lib/lint.js`.

## Pipeline

```
JD ─▶ /api/analyze ─▶ /api/resume ─▶ /api/review ─▶ /api/outreach
      role brief       full rewrite    lint + critic    email + LinkedIn (≤300)
```

## Run locally

```bash
npm install
cp .env.example .env      # add OPENAI_API_KEY
npm run dev               # http://localhost:5173 (API runs inside Vite)
npm test                  # lint and export tests
```

## Deploy (Vercel)

1. Replace the contents of your existing repo with this folder and push.
2. In Vercel → Project → Settings → Environment Variables, set `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`).
3. Redeploy. Framework preset: Vite. Functions in `/api` run as serverless endpoints.

## Evaluate and improve

```bash
npm run eval:correlate    # model-free: how well your profile covers 20 test JDs
npm run eval:reference    # score saved reference outputs (no API key needed)
npm run eval              # full pipeline + recruiter judge on 20 JDs (needs OPENAI_API_KEY)
```

Results land in `eval/out/report.md`. Round 1 findings are in [eval/FINDINGS.md](./eval/FINDINGS.md).

## Using it

- **Forge application** runs all four stages. The Role Analysis tab fills first.
- **Resume tab**: click any bullet or the summary to edit; type a change request in the revise bar; Download DOCX or Save as PDF (one Letter page, auto-fit 10.5 to 9.5 pt).
- **Quality panel** shows spec violations, stretched claims to prepare for, and metric ideas.
- **Stretch mode** allows close-equivalent JD tools; each one is listed for review.
- **Profile** edits the master facts and the metrics bank (saved in your browser).
- **History** keeps your last 20 runs; mark each with an outcome.
- **Approve as example** saves the final resume (with your edits) as a style example for that role type; future runs of the same role type follow it.
- **Export fine-tuning data** (History) downloads approved examples as OpenAI JSONL.
- The **Analysis** tab shows profile reach (tools you have / close equivalents / history-only / gaps) and warns on low-fit JDs.
