import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadConfig } from './config.js';
import { createRegistry } from './providers/index.js';
import { LruCache } from './services/cache.js';
import { createGenerateService } from './services/generate.js';
import { createChatService } from './services/chat.js';
import { analyzeJob } from './services/analyze.js';
import { publicAnalysis } from './services/generate.js';
import { DEFAULT_PROFILE } from './prompts/defaultProfile.js';
import { SECTIONS, SECTION_LABELS } from './prompts/builders.js';
import { analyzeSchema, chatSchema, generateSchema } from './schemas.js';
import { errorHandler, notFound, toHttpError } from './middleware/errors.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Build the Express app. Everything is injectable so tests can pass a custom
 * config, registry or env without touching real model APIs.
 */
export function createApp({ config = loadConfig(), env = process.env, registry, cache } = {}) {
  registry ||= createRegistry(config, env);
  cache ||= new LruCache({ max: config.cacheMaxEntries, ttlMs: config.cacheTtlMs });
  const deps = { registry, cache, config, defaultProfile: DEFAULT_PROFILE };
  const generate = createGenerateService(deps);
  const chat = createChatService(deps);
  const totals = { requests: 0, inputTokens: 0, outputTokens: 0, cachedResponses: 0 };

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
        },
      },
    }),
  );
  app.use(cors({ origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(',') }));
  app.use(compression({ filter: (req, res) => !req.path.startsWith('/api/chat') && compression.filter(req, res) }));
  app.use(express.json({ limit: '1mb' }));

  const limiter = rateLimit({
    windowMs: 60_000,
    limit: config.rateLimitPerMinute,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many requests. Wait a minute and try again.', code: 'rate_limited' },
  });

  const userKey = (req) => {
    const k = req.get('x-provider-key');
    return k && k.length < 400 ? k.trim() : undefined;
  };

  const withTimeout = (req, res) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new DOMException('timeout', 'TimeoutError')), config.requestTimeoutMs);
    res.on('close', () => {
      clearTimeout(timer);
      if (!res.writableFinished) controller.abort(new DOMException('client closed', 'AbortError'));
    });
    return controller.signal;
  };

  // --- API ------------------------------------------------------------------
  const api = express.Router();

  api.get('/health', (req, res) => {
    res.json({ ok: true, version: '2.0.0', uptime: Math.round(process.uptime()) });
  });

  api.get('/models', (req, res) => {
    res.json({ providers: registry.list(), default: registry.defaultSelection() });
  });

  api.get('/profile/default', (req, res) => res.json({ profile: DEFAULT_PROFILE }));

  api.get('/sections', (req, res) => res.json({ sections: SECTIONS.map((id) => ({ id, label: SECTION_LABELS[id] })) }));

  api.get('/stats', (req, res) => res.json({ ...totals, cache: cache.stats() }));

  // Zero-token analysis: runs locally, used for live keyword highlighting.
  api.post('/analyze', (req, res) => {
    const input = analyzeSchema.parse(req.body ?? {});
    const analysis = analyzeJob(input.jd, input.profile || DEFAULT_PROFILE, config.maxJdChars);
    res.json(publicAnalysis(analysis));
  });

  api.post('/generate', limiter, async (req, res) => {
    const input = generateSchema.parse(req.body ?? {});
    const result = await generate(input, { userKey: userKey(req), signal: withTimeout(req, res) });
    totals.requests += 1;
    totals.inputTokens += result.usage.input;
    totals.outputTokens += result.usage.output;
    if (result.cached) totals.cachedResponses += 1;
    res.json(result);
  });

  api.post('/chat', limiter, async (req, res) => {
    const input = chatSchema.parse(req.body ?? {});
    const signal = withTimeout(req, res);
    const iterator = chat(input, { userKey: userKey(req), signal });

    // Resolve the first event before switching to SSE, so configuration
    // errors (missing key, bad model) still come back as normal JSON errors.
    const first = await iterator.next();

    res.status(200);
    res.set({
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders?.();
    const send = (evt) => res.write(`data: ${JSON.stringify(evt)}\n\n`);

    try {
      if (!first.done) send(first.value);
      for await (const evt of iterator) {
        send(evt);
        if (evt.type === 'done') {
          totals.requests += 1;
          totals.inputTokens += evt.usage.input;
          totals.outputTokens += evt.usage.output;
        }
      }
    } catch (err) {
      if (!res.writableEnded) send({ type: 'error', ...toHttpError(err).body });
    } finally {
      if (!res.writableEnded) res.end();
    }
  });

  app.use('/api', api);
  app.use('/api', notFound);

  // --- Static client (production) -------------------------------------------
  const staticDir = config.staticDir || path.resolve(__dirname, '../../client/dist');
  if (fs.existsSync(path.join(staticDir, 'index.html'))) {
    app.use(express.static(staticDir, { maxAge: '1h', index: false }));
    app.get(/^(?!\/api\/).*/, (req, res) => res.sendFile(path.join(staticDir, 'index.html')));
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
