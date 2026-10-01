import { vi } from 'vitest';

export const PROFILE = {
  name: 'Test Person',
  firstName: 'Test',
  headline: 'Data Analyst',
  years: '3+',
  education: 'MS Data Science',
  educationShort: 'MS',
  certifications: ['PL-300'],
  certsShort: 'PL-300',
  skills: ['SQL', 'Python'],
  metrics: ['Cut report time by 40%'],
  experience: [{ role: 'Analyst', org: 'Acme', dates: '2022 to 2025', summary: 'Built dashboards.' }],
  goldEmail: 'Hi,\nGold email.',
  goldLinkedin: 'Hi [Name], gold.',
  resumeText: '',
};

export const ANALYSIS = {
  role: 'Data Analyst',
  company: 'Globex',
  keywords: {
    have: [{ term: 'SQL', group: 'Languages', count: 2, matches: ['SQL'] }],
    bridge: [{ term: 'Tableau', group: 'Analytics', count: 1, matches: ['Tableau'], via: ['Power BI'] }],
    gap: [{ term: 'Kubernetes', group: 'Engineering', count: 1, matches: ['Kubernetes'] }],
    score: 58,
  },
  compression: { originalChars: 900, compressedChars: 600, savedTokens: 75, truncated: false },
};

export const MODELS = {
  providers: [
    { id: 'openai', label: 'OpenAI', models: [{ id: 'gpt-4o-mini', label: 'GPT-4o mini', tier: 'fast' }], configured: false, acceptsUserKey: true },
    { id: 'mock', label: 'Offline demo', models: [{ id: 'mock-writer', label: 'Offline demo writer', tier: 'fast' }], configured: true, acceptsUserKey: false },
  ],
  default: { provider: 'mock', model: 'mock-writer' },
};

export const JD_TEXT = `Data Analyst at Globex
We need strong SQL skills and Tableau dashboards. Kubernetes is a plus.
You will partner with finance and operations stakeholders on weekly reporting.`;

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export const sse = (events) =>
  new Response(
    new ReadableStream({
      start(c) {
        const enc = new TextEncoder();
        for (const e of events) c.enqueue(enc.encode(`data: ${JSON.stringify(e)}\n\n`));
        c.close();
      },
    }),
    { status: 200, headers: { 'content-type': 'text/event-stream' } },
  );

export function generateResponse(sections, tone = 'metrics', cached = false) {
  const drafts = {};
  for (const s of sections) drafts[s] = { text: `${tone} ${s} draft. Second sentence.`, quality: { chars: 30, words: 4, issues: [] } };
  return { provider: 'mock', model: 'mock-writer', tone, analysis: ANALYSIS, drafts, cached, usage: cached ? { input: 0, output: 0 } : { input: 1200, output: 300 } };
}

/**
 * Install a fetch mock. `overrides` maps "METHOD /path" to a function
 * (body, init) => Response, so each test can script the server.
 */
export function mockServer(overrides = {}) {
  const calls = [];
  const routes = {
    'GET /api/models': () => json(MODELS),
    'GET /api/profile/default': () => json({ profile: PROFILE }),
    'POST /api/analyze': () => json(ANALYSIS),
    'POST /api/generate': (body) => json(generateResponse(body.sections, body.tone)),
    'POST /api/chat': () =>
      sse([
        { type: 'meta', provider: 'mock', model: 'mock-writer' },
        { type: 'text', text: 'Trimmed it. ' },
        { type: 'text', text: '<draft>short</draft>' },
        { type: 'done', note: 'Trimmed it.', draft: 'metrics email draft.', quality: { issues: [] }, usage: { input: 50, output: 10 } },
      ]),
    ...overrides,
  };
  const fetchMock = vi.fn(async (url, init = {}) => {
    const method = (init.method || 'GET').toUpperCase();
    const key = `${method} ${new URL(url, 'http://localhost').pathname}`;
    const body = init.body ? JSON.parse(init.body) : undefined;
    calls.push({ key, body, headers: init.headers || {} });
    const handler = routes[key];
    if (!handler) return json({ error: 'not found' }, 404);
    return handler(body, init);
  });
  vi.stubGlobal('fetch', fetchMock);
  return { calls, fetchMock, json };
}

export { json };
