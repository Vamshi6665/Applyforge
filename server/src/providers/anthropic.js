import { postJson, readSse, safeJson } from './http.js';

const API = 'https://api.anthropic.com/v1/messages';

/**
 * Anthropic Messages API adapter.
 * The system prompt is marked with cache_control so repeated requests reuse the
 * cached profile + rules block and are billed at the much cheaper cached rate.
 */
export function createAnthropic({ models }) {
  const label = 'Anthropic';

  function buildBody({ system, messages, model, maxTokens, temperature, stream }) {
    return {
      model,
      max_tokens: maxTokens,
      temperature,
      stream: Boolean(stream),
      system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
      messages: messages.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
    };
  }

  const headers = (apiKey) => ({ 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' });

  return {
    id: 'anthropic',
    label,
    models,
    requiresKey: true,
    async complete(opts) {
      const res = await postJson(API, {
        headers: headers(opts.apiKey),
        body: buildBody(opts),
        signal: opts.signal,
        provider: label,
      });
      const data = await res.json();
      const text = (data?.content || [])
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('');
      return {
        text,
        usage: {
          input: (data?.usage?.input_tokens ?? 0) + (data?.usage?.cache_read_input_tokens ?? 0),
          output: data?.usage?.output_tokens ?? 0,
          cached: data?.usage?.cache_read_input_tokens ?? 0,
        },
      };
    },
    async *stream(opts) {
      const res = await postJson(API, {
        headers: headers(opts.apiKey),
        body: buildBody({ ...opts, stream: true }),
        signal: opts.signal,
        provider: label,
      });
      let input = 0;
      let cached = 0;
      for await (const data of readSse(res)) {
        const evt = safeJson(data);
        if (!evt) continue;
        if (evt.type === 'message_start') {
          cached = evt.message?.usage?.cache_read_input_tokens ?? 0;
          input = (evt.message?.usage?.input_tokens ?? 0) + cached;
        } else if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
          yield { type: 'text', text: evt.delta.text };
        } else if (evt.type === 'message_delta' && evt.usage) {
          yield { type: 'usage', usage: { input, output: evt.usage.output_tokens ?? 0, cached } };
        } else if (evt.type === 'error') {
          throw new Error(evt.error?.message || 'Anthropic stream error');
        }
      }
    },
  };
}
