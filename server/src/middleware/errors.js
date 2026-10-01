import { ZodError } from 'zod';
import { ProviderError } from '../providers/http.js';

export function toHttpError(err) {
  if (err instanceof ZodError) {
    const first = err.issues[0];
    const field = first?.path?.join('.');
    return {
      status: 400,
      body: { error: first?.message || 'Invalid request.', code: 'invalid_request', field: field || undefined },
    };
  }
  if (err instanceof ProviderError) {
    return { status: err.status, body: { error: err.message, code: err.code, provider: err.provider } };
  }
  if (err?.name === 'TimeoutError') {
    return { status: 504, body: { error: 'The model took too long to respond. Try a faster model.', code: 'timeout' } };
  }
  if (err?.name === 'AbortError') {
    return { status: 499, body: { error: 'Request was cancelled.', code: 'cancelled' } };
  }
  if (err?.type === 'entity.too.large') {
    return { status: 413, body: { error: 'Request is too large.', code: 'too_large' } };
  }
  if (err?.type === 'entity.parse.failed') {
    return { status: 400, body: { error: 'Request body is not valid JSON.', code: 'bad_json' } };
  }
  return { status: 500, body: { error: 'Something went wrong on the server.', code: 'internal' } };
}

// Express recognises error handlers by their four arguments.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const { status, body } = toHttpError(err);
  if (status >= 500 && process.env.NODE_ENV !== 'test') console.error('[applyforge]', err);
  if (res.headersSent) return res.end();
  res.status(status).json(body);
}

export function notFound(req, res) {
  res.status(404).json({ error: `No route for ${req.method} ${req.path}`, code: 'not_found' });
}
