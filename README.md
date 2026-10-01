# ApplyForge

Paste a job description. ApplyForge marks it up like a highlighter (skills you have, skills you can bridge honestly, real gaps), writes tailored application drafts in your own voice, and gives you a coach you can chat with to refine every line before you send it.

**Stack:** Node.js + Express API, React + Vite frontend, any of 8 model providers.

---

## ✨ What it does

| | |
|---|---|
| 🖍️ **Marked-up job post** | Every keyword is highlighted green (on your profile), yellow (bridged honestly through an adjacent skill, e.g. Airflow via Azure Data Factory) or pink (a real gap that is never claimed). Includes a 0 to 100 match score. Runs locally, costs zero tokens. |
| ✍️ **Five draft types** | Recruiter email, LinkedIn note (300-character ring), resume bullets, cover letter, follow-up email. Pick only the ones you need. |
| 🎚️ **Two tones** | Metrics first or Concise. The second tone is only written when you ask for it. |
| 💬 **Streaming coach** | Chat per draft, CodeRepoReader style. Ask for a change and you get a word-level diff with **Apply** and **Dismiss**. Undo is always one click away. Ask questions (interview prep, how to address gaps) without editing anything. |
| 🧠 **8 providers** | OpenAI, Anthropic, Google Gemini, Groq, DeepSeek, OpenRouter, Ollama (local) and an offline demo writer. Switch models any time, or type any model ID. |
| 🔑 **Bring your own key** | Visitors can paste their own key in Settings. It is sent per request and never stored on the server. |
| 👤 **Multi-user profile** | Name, skills, real metrics, experience, a real email and LinkedIn note for voice, and optional resume text, all editable in the app. |
| 📋 **Application tracker** | Save roles with their drafts, move them through Drafted, Sent, Followed up, Interviewing, Offer, Closed. Follow-ups are flagged 5 days after sending. Export to CSV. |
| 🛡️ **No fabrication** | Hard prompt rules, plus a post-processor that strips markdown bold, em dashes and filler, enforces the LinkedIn limit, and flags problems on each draft. |

## 💸 Token savings

ApplyForge is built to spend as few tokens as possible:

1. **Local keyword analysis.** Gap analysis and highlighting run in Node with a curated keyword library. No model call.
2. **Boilerplate stripping.** Benefits, EEO and legal text is removed from the JD before it is sent. The UI shows how many tokens that saved.
3. **Generate only what you pick.** One document costs one document. Prompts only include the rules for the requested sections, and the gold email sample is left out when no outreach draft is requested.
4. **Output budgets scale with the request** instead of a fixed large `max_tokens`.
5. **Response cache.** Identical requests (same JD, profile, model, sections, tone) are served from an in-memory LRU cache for 0 tokens.
6. **Lean chat context.** Chat sends the current draft, a keyword summary and a 1,500-character JD excerpt, not the whole JD. History is windowed to the last few turns, and older drafts in history are collapsed to a placeholder.
7. **Provider prompt caching.** The Anthropic adapter marks the system prompt with `cache_control`. OpenAI caches long prefixes automatically. Cached tokens are reported.
8. **One repair attempt only** when a model breaks the JSON contract.

## 🚀 Quick start

```bash
git clone https://github.com/<you>/applyforge.git
cd applyforge
npm install
cp .env.example .env      # add any API keys you have (optional)
npm run dev               # API on :8787, app on http://localhost:5173
```

With no keys at all, the app runs on the offline demo writer, so you can try the full flow right away.

Production build on one port:

```bash
npm run build
npm start                 # http://localhost:8787 serves the API and the app
```

## 🧪 Tests

```bash
npm test                  # server + client
npm run test:coverage
```

- **Server (100 tests, Vitest + Supertest):** keyword analysis, role and company detection, JD compression, sanitizer, LRU cache, prompt builders, generate and chat services, every provider adapter (request shape, streaming, error mapping), the registry, and the full HTTP API including SSE streaming, validation, rate limiting and error handling.
- **Client (42 tests, Vitest + Testing Library):** diff, highlighting, SSE client, storage and the main user flows: paste, highlight, generate, cache, edit, rewrite, undo, copy, tone switch, streaming chat with apply, dismiss and stop, errors, your own key, Ctrl+Enter, profile editing, tracker with follow-ups, new job, theme and mobile panes.

CI runs both suites and the build on Node 20 and 22.

## 🔌 Providers

| Provider | Env var | Default models |
|---|---|---|
| OpenAI | `OPENAI_API_KEY` | gpt-4o-mini, gpt-4o, gpt-4.1-mini, gpt-5-mini |
| Anthropic | `ANTHROPIC_API_KEY` | Claude Haiku 4.5, Claude Sonnet 5.5, Claude Opus 5.5 |
| Google Gemini | `GEMINI_API_KEY` | gemini-2.5-flash, gemini-2.5-flash-lite, gemini-2.5-pro |
| Groq | `GROQ_API_KEY` | llama-3.3-70b-versatile, openai/gpt-oss-120b, llama-3.1-8b-instant |
| DeepSeek | `DEEPSEEK_API_KEY` | deepseek-chat |
| OpenRouter | `OPENROUTER_API_KEY` | Llama 3.3 70B, Mistral Small 3.2, Qwen 2.5 72B |
| Ollama (local) | `OLLAMA_BASE_URL` | llama3.1, qwen2.5 |
| Offline demo | none | mock-writer |

Override any list without touching code, for example `OPENAI_MODELS=gpt-4o-mini,gpt-4.1`. Users can also type any model ID in Settings.

## 🏗️ Project layout

```
applyforge/
├── server/                    Node.js + Express API
│   ├── src/
│   │   ├── app.js             routes, security, SSE, static hosting
│   │   ├── config.js          env-driven config
│   │   ├── schemas.js         zod request validation
│   │   ├── providers/         openaiCompatible, anthropic, gemini, mock, registry
│   │   ├── services/          analyze, keywordLibrary, generate, chat, sanitize, cache, templates
│   │   ├── prompts/           defaultProfile, prompt builders
│   │   └── middleware/        error mapping
│   └── tests/
├── client/                    React + Vite app
│   ├── src/
│   │   ├── App.jsx            state and flows
│   │   ├── components/        JobPanel, DraftsPanel, ChatPanel, drawers
│   │   ├── lib/               api (SSE), diff, highlight, storage, format
│   │   └── styles/app.css     design tokens, light and dark
│   └── tests/
├── api/index.js               Vercel serverless entry
├── Dockerfile, docker-compose.yml, vercel.json
└── .github/workflows/ci.yml
```

## 📡 API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Liveness |
| GET | `/api/models` | Providers, models, which are configured, default selection |
| GET | `/api/profile/default` | Starter profile |
| POST | `/api/analyze` | `{ jd, profile? }` returns role, company, keyword buckets, score, compression stats. Zero tokens. |
| POST | `/api/generate` | `{ jd, sections[], tone, profile?, role?, company?, provider?, model?, fresh? }` returns drafts with quality checks and usage |
| POST | `/api/chat` | Server-Sent Events: `meta`, `text` chunks, then `done` with `{ note, draft, quality, usage }` |
| GET | `/api/stats` | Request and token totals, cache stats |

Send `x-provider-key: <key>` to use your own key for a request.

## ☁️ Deploy

**Vercel:** import the repo. `vercel.json` already builds the client and routes `/api/*` to the Express app. Add your keys under Environment Variables.

**Docker:**

```bash
docker compose up --build    # http://localhost:8787
```

**Render, Railway, Fly:** build command `npm ci && npm run build`, start command `npm start`.

Production tips: set `ENABLE_MOCK=false` to hide the demo writer, set `CORS_ORIGIN` to your domain, and tune `RATE_LIMIT_PER_MINUTE`.

## 🔒 Security

Helmet security headers and CSP, per-IP rate limiting, 1 MB body limit, zod validation on every input, request timeouts with client-disconnect cancellation, internal errors never leak details, and API keys are never logged, stored or returned.

## License

MIT
