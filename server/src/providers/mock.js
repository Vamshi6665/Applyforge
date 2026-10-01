import { buildTemplateDrafts, templateChatReply } from '../services/templates.js';
import { estimateTokens } from '../services/analyze.js';

/**
 * Offline demo model. Needs no key and no network, so the app can be tried
 * immediately after cloning, and the test suite runs deterministically.
 */
export function createMock({ models }) {
  function produce({ meta = {}, system = '', messages = [] }) {
    if (meta.kind === 'generate') {
      const drafts = buildTemplateDrafts(meta);
      const out = Object.fromEntries(meta.sections.map((s) => [s, drafts[s]]));
      return JSON.stringify(out);
    }
    if (meta.kind === 'chat') return templateChatReply(meta);
    return 'Offline demo model is running.';
  }

  const usage = (system, messages, text) => ({
    input: estimateTokens(system) + messages.reduce((n, m) => n + estimateTokens(m.content), 0),
    output: estimateTokens(text),
    cached: 0,
  });

  return {
    id: 'mock',
    label: 'Offline demo',
    models,
    requiresKey: false,
    async complete(opts) {
      const text = produce(opts);
      return { text, usage: usage(opts.system, opts.messages, text) };
    },
    async *stream(opts) {
      const text = produce(opts);
      const parts = text.match(/\S+\s*|\s+/g) || [];
      for (const part of parts) {
        if (opts.signal?.aborted) return;
        yield { type: 'text', text: part };
        if (opts.streamDelayMs) await new Promise((r) => setTimeout(r, opts.streamDelayMs));
      }
      yield { type: 'usage', usage: usage(opts.system, opts.messages, text) };
    },
  };
}
