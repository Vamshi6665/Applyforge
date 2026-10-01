import { postJson, readSse, safeJson } from './http.js';

/**
 * One adapter for every OpenAI-compatible chat completions API:
 * OpenAI, Groq, DeepSeek, OpenRouter and Ollama all speak this format.
 */
export function createOpenAICompatible({
  id,
  label,
  baseUrl,
  models,
  supportsJsonMode = true,
  usesCompletionTokens = false,
  extraHeaders = {},
  requiresKey = true,
}) {
  const isReasoningModel = (model) => /^(o\d|gpt-5)/.test(model);

  function buildBody({ system, messages, model, maxTokens, temperature, json, stream }) {
    const body = {
      model,
      messages: [{ role: 'system', content: system }, ...messages],
      stream: Boolean(stream),
    };
    if (usesCompletionTokens) body.max_completion_tokens = maxTokens;
    else body.max_tokens = maxTokens;
    if (!isReasoningModel(model) && typeof temperature === 'number') body.temperature = temperature;
    if (json && supportsJsonMode) body.response_format = { type: 'json_object' };
    if (stream) body.stream_options = { include_usage: true };
    return body;
  }

  function headers(apiKey) {
    const h = { ...extraHeaders };
    if (apiKey && apiKey !== 'local') h.Authorization = `Bearer ${apiKey}`;
    return h;
  }

  return {
    id,
    label,
    models,
    requiresKey,
    async complete(opts) {
      const res = await postJson(`${opts.baseUrl || baseUrl}/chat/completions`, {
        headers: headers(opts.apiKey),
        body: buildBody({ ...opts, stream: false }),
        signal: opts.signal,
        provider: label,
      });
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content ?? '';
      return {
        text,
        usage: {
          input: data?.usage?.prompt_tokens ?? 0,
          output: data?.usage?.completion_tokens ?? 0,
          cached: data?.usage?.prompt_tokens_details?.cached_tokens ?? 0,
        },
      };
    },
    async *stream(opts) {
      const res = await postJson(`${opts.baseUrl || baseUrl}/chat/completions`, {
        headers: headers(opts.apiKey),
        body: buildBody({ ...opts, stream: true }),
        signal: opts.signal,
        provider: label,
      });
      for await (const data of readSse(res)) {
        if (data === '[DONE]') break;
        const evt = safeJson(data);
        if (!evt) continue;
        const delta = evt?.choices?.[0]?.delta?.content;
        if (delta) yield { type: 'text', text: delta };
        if (evt.usage) {
          yield {
            type: 'usage',
            usage: {
              input: evt.usage.prompt_tokens ?? 0,
              output: evt.usage.completion_tokens ?? 0,
              cached: evt.usage.prompt_tokens_details?.cached_tokens ?? 0,
            },
          };
        }
      }
    },
  };
}
