import { DEFAULT_PROFILE } from "../../api/_lib/profile.js";

const get = (k, fallback) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};
const set = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};

export const loadProfile = () => get("af.profile", DEFAULT_PROFILE);
export const saveProfile = (p) => set("af.profile", p);
export const resetProfile = () => {
  try { localStorage.removeItem("af.profile"); } catch {}
  return DEFAULT_PROFILE;
};

export const loadSettings = () => get("af.settings", { apiKey: "", model: "gpt-4o" });
export const saveSettings = (s) => set("af.settings", s);

export const loadHistory = () => get("af.history", []);
export function pushHistory(run) {
  const list = [run, ...loadHistory().filter((r) => r.id !== run.id)].slice(0, 20);
  set("af.history", list);
  return list;
}

// ── Learning loop: resumes Vamshi approved become style examples for the same role type ──
export const loadExamples = () => get("af.examples", []);
export function approveExample(ex) {
  // keep the newest 3 per role type, 30 overall
  const rest = loadExamples().filter((e) => e.id !== ex.id);
  const same = rest.filter((e) => e.archetype === ex.archetype).slice(0, 2);
  const others = rest.filter((e) => e.archetype !== ex.archetype);
  const list = [ex, ...same, ...others].slice(0, 30);
  set("af.examples", list);
  return list;
}
export const examplesFor = (archetype, n = 2) =>
  loadExamples()
    .filter((e) => e.archetype === archetype)
    .slice(0, n)
    .map((e) => ({
      role_title: e.title,
      summary: e.resume.summary,
      experience: e.resume.experience.map((x) => ({ company: x.company, title: x.title, bullets: x.bullets.map((b) => `${b.label}: ${b.text}`) })),
    }));

export function setOutcome(runId, outcome) {
  const list = loadHistory().map((r) => (r.id === runId ? { ...r, outcome } : r));
  set("af.history", list);
  return list;
}

// OpenAI fine-tuning chat format: one line per approved example.
export function examplesJsonl() {
  return loadExamples()
    .filter((e) => e.jd && e.analysis)
    .map((e) => JSON.stringify({
      messages: [
        { role: "system", content: "You restructure Vamshi Krishna Balupari's resume for a job description, following the ApplyForge spec. Return the resume JSON." },
        { role: "user", content: `<hiring_brief>\n${JSON.stringify(e.analysis)}\n</hiring_brief>\n\n<job_description>\n${e.jd}\n</job_description>` },
        { role: "assistant", content: JSON.stringify(e.resume) },
      ],
    }))
    .join("\n");
}
