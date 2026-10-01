import { describe, it, expect } from 'vitest';
import { createGenerateService, parseJsonLoose, outputBudget } from '../src/services/generate.js';
import { createChatService } from '../src/services/chat.js';
import { LruCache } from '../src/services/cache.js';
import { JD, PROFILE, scriptedAdapter, fakeRegistry, testConfig } from './fixtures.js';

const setup = (replies) => {
  const adapter = scriptedAdapter(replies);
  const registry = fakeRegistry(adapter);
  const cache = new LruCache();
  const deps = { registry, cache, config: testConfig(), defaultProfile: PROFILE };
  return { adapter, registry, cache, generate: createGenerateService(deps), chat: createChatService(deps) };
};

const base = { jd: JD, sections: ['email', 'linkedin'], tone: 'metrics', fresh: false };
const good = JSON.stringify({ email: 'Hi [Recruiter name],\nI build **pipelines** — fast.\nBest regards,\nVamshi', linkedin: 'Hi [Name], note.' });

describe('parseJsonLoose', () => {
  it('parses clean, fenced and chatty JSON', () => {
    expect(parseJsonLoose('{"a":1}')).toEqual({ a: 1 });
    expect(parseJsonLoose('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(parseJsonLoose('Sure! Here it is: {"a":1} hope this helps')).toEqual({ a: 1 });
  });
  it('returns null for garbage', () => {
    expect(parseJsonLoose('nope')).toBeNull();
    expect(parseJsonLoose('{broken')).toBeNull();
  });
});

describe('outputBudget', () => {
  it('scales with sections and respects the cap', () => {
    expect(outputBudget(['linkedin'], 5000)).toBeLessThan(outputBudget(['linkedin', 'coverLetter'], 5000));
    expect(outputBudget(['email', 'linkedin', 'resume', 'coverLetter', 'followUp'], 1000)).toBe(1000);
  });
});

describe('generate service', () => {
  it('returns cleaned drafts, quality checks and analysis', async () => {
    const { generate, adapter } = setup([good]);
    const r = await generate(base);
    expect(r.drafts.email.text).not.toMatch(/\*\*|—/);
    expect(r.drafts.email.text).toContain('pipelines, fast');
    expect(r.drafts.linkedin.quality.issues).toEqual([]);
    expect(r.analysis.role).toBe('Senior Data Engineer');
    expect(r.cached).toBe(false);
    expect(adapter.calls[0].json).toBe(true);
    expect(adapter.calls[0].meta.kind).toBe('generate');
  });

  it('serves identical requests from cache with zero token usage', async () => {
    const { generate, adapter } = setup([good]);
    await generate(base);
    const second = await generate(base);
    expect(second.cached).toBe(true);
    expect(second.usage).toEqual({ input: 0, output: 0, cached: 0 });
    expect(adapter.calls).toHaveLength(1);
  });

  it('bypasses the cache when fresh is true', async () => {
    const { generate, adapter } = setup([good, good]);
    await generate(base);
    await generate({ ...base, fresh: true });
    expect(adapter.calls).toHaveLength(2);
  });

  it('repairs a broken response once and sums usage', async () => {
    const { generate, adapter } = setup(['not json at all', good]);
    const r = await generate(base);
    expect(adapter.calls).toHaveLength(2);
    expect(adapter.calls[1].messages.at(-1).content).toMatch(/only the JSON/);
    expect(r.usage.input).toBe(200);
  });

  it('fails clearly when the model keeps breaking the format', async () => {
    const { generate } = setup(['bad', '{"email":"only email"}']);
    await expect(generate(base)).rejects.toMatchObject({ code: 'bad_output', status: 502 });
  });

  it('honours role and company overrides', async () => {
    const { generate, adapter } = setup([good]);
    const r = await generate({ ...base, role: 'Staff Analyst', company: 'Globex' });
    expect(r.analysis).toMatchObject({ role: 'Staff Analyst', company: 'Globex' });
    expect(adapter.calls[0].messages[0].content).toMatch(/Role: Staff Analyst\nCompany: Globex/);
  });

  it('uses a custom profile when one is sent', async () => {
    const { generate, adapter } = setup([good]);
    await generate({ ...base, profile: { ...PROFILE, name: 'Jordan Lee', firstName: 'Jordan' } });
    expect(adapter.calls[0].system).toMatch(/Name: Jordan Lee/);
  });

  it('passes the user key to the registry', async () => {
    const { generate, registry } = setup([good]);
    await generate(base, { userKey: 'sk-user' });
    expect(registry.seen[0].userKey).toBe('sk-user');
  });
});

describe('chat service', () => {
  const collect = async (gen) => {
    const out = [];
    for await (const e of gen) out.push(e);
    return out;
  };

  it('streams text and returns a cleaned revised draft', async () => {
    const { chat } = setup(['Shortened it.\n<draft>\nHi — there **friend**\n</draft>']);
    const events = await collect(chat({ message: 'shorter', docType: 'email', draft: 'old', jd: JD, history: [] }));
    expect(events[0]).toMatchObject({ type: 'meta', provider: 'fake' });
    expect(events.filter((e) => e.type === 'text').length).toBeGreaterThan(1);
    const done = events.at(-1);
    expect(done).toMatchObject({ type: 'done', note: 'Shortened it.', draft: 'Hi, there friend' });
    expect(done.quality.issues).toEqual([]);
    expect(done.usage.input).toBe(80);
  });

  it('answers questions without a draft', async () => {
    const { chat } = setup(['Lead with Snowflake.']);
    const done = (await collect(chat({ message: 'what should I emphasize?', docType: 'general', history: [] }))).at(-1);
    expect(done.draft).toBeNull();
    expect(done.note).toBe('Lead with Snowflake.');
  });

  it('only sends a short JD excerpt to save tokens', async () => {
    const { chat, adapter } = setup(['ok']);
    const bigJd = `${JD}\n${'Extra requirement about SQL performance. '.repeat(300)}`;
    await collect(chat({ message: 'hi', docType: 'email', draft: 'd', jd: bigJd, history: [] }));
    const excerpt = adapter.calls[0].system.split('JD EXCERPT:\n')[1].split('\n\nWRITING RULES')[0];
    expect(excerpt.length).toBeLessThanOrEqual(1500);
  });
});
