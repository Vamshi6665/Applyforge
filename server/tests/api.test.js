import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { JD, testConfig, parseSse, scriptedAdapter, fakeRegistry } from './fixtures.js';

const app = createApp({ config: testConfig(), env: {} });

describe('meta endpoints', () => {
  it('GET /api/health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('GET /api/models lists every provider with a default', async () => {
    const res = await request(app).get('/api/models');
    const ids = res.body.providers.map((p) => p.id);
    expect(ids).toEqual(['openai', 'anthropic', 'gemini', 'groq', 'deepseek', 'openrouter', 'ollama', 'mock']);
    expect(res.body.default).toEqual({ provider: 'mock', model: 'mock-writer' });
  });

  it('GET /api/profile/default and /api/sections', async () => {
    expect((await request(app).get('/api/profile/default')).body.profile.name).toBe('Vamshi Krishna Balupari');
    expect((await request(app).get('/api/sections')).body.sections).toHaveLength(5);
  });

  it('sets security headers', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('returns JSON 404s', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('not_found');
  });
});

describe('POST /api/analyze', () => {
  it('analyzes without calling a model', async () => {
    const res = await request(app).post('/api/analyze').send({ jd: JD });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('Senior Data Engineer');
    expect(res.body.keywords.gap.map((k) => k.term)).toContain('Kubernetes');
    expect(res.body.compression.savedTokens).toBeGreaterThan(0);
  });

  it('accepts an empty JD', async () => {
    const res = await request(app).post('/api/analyze').send({});
    expect(res.status).toBe(200);
    expect(res.body.keywords.score).toBe(0);
  });
});

describe('POST /api/generate', () => {
  it('generates drafts end to end with the offline model', async () => {
    const res = await request(app)
      .post('/api/generate')
      .send({ jd: JD, sections: ['email', 'linkedin', 'resume', 'coverLetter', 'followUp'] });
    expect(res.status).toBe(200);
    expect(Object.keys(res.body.drafts)).toEqual(['email', 'linkedin', 'resume', 'coverLetter', 'followUp']);
    expect(res.body.drafts.email.text).toMatch(/Senior Data Engineer opportunity at Acme Analytics/);
    expect(res.body.drafts.linkedin.text.length).toBeLessThanOrEqual(300);
    expect(res.body.drafts.resume.text.split('\n').every((l) => l.startsWith('- '))).toBe(true);
    for (const d of Object.values(res.body.drafts)) expect(d.text).not.toMatch(/—|\*\*/);
  });

  it('second identical request is cached', async () => {
    const body = { jd: `${JD}\nCache probe.`, sections: ['linkedin'] };
    await request(app).post('/api/generate').send(body);
    const res = await request(app).post('/api/generate').send(body);
    expect(res.body.cached).toBe(true);
    expect(res.body.usage.input).toBe(0);
    const stats = await request(app).get('/api/stats');
    expect(stats.body.cachedResponses).toBeGreaterThanOrEqual(1);
  });

  it('validates the job description length', async () => {
    const res = await request(app).post('/api/generate').send({ jd: 'too short' });
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ code: 'invalid_request', field: 'jd' });
    expect(res.body.error).toMatch(/too short/);
  });

  it('validates sections and tone', async () => {
    expect((await request(app).post('/api/generate').send({ jd: JD, sections: ['poem'] })).status).toBe(400);
    expect((await request(app).post('/api/generate').send({ jd: JD, sections: [] })).body.error).toMatch(/at least one/);
    expect((await request(app).post('/api/generate').send({ jd: JD, tone: 'loud' })).status).toBe(400);
  });

  it('explains when a provider has no key', async () => {
    const res = await request(app).post('/api/generate').send({ jd: JD, provider: 'openai', model: 'gpt-4o-mini' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('missing_key');
  });

  it('rejects malformed JSON bodies', async () => {
    const res = await request(app).post('/api/generate').set('content-type', 'application/json').send('{"jd":');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('bad_json');
  });

  it('validates a custom profile', async () => {
    const res = await request(app).post('/api/generate').send({ jd: JD, profile: { name: '', headline: 'x' } });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/name is required/);
  });

  it('forwards a per-request key header to the provider', async () => {
    const adapter = scriptedAdapter([JSON.stringify({ email: 'Hi there,\nBody.\nBest regards,\nV' })]);
    const registry = fakeRegistry(adapter);
    const custom = createApp({ config: testConfig(), registry });
    const res = await request(custom).post('/api/generate').set('x-provider-key', 'sk-mine').send({ jd: JD, sections: ['email'] });
    expect(res.status).toBe(200);
    expect(registry.seen[0].userKey).toBe('sk-mine');
  });

  it('maps upstream provider failures to clear errors', async () => {
    const { ProviderError } = await import('../src/providers/http.js');
    const adapter = scriptedAdapter([new ProviderError('The OpenAI API key was rejected.', { status: 401, code: 'invalid_key' })]);
    const custom = createApp({ config: testConfig(), registry: fakeRegistry(adapter) });
    const res = await request(custom).post('/api/generate').send({ jd: JD });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('invalid_key');
  });

  it('hides unexpected internal errors', async () => {
    const adapter = scriptedAdapter([new Error('secret stack detail')]);
    const custom = createApp({ config: testConfig(), registry: fakeRegistry(adapter) });
    const res = await request(custom).post('/api/generate').send({ jd: JD });
    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain('secret');
  });

  it('rate limits bursts', async () => {
    const limited = createApp({ config: testConfig({ rateLimitPerMinute: 2 }), env: {} });
    const body = { jd: JD, sections: ['linkedin'] };
    await request(limited).post('/api/generate').send(body);
    await request(limited).post('/api/generate').send(body);
    const res = await request(limited).post('/api/generate').send(body);
    expect(res.status).toBe(429);
    expect(res.body.code).toBe('rate_limited');
  });
});

describe('POST /api/chat (streaming)', () => {
  it('streams meta, text and a done event with the revised draft', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'make it shorter', docType: 'email', draft: 'One. Two. Three.\nBest regards,', jd: JD });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/event-stream/);
    const events = parseSse(res.text);
    expect(events[0]).toMatchObject({ type: 'meta', provider: 'mock' });
    expect(events.some((e) => e.type === 'text')).toBe(true);
    const done = events.at(-1);
    expect(done.type).toBe('done');
    expect(done.draft).toBe('One. Two.\nBest regards,');
  });

  it('answers general questions without a draft', async () => {
    const res = await request(app).post('/api/chat').send({ message: 'What should I highlight?', jd: JD });
    const done = parseSse(res.text).at(-1);
    expect(done.draft).toBeNull();
    expect(done.note).toMatch(/Offline demo/);
  });

  it('returns a JSON error before streaming when configuration is wrong', async () => {
    const res = await request(app).post('/api/chat').send({ message: 'hi', provider: 'anthropic' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('missing_key');
  });

  it('validates the message', async () => {
    const res = await request(app).post('/api/chat').send({ message: '   ' });
    expect(res.status).toBe(400);
  });

  it('reports mid-stream failures as an error event', async () => {
    const adapter = scriptedAdapter(['ok']);
    adapter.stream = async function* () {
      yield { type: 'text', text: 'partial ' };
      throw new Error('upstream dropped');
    };
    const custom = createApp({ config: testConfig(), registry: fakeRegistry(adapter) });
    const res = await request(custom).post('/api/chat').send({ message: 'hi' });
    const events = parseSse(res.text);
    expect(events.at(-1)).toMatchObject({ type: 'error', code: 'internal' });
  });

  it('sends compacted history to the model', async () => {
    const adapter = scriptedAdapter(['fine']);
    const custom = createApp({ config: testConfig({ chatHistoryTurns: 1 }), registry: fakeRegistry(adapter) });
    const history = [
      { role: 'user', content: 'first' },
      { role: 'assistant', content: 'a <draft>OLD DRAFT</draft>' },
      { role: 'user', content: 'second' },
      { role: 'assistant', content: 'b <draft>NEWER DRAFT</draft>' },
    ];
    await request(custom).post('/api/chat').send({ message: 'third', docType: 'email', draft: 'cur', history });
    const sent = adapter.calls[0].messages;
    expect(sent.map((m) => m.content)).toEqual(['second', 'b [revised draft shown to user]', 'third']);
  });
});
