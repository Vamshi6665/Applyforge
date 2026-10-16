import { loadSettings } from "./store.js";

export async function call(stage, payload) {
  const s = loadSettings();
  const headers = { "Content-Type": "application/json" };
  if (s.apiKey) headers["x-openai-key"] = s.apiKey;
  if (s.model) headers["x-openai-model"] = s.model;
  const r = await fetch(`/api/${stage}`, { method: "POST", headers, body: JSON.stringify(payload) });
  let data;
  try {
    data = await r.json();
  } catch {
    throw new Error(`${stage}: server returned ${r.status}`);
  }
  if (!r.ok) throw new Error(data.error || `${stage} failed (${r.status})`);
  return data;
}
