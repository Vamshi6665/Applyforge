# ApplyForge — Job Application Copilot

Upload your resume and a sample email **once**. Paste any job description → get five tailored, human-sounding outputs, then **chat to refine** them.

Outputs (each in two tone variants — Metrics-forward / Concise, one-click copy):
- **Email** — opens with who you are (current status + background), *then* the role pitch
- **LinkedIn** — connect note under 300 chars
- **Resume bullets** — drop-in, JD-keyword-aligned
- **Cover letter** — 3 short role-specific paragraphs
- **Follow-up** — polite nudge ~5–7 days after no reply

### How it learns your voice
Your sample resume + sample email are saved in your browser (localStorage) and sent with every request. The model mirrors *their* tone and structure instead of a generic template. Strict no-fabrication rule: it never claims a skill you don't have — it bridges from adjacent real experience.

### Chat refinement
After generating, type changes like "make the email shorter" or "add my SHAP research to the bullets." It revises all five outputs in place, keeping the rest intact.

## Stack
- **Frontend:** React + Vite
- **Backend:** Vercel serverless function (`/api/generate`, `generate` + `revise` modes) using the **OpenAI SDK**. Key stays server-side.

## Run locally
```bash
npm install
cp .env.example .env        # add your OPENAI_API_KEY
npm i -g vercel
vercel dev                  # frontend + /api on :3000
```

## Deploy to Vercel
1. Push this folder to a GitHub repo (make sure `package.json` is at the repo root — set Root Directory to this folder if it's nested).
2. Import in Vercel.
3. Add env var **OPENAI_API_KEY** in Project Settings → Environment Variables.
4. Deploy.

## Reuse for a different person
Edit `PROFILE` in `api/_profile.js`. Everything else stays the same.

## Swap OpenAI → Claude
In `api/generate.js`, replace the OpenAI client with an Anthropic call to `api.anthropic.com/v1/messages`; keep the same system prompt and JSON contract.
