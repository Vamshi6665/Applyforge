import { describe, it, expect, vi, afterEach } from 'vitest';
import { createOpenAICompatible } from '../src/providers/openaiCompatible.js';
import { createAnthropic } from '../src/providers/anthropic.js';
import { createGemini } from '../src/providers/gemini.js';
import { createMock } from '../src/providers/mock.js';
import { createRegistry } from '../src/providers/index.js';
import { readSse, ProviderError } from '../src/providers/http.js';
import { analyzeJob } from '../src/services/analyze.js';
import { JD, PROFILE, testConfig } from './fixtures.js';

const sseResponse = (chunks) =>
  new Response(
    new ReadableStream({
      start(c) {
        const enc = new TextEncoder();
        chunks.forEach((x) => c.enqueue(enc.encode(x)));
        c.close();
      },
    }),
    { status: 200, headers: { 'content-type': 'text/event-stream' } },
  );

const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const collect = async (gen) => {
  const out = [];
  for await (const e of gen) out.push(e);
  return out;
};

afterEach(() => vi.restoreAllMocks());

const base = { system: 'sys', messages: [{ role: 'user', content: 'hi' }], maxTokens: 100, temperature: 0.5, apiKey: 'k' };

describe('readSse', () => {
  it('reassembles events split across chunks', async () => {
    const res = sseResponse(['data: {"a":', '1}\n\ndata: {"b":2}\n', '\ndata: [DONE]\n\n']);
    expect(await collect(readSse(res))).toEqual(['{"a":1}', '{"b":2}', '[DONE]']);
  });
});

describe('OpenAI-compatible adapter', () => {
  const openai = createOpenAICompatible({ id: 'openai', label: 'OpenAI', baseUrl: 'https://x/v1', models: [], usesCompletionTokens: true });

  it('sends a correct request and reads usage', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ choices: [{ message: { content: 'hello' } }], usage: { prompt_tokens: 10, completion_tokens: 3 } }),
    );
    const r = await openai.complete({ ...base, model: 'gpt-4o-mini', json: true });
    expect(r).toEqual({ text: 'hello', usage: { input: 10, output: 3, cached: 0 } });
    const [url, init] = spy.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(url).toBe('https://x/v1/chat/completions');
    expect(init.headers.Authorization).toBe('Bearer k');
    expect(body.messages[0]).toEqual({ role: 'system', content: 'sys' });
    expect(body.response_format).toEqual({ type: 'json_object' });
    expect(body.max_completion_tokens).toBe(100);
    expect(body.temperature).toBe(0.5);
  });

  it('omits temperature for reasoning models', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ choices: [{ message: { content: '' } }] }));
    await openai.complete({ ...base, model: 'gpt-5-mini' });
    expect(JSON.parse(spy.mock.calls[0][1].body).temperature).toBeUndefined();
  });

  it('streams deltas and the final usage', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      sseResponse([
        'data: {"choices":[{"delta":{"content":"Hel"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"lo"}}]}\n\n',
        'data: {"choices":[],"usage":{"prompt_tokens":5,"completion_tokens":2}}\n\n',
        'data: [DONE]\n\n',
      ]),
    );
    const events = await collect(openai.stream({ ...base, model: 'gpt-4o' }));
    expect(events.filter((e) => e.type === 'text').map((e) => e.text).join('')).toBe('Hello');
    expect(events.at(-1)).toEqual({ type: 'usage', usage: { input: 5, output: 2, cached: 0 } });
  });

  it('maps auth, rate limit and missing model errors', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    fetchSpy.mockResolvedValueOnce(jsonResponse({ error: { message: 'bad key' } }, 401));
    await expect(openai.complete({ ...base, model: 'm' })).rejects.toMatchObject({ code: 'invalid_key', status: 401 });
    fetchSpy.mockResolvedValueOnce(jsonResponse({}, 429));
    await expect(openai.complete({ ...base, model: 'm' })).rejects.toMatchObject({ code: 'rate_limited', status: 429 });
    fetchSpy.mockResolvedValueOnce(jsonResponse({ error: { message: 'no such model' } }, 404));
    await expect(openai.complete({ ...base, model: 'm' })).rejects.toMatchObject({ code: 'model_not_found' });
    fetchSpy.mockResolvedValueOnce(new Response('boom', { status: 500 }));
    await expect(openai.complete({ ...base, model: 'm' })).rejects.toBeInstanceOf(ProviderError);
  });

  it('reports network failures', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('fetch failed'));
    await expect(openai.complete({ ...base, model: 'm' })).rejects.toMatchObject({ code: 'network' });
  });

  it('does not send an auth header for local Ollama', async () => {
    const ollama = createOpenAICompatible({ id: 'ollama', label: 'Ollama', baseUrl: 'http://l/v1', models: [], requiresKey: false });
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ choices: [{ message: { content: 'x' } }] }));
    await ollama.complete({ ...base, apiKey: 'local', model: 'llama3.1' });
    expect(spy.mock.calls[0][1].headers.Authorization).toBeUndefined();
    expect(JSON.parse(spy.mock.calls[0][1].body).max_tokens).toBe(100);
  });
});

describe('Anthropic adapter', () => {
  const anthropic = createAnthropic({ models: [] });

  it('caches the system prompt and reads text blocks', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ content: [{ type: 'text', text: 'Hi' }], usage: { input_tokens: 4, output_tokens: 2, cache_read_input_tokens: 6 } }),
    );
    const r = await anthropic.complete({ ...base, model: 'claude-haiku-4-5-20251001' });
    const init = spy.mock.calls[0][1];
    const body = JSON.parse(init.body);
    expect(init.headers['x-api-key']).toBe('k');
    expect(body.system[0].cache_control).toEqual({ type: 'ephemeral' });
    expect(r).toEqual({ text: 'Hi', usage: { input: 10, output: 2, cached: 6 } });
  });

  it('streams text deltas and usage', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      sseResponse([
        'event: message_start\ndata: {"type":"message_start","message":{"usage":{"input_tokens":7}}}\n\n',
        'event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Yo"}}\n\n',
        'event: message_delta\ndata: {"type":"message_delta","usage":{"output_tokens":3}}\n\n',
      ]),
    );
    const events = await collect(anthropic.stream({ ...base, model: 'claude-sonnet-5-5' }));
    expect(events).toEqual([
      { type: 'text', text: 'Yo' },
      { type: 'usage', usage: { input: 7, output: 3, cached: 0 } },
    ]);
  });
});

describe('Gemini adapter', () => {
  const gemini = createGemini({ models: [] });

  it('maps roles and JSON mode', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ candidates: [{ content: { parts: [{ text: '{}' }] } }], usageMetadata: { promptTokenCount: 3, candidatesTokenCount: 1 } }),
    );
    const r = await gemini.complete({ ...base, model: 'gemini-2.5-flash', json: true, messages: [{ role: 'assistant', content: 'a' }] });
    const [url, init] = spy.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(url).toMatch(/gemini-2\.5-flash:generateContent$/);
    expect(init.headers['x-goog-api-key']).toBe('k');
    expect(body.contents[0].role).toBe('model');
    expect(body.generationConfig.responseMimeType).toBe('application/json');
    expect(r.usage).toEqual({ input: 3, output: 1, cached: 0 });
  });

  it('streams via SSE and skips thought parts', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      sseResponse([
        'data: {"candidates":[{"content":{"parts":[{"text":"hmm","thought":true},{"text":"A"}]}}]}\n\n',
        'data: {"candidates":[{"content":{"parts":[{"text":"B"}]}}],"usageMetadata":{"promptTokenCount":2,"candidatesTokenCount":2}}\n\n',
      ]),
    );
    const events = await collect(gemini.stream({ ...base, model: 'gemini-2.5-pro' }));
    expect(events.map((e) => e.text || e.type)).toEqual(['A', 'B', 'usage']);
  });
});

describe('Mock provider', () => {
  const mock = createMock({ models: [] });
  const analysis = analyzeJob(JD, PROFILE, 12000);

  it('produces valid JSON for exactly the requested sections', async () => {
    const r = await mock.complete({ system: '', messages: [], meta: { kind: 'generate', profile: PROFILE, analysis, sections: ['email', 'resume'], tone: 'metrics' } });
    expect(Object.keys(JSON.parse(r.text))).toEqual(['email', 'resume']);
    expect(r.usage.output).toBeGreaterThan(0);
  });

  it('applies a demo edit in chat', async () => {
    const events = await collect(
      mock.stream({ system: '', messages: [], meta: { kind: 'chat', docType: 'email', draft: 'One. Two. Three. Four.', message: 'make it shorter', analysis, profile: PROFILE } }),
    );
    const text = events.filter((e) => e.type === 'text').map((e) => e.text).join('');
    expect(text).toMatch(/<draft>\nOne\. Two\.\n<\/draft>/);
  });

  it('answers questions in chat without editing', async () => {
    const events = await collect(mock.stream({ system: '', messages: [], meta: { kind: 'chat', message: 'what to emphasize?', analysis, profile: PROFILE } }));
    expect(events.map((e) => e.text || '').join('')).not.toMatch(/<draft>/);
  });
});

describe('registry', () => {
  it('lists providers without leaking keys', () => {
    const reg = createRegistry(testConfig({ keys: { ...testConfig().keys, openai: 'sk-secret' } }), {});
    const json = JSON.stringify(reg.list());
    expect(json).not.toContain('sk-secret');
    expect(reg.list().find((p) => p.id === 'openai').configured).toBe(true);
    expect(reg.list().find((p) => p.id === 'anthropic').configured).toBe(false);
  });

  it('defaults to a configured real provider, else the offline demo', () => {
    expect(createRegistry(testConfig(), {}).defaultSelection().provider).toBe('mock');
    const reg = createRegistry(testConfig({ keys: { ...testConfig().keys, groq: 'g' } }), {});
    expect(reg.defaultSelection().provider).toBe('groq');
  });

  it('resolves user keys, rejects missing keys, unknown providers and bad model names', () => {
    const reg = createRegistry(testConfig(), {});
    expect(reg.resolve({ provider: 'openai', model: 'gpt-4o', userKey: 'sk-u' }).apiKey).toBe('sk-u');
    expect(() => reg.resolve({ provider: 'openai' })).toThrow(/not configured/);
    expect(() => reg.resolve({ provider: 'nope' })).toThrow(/Unknown provider/);
    expect(() => reg.resolve({ provider: 'mock', model: 'bad model!' })).toThrow(/not valid/);
  });

  it('ignores user keys when the server disallows them', () => {
    const reg = createRegistry(testConfig({ allowUserKeys: false }), {});
    expect(() => reg.resolve({ provider: 'openai', userKey: 'sk-u' })).toThrow(/not configured/);
  });

  it('accepts model lists from env', () => {
    const reg = createRegistry(testConfig(), { OPENAI_MODELS: 'gpt-x, gpt-y' });
    expect(reg.list().find((p) => p.id === 'openai').models.map((m) => m.id)).toEqual(['gpt-x', 'gpt-y']);
  });

  it('can disable the offline demo', () => {
    const reg = createRegistry(testConfig({ enableMock: false }), {});
    expect(reg.list().some((p) => p.id === 'mock')).toBe(false);
  });
});
