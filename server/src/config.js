// Central runtime configuration. Everything comes from environment variables
// so the same build runs locally, in Docker, on Render or on Vercel.

const num = (v, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export function loadConfig(env = process.env) {
  return {
    env: env.NODE_ENV || 'development',
    port: num(env.PORT, 8787),
    corsOrigin: env.CORS_ORIGIN || '*',
    // Token budget controls
    maxJdChars: num(env.MAX_JD_CHARS, 12000),
    maxOutputTokens: num(env.MAX_OUTPUT_TOKENS, 2200),
    chatHistoryTurns: num(env.CHAT_HISTORY_TURNS, 6),
    cacheTtlMs: num(env.CACHE_TTL_MS, 1000 * 60 * 60 * 6),
    cacheMaxEntries: num(env.CACHE_MAX_ENTRIES, 200),
    // Abuse protection
    rateLimitPerMinute: num(env.RATE_LIMIT_PER_MINUTE, 30),
    requestTimeoutMs: num(env.REQUEST_TIMEOUT_MS, 90000),
    // Allow visitors to bring their own key (sent per request, never stored)
    allowUserKeys: env.ALLOW_USER_KEYS !== 'false',
    defaultProvider: env.DEFAULT_PROVIDER || '',
    keys: {
      openai: env.OPENAI_API_KEY || '',
      anthropic: env.ANTHROPIC_API_KEY || '',
      gemini: env.GEMINI_API_KEY || env.GOOGLE_API_KEY || '',
      groq: env.GROQ_API_KEY || '',
      deepseek: env.DEEPSEEK_API_KEY || '',
      openrouter: env.OPENROUTER_API_KEY || '',
      ollama: env.OLLAMA_BASE_URL ? 'local' : '',
    },
    ollamaBaseUrl: env.OLLAMA_BASE_URL || 'http://localhost:11434',
    enableMock: env.ENABLE_MOCK !== 'false',
    mockStreamDelayMs: Number(env.MOCK_STREAM_DELAY_MS ?? 12) || 0,
    staticDir: env.STATIC_DIR || '',
  };
}
