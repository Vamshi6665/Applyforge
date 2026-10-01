// Thin API client. All requests go to the same origin (/api), proxied by Vite in dev.

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'error' } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

const headersFor = (key) => {
  const h = { 'Content-Type': 'application/json' };
  if (key) h['x-provider-key'] = key;
  return h;
};

async function readError(res) {
  let body = {};
  try {
    body = await res.json();
  } catch {
    /* not JSON */
  }
  return new ApiError(body.error || `Request failed (${res.status}).`, { status: res.status, code: body.code });
}

export async function request(path, { method = 'GET', body, key, signal } = {}) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: headersFor(key),
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new ApiError('Could not reach the ApplyForge server. Is it running?', { code: 'network' });
  }
  if (!res.ok) throw await readError(res);
  return res.json();
}

/** Split an SSE buffer into complete data payloads plus the unfinished remainder. */
export function splitSse(buffer) {
  const events = [];
  const parts = buffer.split(/\r?\n\r?\n/);
  const rest = parts.pop() ?? '';
  for (const part of parts) {
    const data = part
      .split(/\r?\n/)
      .filter((l) => l.startsWith('data:'))
      .map((l) => l.slice(5).trimStart())
      .join('\n');
    if (!data) continue;
    try {
      events.push(JSON.parse(data));
    } catch {
      /* ignore partial or non-JSON frames */
    }
  }
  return { events, rest };
}

/** POST /api/chat and call onEvent for each streamed event. */
export async function streamChat(body, { key, signal, onEvent }) {
  let res;
  try {
    res = await fetch('/api/chat', { method: 'POST', headers: headersFor(key), body: JSON.stringify(body), signal });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new ApiError('Could not reach the ApplyForge server. Is it running?', { code: 'network' });
  }
  if (!res.ok) throw await readError(res);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const { events, rest } = splitSse(buffer);
    buffer = rest;
    for (const evt of events) {
      if (evt.type === 'error') throw new ApiError(evt.error || 'The model stopped unexpectedly.', { code: evt.code });
      onEvent(evt);
    }
  }
  const { events } = splitSse(`${buffer}\n\n`);
  for (const evt of events) {
    if (evt.type === 'error') throw new ApiError(evt.error || 'The model stopped unexpectedly.', { code: evt.code });
    onEvent(evt);
  }
}

export const api = {
  models: () => request('/models'),
  defaultProfile: () => request('/profile/default'),
  analyze: (body, opts) => request('/analyze', { method: 'POST', body, ...opts }),
  generate: (body, opts) => request('/generate', { method: 'POST', body, ...opts }),
};
