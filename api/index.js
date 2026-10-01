// Vercel serverless entry. Vercel routes /api/* here (see vercel.json) and the
// same Express app used locally handles the request.
import { createApp } from '../server/src/app.js';

const app = createApp();
export default app;
