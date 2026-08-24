import React, { useState } from "react";

const TABS = [
  { key: "email", label: "Email", hint: "Recruiter / hiring-manager outreach" },
  { key: "linkedin", label: "LinkedIn", hint: "Connect note, under 300 chars" },
  { key: "resume", label: "Resume bullets", hint: "Drop-in, JD-aligned" },
  { key: "coverLetter", label: "Cover letter", hint: "3 short paragraphs, role-specific" },
  { key: "followUp", label: "Follow-up", hint: "Send ~5-7 days after no reply" },
];

export default function App() {
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState("email");
  const [variant, setVariant] = useState("metrics");
  const [copied, setCopied] = useState("");

  async function generate() {
    if (jd.trim().length < 40) {
      setError("Paste a fuller job description so the model has enough to tailor to.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: jd }),
      });
      if (!res.ok) throw new Error("bad status");
      const out = await res.json();
      setResult(out);
      setTab("email");
      setVariant("metrics");
    } catch {
      setError("Generation failed. Check the server is running and try Generate again.");
    } finally {
      setLoading(false);
    }
  }

  function copy(text, key) {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 1500);
  }

  const current = result ? result[tab]?.[variant] || "" : "";

  return (
    <div style={S.page}>
      <style>{CSS}</style>
      <div style={S.wrap}>
        <header style={S.header}>
          <div style={S.mark}>▲ ApplyForge</div>
          <div style={S.tagline}>Paste a job description. Get email, LinkedIn, resume bullets, a cover letter, and a follow-up — tailored to your real profile.</div>
        </header>

        <section style={S.inputCard}>
          <label style={S.label}>Job description</label>
          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Paste the full posting here — title, responsibilities, requirements…"
            style={S.textarea}
          />
          <div style={S.inputRow}>
            <span style={S.count}>{jd.trim().length} chars</span>
            <button onClick={generate} disabled={loading} style={{ ...S.cta, ...(loading ? S.ctaOff : {}) }}>
              {loading ? "Tailoring…" : "Generate"}
            </button>
          </div>
          {error && <div style={S.error}>{error}</div>}
        </section>

        {loading && (
          <div style={S.skeletonWrap}>
            {[0, 1, 2].map((i) => <div key={i} className="af-shimmer" style={S.skeleton} />)}
          </div>
        )}

        {result && !loading && (
          <section style={S.resultCard}>
            <div style={S.tabs}>
              {TABS.map((t) => (
                <button key={t.key} onClick={() => setTab(t.key)} style={{ ...S.tab, ...(tab === t.key ? S.tabActive : {}) }}>
                  {t.label}
                </button>
              ))}
            </div>
            <div style={S.hint}>{TABS.find((t) => t.key === tab)?.hint}</div>

            <div style={S.variantRow}>
              {["metrics", "concise"].map((v) => (
                <button key={v} onClick={() => setVariant(v)} style={{ ...S.chip, ...(variant === v ? S.chipActive : {}) }}>
                  {v === "metrics" ? "Metrics-forward" : "Concise / direct"}
                </button>
              ))}
              <button style={S.copy} onClick={() => copy(current, tab + variant)}>
                {copied === tab + variant ? "Copied ✓" : "Copy"}
              </button>
            </div>

            <pre style={S.output}>{current}</pre>
          </section>
        )}
      </div>
    </div>
  );
}

const CSS = `
  @keyframes afshimmer { 0% { background-position: -400px 0 } 100% { background-position: 400px 0 } }
  .af-shimmer { background: linear-gradient(90deg,#151b2e 25%,#1e2740 50%,#151b2e 75%); background-size: 800px 100%; animation: afshimmer 1.3s infinite linear; }
  textarea:focus, button:focus-visible { outline: 2px solid #6ee7ff; outline-offset: 2px; }
  @media (prefers-reduced-motion: reduce) { .af-shimmer { animation: none } }
`;

const S = {
  page: { minHeight: "100vh", background: "#0a0e1a", color: "#e8ecf5", fontFamily: "'Inter',system-ui,sans-serif", padding: "32px 16px" },
  wrap: { maxWidth: 760, margin: "0 auto" },
  header: { marginBottom: 24 },
  mark: { fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", color: "#6ee7ff" },
  tagline: { marginTop: 6, color: "#9aa7c2", fontSize: 15, lineHeight: 1.5 },
  inputCard: { background: "#111725", border: "1px solid #1f2940", borderRadius: 16, padding: 20 },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#9aa7c2", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" },
  textarea: { width: "100%", minHeight: 160, background: "#0a0e1a", color: "#e8ecf5", border: "1px solid #1f2940", borderRadius: 12, padding: 14, fontSize: 14, lineHeight: 1.6, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" },
  inputRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 },
  count: { fontSize: 12, color: "#5c6a89" },
  cta: { background: "#6ee7ff", color: "#04121a", border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer" },
  ctaOff: { opacity: 0.5, cursor: "wait" },
  error: { marginTop: 12, color: "#ff9db0", fontSize: 14 },
  skeletonWrap: { marginTop: 20, display: "grid", gap: 12 },
  skeleton: { height: 64, borderRadius: 12 },
  resultCard: { marginTop: 20, background: "#111725", border: "1px solid #1f2940", borderRadius: 16, padding: 20 },
  tabs: { display: "flex", gap: 6, background: "#0a0e1a", padding: 5, borderRadius: 12, flexWrap: "wrap" },
  tab: { flex: "1 1 auto", background: "transparent", color: "#9aa7c2", border: "none", borderRadius: 8, padding: "10px 8px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  tabActive: { background: "#1f2940", color: "#fff" },
  hint: { marginTop: 10, fontSize: 13, color: "#5c6a89" },
  variantRow: { display: "flex", alignItems: "center", gap: 8, marginTop: 16, flexWrap: "wrap" },
  chip: { background: "#0a0e1a", color: "#9aa7c2", border: "1px solid #1f2940", borderRadius: 20, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  chipActive: { background: "#6ee7ff", color: "#04121a", borderColor: "#6ee7ff" },
  copy: { marginLeft: "auto", background: "transparent", color: "#6ee7ff", border: "1px solid #6ee7ff", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  output: { marginTop: 16, background: "#0a0e1a", border: "1px solid #1f2940", borderRadius: 12, padding: 16, fontSize: 14, lineHeight: 1.7, color: "#dbe3f4", whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "inherit", margin: "16px 0 0" },
};
