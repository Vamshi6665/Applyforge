import { DEFAULT_PROFILE } from '../src/prompts/defaultProfile.js';

export const PROFILE = DEFAULT_PROFILE;

export const JD = `Senior Data Engineer
Acme Analytics is hiring a Senior Data Engineer to build scalable ETL pipelines on Snowflake and BigQuery.

Requirements:
- 4+ years with SQL and Python, Spark, Airflow, dbt
- Experience with Kafka streaming and Kubernetes a plus
- Power BI or Tableau dashboards for stakeholders
- Experience with FHIR or HL7 healthcare data is a plus

Benefits:
- 401(k) match
- Dental and vision insurance

We are an equal opportunity employer and value diversity.`;

/** Build a fake provider adapter whose replies are scripted per call. */
export function scriptedAdapter(replies, { id = 'fake', label = 'Fake' } = {}) {
  const calls = [];
  let i = 0;
  const next = () => replies[Math.min(i++, replies.length - 1)];
  return {
    id,
    label,
    models: [{ id: 'fake-1', label: 'Fake 1', tier: 'fast' }],
    requiresKey: false,
    calls,
    async complete(opts) {
      calls.push(opts);
      const r = next();
      if (r instanceof Error) throw r;
      return { text: r, usage: { input: 100, output: 50, cached: 0 } };
    },
    async *stream(opts) {
      calls.push(opts);
      const r = next();
      if (r instanceof Error) throw r;
      for (const part of r.match(/\S+\s*/g) || []) yield { type: 'text', text: part };
      yield { type: 'usage', usage: { input: 80, output: 20, cached: 0 } };
    },
  };
}

export function fakeRegistry(adapter) {
  const seen = [];
  return {
    seen,
    list: () => [{ id: adapter.id, label: adapter.label, models: adapter.models, configured: true, acceptsUserKey: true }],
    defaultSelection: () => ({ provider: adapter.id, model: 'fake-1' }),
    resolve: (sel) => {
      seen.push(sel);
      return { adapter, model: sel.model || 'fake-1', apiKey: sel.userKey || 'server-key' };
    },
  };
}

export const testConfig = (overrides = {}) => ({
  env: 'test',
  port: 0,
  corsOrigin: '*',
  maxJdChars: 12000,
  maxOutputTokens: 2200,
  chatHistoryTurns: 6,
  cacheTtlMs: 60_000,
  cacheMaxEntries: 50,
  rateLimitPerMinute: 1000,
  requestTimeoutMs: 10_000,
  allowUserKeys: true,
  defaultProvider: '',
  keys: { openai: '', anthropic: '', gemini: '', groq: '', deepseek: '', openrouter: '', ollama: '' },
  ollamaBaseUrl: 'http://localhost:11434',
  enableMock: true,
  mockStreamDelayMs: 0,
  staticDir: '/nonexistent',
  ...overrides,
});

/** Parse an SSE response body into event objects. */
export const parseSse = (text) =>
  text
    .split('\n\n')
    .map((c) => c.trim())
    .filter((c) => c.startsWith('data:'))
    .map((c) => JSON.parse(c.slice(5).trim()));
