// Small HTTP helpers shared by every provider adapter.
// We talk to model APIs with plain fetch so there are no heavy SDK dependencies
// and every provider can be swapped or mocked the same way.

export class ProviderError extends Error {
  constructor(message, { status = 502, provider = 'unknown', code = 'provider_error' } = {}) {
    super(message);
    this.name = 'ProviderError';
    this.status = status;
    this.provider = provider;
    this.code = code;
  }
}

/** Map an upstream HTTP failure to a clear, user-facing error. */
export async function toProviderError(res, provider) {
  let detail = '';
  try {
    const body = await res.text();
    try {
      const parsed = JSON.parse(body);
      detail = parsed?.error?.message || parsed?.message || body;
    } catch {
      detail = body;
    }
  } catch {
    /* ignore */
  }
  detail = String(detail || '').slice(0, 300);

  if (res.status === 401 || res.status === 403) {
    return new ProviderError(`The ${provider} API key was rejected. Check the key and try again.`, {
      status: 401,
      provider,
      code: 'invalid_key',
    });
  }
  if (res.status === 429) {
    return new ProviderError(`${provider} is rate limiting requests. Wait a moment or switch models.`, {
      status: 429,
      provider,
      code: 'rate_limited',
    });
  }
  if (res.status === 404) {
    return new ProviderError(`${provider} could not find that model. ${detail}`.trim(), {
      status: 400,
      provider,
      code: 'model_not_found',
    });
  }
  return new ProviderError(`${provider} returned ${res.status}. ${detail}`.trim(), {
    status: 502,
    provider,
  });
}

export async function postJson(url, { headers = {}, body, signal, provider }) {
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err?.name === 'AbortError' || err?.name === 'TimeoutError') throw err;
    throw new ProviderError(`Could not reach ${provider}: ${err.message}`, { status: 502, provider, code: 'network' });
  }
  if (!res.ok) throw await toProviderError(res, provider);
  return res;
}

/**
 * Parse a Server-Sent Events byte stream into individual `data:` payloads.
 * Works for OpenAI, Anthropic and Gemini streaming formats.
 */
export async function* readSse(res) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buffer.search(/\r?\n\r?\n/)) !== -1) {
        const rawEvent = buffer.slice(0, idx);
        buffer = buffer.slice(idx).replace(/^\r?\n\r?\n/, '');
        const data = rawEvent
          .split(/\r?\n/)
          .filter((l) => l.startsWith('data:'))
          .map((l) => l.slice(5).trimStart())
          .join('\n');
        if (data) yield data;
      }
    }
    const tail = buffer
      .split(/\r?\n/)
      .filter((l) => l.startsWith('data:'))
      .map((l) => l.slice(5).trimStart())
      .join('\n');
    if (tail) yield tail;
  } finally {
    reader.releaseLock?.();
  }
}

/** Read newline-delimited JSON (used by Ollama's native API, kept for completeness). */
export function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
