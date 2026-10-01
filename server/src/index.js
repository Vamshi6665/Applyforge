import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Load the repo-root .env (if present) before reading config. Real environment
// variables always win over the file.
const envFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env');
if (fs.existsSync(envFile) && typeof process.loadEnvFile === 'function') process.loadEnvFile(envFile);

const { createApp } = await import('./app.js');
const { loadConfig } = await import('./config.js');

const config = loadConfig();
const app = createApp({ config });

const server = app.listen(config.port, () => {
  console.log(`ApplyForge API listening on http://localhost:${config.port}`);
});

const shutdown = (signal) => {
  console.log(`${signal} received, closing server`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
