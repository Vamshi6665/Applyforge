import OpenAI from "openai";
import { DEFAULT_PROFILE } from "./profile.js";

export function client(req) {
  const apiKey = req.headers["x-openai-key"] || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const e = new Error("No OpenAI API key. Set OPENAI_API_KEY on the server or add a key in Settings.");
    e.status = 401;
    throw e;
  }
  return new OpenAI({ apiKey });
}

export function modelFor(req) {
  return req.headers["x-openai-model"] || process.env.OPENAI_MODEL || "gpt-4o";
}

export async function structured(req, { system, user, schema, temperature = 0.4 }) {
  const openai = client(req);
  const r = await openai.chat.completions.create({
    model: modelFor(req),
    temperature,
    response_format: { type: "json_schema", json_schema: schema },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  const msg = r.choices[0].message;
  if (msg.refusal) throw Object.assign(new Error(msg.refusal), { status: 422 });
  return JSON.parse(msg.content);
}

export async function text(req, { system, user, temperature = 0.3 }) {
  const openai = client(req);
  const r = await openai.chat.completions.create({
    model: modelFor(req),
    temperature,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  return r.choices[0].message.content.trim();
}

export const profileOf = (body) => (body && body.profile && body.profile.experience ? body.profile : DEFAULT_PROFILE);

export const block = (title, value) =>
  `<${title}>\n${typeof value === "string" ? value : JSON.stringify(value, null, 1)}\n</${title}>`;

export function route(fn) {
  return async (req, res) => {
    if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
      res.status(200).json(await fn(req, body));
    } catch (e) {
      console.error(e);
      res.status(e.status || 500).json({ error: e.message || "Generation failed" });
    }
  };
}
