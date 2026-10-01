import { createOpenAICompatible } from './openaiCompatible.js';
import { createAnthropic } from './anthropic.js';
import { createGemini } from './gemini.js';
import { createMock } from './mock.js';
import { ProviderError } from './http.js';

// Default model catalog. Every list can be overridden with an env var such as
// OPENAI_MODELS="gpt-4o-mini,gpt-4.1" so new models never need a code change.
// `tier` drives the badge in the UI: fast (cheap, quick) or quality (best writing).
const DEFAULT_MODELS = {
  openai: [
    { id: 'gpt-4o-mini', label: 'GPT-4o mini', tier: 'fast' },
    { id: 'gpt-4o', label: 'GPT-4o', tier: 'quality' },
    { id: 'gpt-4.1-mini', label: 'GPT-4.1 mini', tier: 'fast' },
    { id: 'gpt-5-mini', label: 'GPT-5 mini', tier: 'quality' },
  ],
  anthropic: [
    { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', tier: 'fast' },
    { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5', tier: 'quality' },
    { id: 'claude-opus-5-5', label: 'Claude Opus 5.5', tier: 'quality' },
  ],
  gemini: [
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', tier: 'fast' },
    { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite', tier: 'fast' },
    { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', tier: 'quality' },
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B', tier: 'fast' },
    { id: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B', tier: 'quality' },
    { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B', tier: 'fast' },
  ],
  deepseek: [{ id: 'deepseek-chat', label: 'DeepSeek V3', tier: 'quality' }],
  openrouter: [
    { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B', tier: 'fast' },
    { id: 'mistralai/mistral-small-3.2-24b-instruct', label: 'Mistral Small 3.2', tier: 'fast' },
    { id: 'qwen/qwen-2.5-72b-instruct', label: 'Qwen 2.5 72B', tier: 'quality' },
  ],
  ollama: [
    { id: 'llama3.1', label: 'Llama 3.1 (local)', tier: 'fast' },
    { id: 'qwen2.5', label: 'Qwen 2.5 (local)', tier: 'fast' },
  ],
  mock: [{ id: 'mock-writer', label: 'Offline demo writer', tier: 'fast' }],
};

function modelsFromEnv(id, env) {
  const raw = env[`${id.toUpperCase()}_MODELS`];
  if (!raw) return DEFAULT_MODELS[id];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((m) => ({ id: m, label: m, tier: 'custom' }));
}

export function createRegistry(config, env = process.env) {
  const m = (id) => modelsFromEnv(id, env);
  const providers = [
    createOpenAICompatible({
      id: 'openai',
      label: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1',
      models: m('openai'),
      usesCompletionTokens: true,
    }),
    createAnthropic({ models: m('anthropic') }),
    createGemini({ models: m('gemini') }),
    createOpenAICompatible({
      id: 'groq',
      label: 'Groq',
      baseUrl: 'https://api.groq.com/openai/v1',
      models: m('groq'),
    }),
    createOpenAICompatible({
      id: 'deepseek',
      label: 'DeepSeek',
      baseUrl: 'https://api.deepseek.com/v1',
      models: m('deepseek'),
    }),
    createOpenAICompatible({
      id: 'openrouter',
      label: 'OpenRouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      models: m('openrouter'),
      extraHeaders: { 'HTTP-Referer': 'https://github.com/applyforge', 'X-Title': 'ApplyForge' },
    }),
    createOpenAICompatible({
      id: 'ollama',
      label: 'Ollama',
      baseUrl: `${config.ollamaBaseUrl.replace(/\/$/, '')}/v1`,
      models: m('ollama'),
      requiresKey: false,
    }),
  ];
  if (config.enableMock) providers.push(createMock({ models: m('mock') }));

  const byId = new Map(providers.map((p) => [p.id, p]));

  function serverKey(id) {
    if (id === 'mock') return 'mock';
    return config.keys[id] || '';
  }

  /** Public catalog for the UI. Never exposes keys, only whether one is configured. */
  function list() {
    return providers.map((p) => ({
      id: p.id,
      label: p.label,
      models: p.models,
      configured: Boolean(serverKey(p.id)),
      acceptsUserKey: config.allowUserKeys && p.requiresKey,
    }));
  }

  function defaultSelection() {
    const preferred = config.defaultProvider && byId.get(config.defaultProvider);
    const pick = preferred && serverKey(preferred.id) ? preferred : providers.find((p) => serverKey(p.id) && p.id !== 'mock') || byId.get('mock') || providers[0];
    return { provider: pick.id, model: pick.models[0]?.id };
  }

  /**
   * Resolve a provider + model + key for a request.
   * A user-supplied key (header) wins over the server key when allowed.
   */
  function resolve({ provider, model, userKey }) {
    const sel = provider ? { provider, model } : defaultSelection();
    const p = byId.get(sel.provider);
    if (!p) throw new ProviderError(`Unknown provider "${sel.provider}".`, { status: 400, code: 'unknown_provider' });
    const apiKey = (config.allowUserKeys && userKey) || serverKey(p.id);
    if (!apiKey && p.requiresKey) {
      throw new ProviderError(`${p.label} is not configured. Add its API key on the server or paste your own key in Settings.`, {
        status: 400,
        provider: p.label,
        code: 'missing_key',
      });
    }
    const chosenModel = sel.model || p.models[0]?.id;
    if (!chosenModel || !/^[\w.\-/:]{1,120}$/.test(chosenModel)) {
      throw new ProviderError('Model name is not valid.', { status: 400, code: 'invalid_model' });
    }
    return { adapter: p, model: chosenModel, apiKey: apiKey || 'local' };
  }

  return { list, resolve, defaultSelection, get: (id) => byId.get(id) };
}
