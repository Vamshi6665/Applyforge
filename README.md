# ApplyForge — Job Application Copilot

Paste a job description → get five tailored, human-sounding outputs, grounded in your real profile with a strict no-fabrication rule:

- **Email** — recruiter / hiring-manager outreach
- **LinkedIn** — connect note under 300 chars
- **Resume bullets** — drop-in, JD-keyword-aligned
- **Cover letter** — 3 short role-specific paragraphs
- **Follow-up** — polite nudge ~5–7 days after no reply

Each comes in two tone variants (Metrics-forward / Concise) with one-click copy.

## Stack
- **Frontend:** React + Vite
- **Backend:** Vercel serverless function (`/api/generate`) using the **OpenAI SDK** — the API key stays server-side, never shipped to the browser.

## Run locally
```bash
npm install
cp .env.example .env        # add your OPENAI_API_KEY
npm i -g vercel             # once
vercel dev                  # runs frontend + /api together on :3000
```
Or run the frontend alone with `npm run dev` (Vite proxies `/api` to `vercel dev`).

## Deploy to Vercel
1. Push this folder to a GitHub repo.
2. Import it in Vercel.
3. Add env var **OPENAI_API_KEY** in Project Settings → Environment Variables.
4. Deploy. Vercel auto-detects the Vite build and the `/api` function.

## Reuse for a different person
Edit `api/_profile.js` — replace `PROFILE`. Everything else stays the same.

## Swap OpenAI → Claude
In `api/generate.js`, replace the OpenAI client with an Anthropic call to
`api.anthropic.com/v1/messages`; keep the same system prompt and JSON contract.
