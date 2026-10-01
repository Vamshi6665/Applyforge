import { postJson, readSse, safeJson } from './http.js';

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/** Google Gemini adapter (generateContent / streamGenerateContent). */
export function createGemini({ models }) {
  const label = 'Google Gemini';

  function buildBody({ system, messages, maxTokens, temperature, json }) {
    const generationConfig = { maxOutputTokens: maxTokens, temperature };
    if (json) generationConfig.responseMimeType = 'application/json';
    return {
      systemInstruction: { parts: [{ text: system }] },
      contents: messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      generationConfig,
    };
  }

  const usageOf = (meta) => ({
    input: meta?.promptTokenCount ?? 0,
    output: meta?.candidatesTokenCount ?? 0,
    cached: meta?.cachedContentTokenCount ?? 0,
  });

  const textOf = (data) =>
    (data?.candidates?.[0]?.content?.parts || [])
      .filter((p) => !p.thought)
      .map((p) => p.text || '')
      .join('');

  return {
    id: 'gemini',
    label,
    models,
    requiresKey: true,
    async complete(opts) {
      const res = await postJson(`${BASE}/${encodeURIComponent(opts.model)}:generateContent`, {
        headers: { 'x-goog-api-key': opts.apiKey },
        body: buildBody(opts),
        signal: opts.signal,
        provider: label,
      });
      const data = await res.json();
      return { text: textOf(data), usage: usageOf(data.usageMetadata) };
    },
    async *stream(opts) {
      const res = await postJson(`${BASE}/${encodeURIComponent(opts.model)}:streamGenerateContent?alt=sse`, {
        headers: { 'x-goog-api-key': opts.apiKey },
        body: buildBody(opts),
        signal: opts.signal,
        provider: label,
      });
      let last;
      for await (const data of readSse(res)) {
        const evt = safeJson(data);
        if (!evt) continue;
        const t = textOf(evt);
        if (t) yield { type: 'text', text: t };
        if (evt.usageMetadata) last = evt.usageMetadata;
      }
      if (last) yield { type: 'usage', usage: usageOf(last) };
    },
  };
}
