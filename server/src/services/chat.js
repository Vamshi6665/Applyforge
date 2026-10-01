import { analyzeJob } from './analyze.js';
import { cleanDoc, checkQuality } from './sanitize.js';
import { buildChatMessages, extractDraft } from '../prompts/builders.js';

/**
 * Streaming chat. Yields events the route turns into Server-Sent Events:
 *   { type: 'meta', provider, model }
 *   { type: 'text', text }         one per streamed chunk
 *   { type: 'done', note, draft, quality, usage }
 */
export function createChatService({ registry, config, defaultProfile }) {
  return async function* chat(input, { userKey, signal } = {}) {
    const profile = input.profile || defaultProfile;
    const analysis = input.jd?.trim() ? analyzeJob(input.jd, profile, config.maxJdChars) : null;
    if (analysis && input.role) analysis.role = input.role;
    if (analysis && input.company) analysis.company = input.company;

    const { adapter, model, apiKey } = registry.resolve({ provider: input.provider, model: input.model, userKey });
    const docType = input.docType === 'general' ? null : input.docType;

    const { system, messages } = buildChatMessages({
      profile,
      analysis,
      docType,
      draft: input.draft,
      history: input.history,
      message: input.message,
      maxTurns: config.chatHistoryTurns,
      // Only a short excerpt: the keyword summary already carries the signal.
      jdExcerpt: analysis ? analysis.compressed.text.slice(0, 1500) : '',
    });

    yield { type: 'meta', provider: adapter.id, model };

    let full = '';
    let usage = { input: 0, output: 0, cached: 0 };
    for await (const evt of adapter.stream({
      system,
      messages,
      model,
      apiKey,
      maxTokens: Math.min(config.maxOutputTokens, 1200),
      temperature: 0.5,
      signal,
      streamDelayMs: config.mockStreamDelayMs,
      meta: { kind: 'chat', docType, draft: input.draft, message: input.message, analysis, profile },
    })) {
      if (evt.type === 'text') {
        full += evt.text;
        yield evt;
      } else if (evt.type === 'usage') {
        usage = evt.usage;
      }
    }

    const { note, draft } = extractDraft(full);
    let cleaned = null;
    if (draft && docType) cleaned = cleanDoc(draft, docType);
    yield {
      type: 'done',
      note,
      draft: cleaned,
      quality: cleaned ? checkQuality(cleaned, { type: docType }) : null,
      usage,
    };
  };
}
