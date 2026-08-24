import React, { useState, useEffect, useRef } from "react";

const TABS = [
  { key: "email", label: "Email", hint: "3 paragraphs: intro + role, experience match, forward-looking close" },
  { key: "linkedin", label: "LinkedIn", hint: "Connect note, under 300 chars" },
  { key: "resume", label: "Resume bullets", hint: "Drop-in, JD-aligned, keywords woven in" },
  { key: "coverLetter", label: "Cover letter", hint: "3 short paragraphs, role-specific" },
  { key: "followUp", label: "Follow-up", hint: "Send ~5-7 days after no reply" },
];

const LS = { resume: "af_sample_resume", email: "af_sample_email", linkedin: "af_sample_linkedin" };

export default function App() {
  const [sampleResume, setSampleResume] = useState("");
  const [sampleEmail, setSampleEmail] = useState("");
  const [sampleLinkedin, setSampleLinkedin] = useState("");
  const [samplesOpen, setSamplesOpen] = useState(false);
  const [savedNote, setSavedNote] = useState("");

  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState("email");
  const [variant, setVariant] = useState("metrics");
  const [copied, setCopied] = useState("");

  const [chat, setChat] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    setSampleResume(localStorage.getItem(LS.resume) || "");
    setSampleEmail(localStorage.getItem(LS.email) || "");
    setSampleLinkedin(localStorage.getItem(LS.linkedin) || "");
    const has = localStorage.getItem(LS.resume) || localStorage.getItem(LS.email) || localStorage.getItem(LS.linkedin);
    setSamplesOpen(!has);
  }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat, loading]);

  function saveSamples() {
    localStorage.setItem(LS.resume, sampleResume);
    localStorage.setItem(LS.email, sampleEmail);
    localStorage.setItem(LS.linkedin, sampleLinkedin);
    setSavedNote("Saved ✓");
    setTimeout(() => setSavedNote(""), 1500);
    setSamplesOpen(false);
  }

  async function generate() {
    if (jd.trim().length < 40) { setError("Paste a fuller job description so the model has enough to tailor to."); return; }
    setError(""); setLoading(true); setResult(null); setChat([]);
    try {
      const res = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "generate", jobDescription: jd, sampleResume, sampleEmail, sampleLinkedin }),
      });
      if (!res.ok) throw new Error("bad status");
      const out = await res.json();
      setResult(out); setTab("email"); setVariant("metrics");
      setChat([{ role: "bot", text: "Here are your tailored outputs, with a keyword match against your resume up top. Want changes? Tell me — e.g. \"shorten the email\" or \"work Airflow into the bullets.\"" }]);
    } catch { setError("Generation failed. Check the server is running and try Generate again."); }
    finally { setLoading(false); }
  }

  async function sendRevision() {
    const instruction = chatInput.trim();
    if (!instruction || !result) return;
    setChatInput(""); setChat((c) => [...c, { role: "user", text: instruction }]); setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "revise", current: result, instruction, sampleResume, sampleEmail, sampleLinkedin }),
      });
      if (!res.ok) throw new Error("bad status");
      const out = await res.json();
      setResult(out); setChat((c) => [...c, { role: "bot", text: "Done, updated. Check the tabs above. Anything else?" }]);
    } catch { setChat((c) => [...c, { role: "bot", text: "That revision failed, try rephrasing or send it again." }]); }
    finally { setLoading(false); }
  }

  function copy(text, key) { navigator.clipboard?.writeText(text); setCopied(key); setTimeout(() => setCopied(""), 1500); }

  const current = result ? result[tab]?.[variant] || "" : "";
  const hasSamples = sampleResume.trim() || sampleEmail.trim() || sampleLinkedin.trim();
  const kw = result?.keywords;

  return (
    <div style={S.page}>
      <style>{CSS}</style>
      <div style={S.wrap}>
        <header style={S.header}>
          <div style={S.mark}>▲ ApplyForge</div>
          <div style={S.tagline}>Set up your samples once. Paste any job description. Get keyword-matched, human-sounding outputs, then chat to refine.</div>
        </header>

        <section style={S.card}>
          <button style={S.discBtn} onClick={() => setSamplesOpen((o) => !o)}>
            <span>Your samples {hasSamples ? "" : "(set these up first)"}</span>
            <span style={S.discState}>{samplesOpen ? "Hide" : hasSamples ? "Edit" : "Open"}</span>
          </button>
          {samplesOpen && (
            <div style={{ marginTop: 14 }}>
              <div style={S.subtle}>Stored in your browser, reused every time. These teach the app your voice and structure.</div>
              <label style={S.label}>Sample resume</label>
              <textarea value={sampleResume} onChange={(e) => setSampleResume(e.target.value)} placeholder="Paste your resume text…" style={{ ...S.textarea, minHeight: 110 }} />
              <label style={{ ...S.label, marginTop: 14 }}>Sample email</label>
              <textarea value={sampleEmail} onChange={(e) => setSampleEmail(e.target.value)} placeholder="Paste an outreach email whose tone you want to mirror…" style={{ ...S.textarea, minHeight: 110 }} />
              <label style={{ ...S.label, marginTop: 14 }}>Sample LinkedIn connect message</label>
              <textarea value={sampleLinkedin} onChange={(e) => setSampleLinkedin(e.target.value)} placeholder="Paste your real LinkedIn connect message…" style={{ ...S.textarea, minHeight: 90 }} />
              <div style={S.inputRow}><span style={S.count}>{savedNote}</span><button onClick={saveSamples} style={S.cta}>Save samples</button></div>
            </div>
          )}
        </section>

        <section style={{ ...S.card, marginTop: 16 }}>
          <label style={S.label}>Job description</label>
          <textarea value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste the full posting here…" style={S.textarea} />
          <div style={S.inputRow}>
            <span style={S.count}>{jd.trim().length} chars</span>
            <button onClick={generate} disabled={loading} style={{ ...S.cta, ...(loading ? S.ctaOff : {}) }}>{loading && !result ? "Tailoring…" : "Generate"}</button>
          </div>
          {error && <div style={S.error}>{error}</div>}
        </section>

        {loading && !result && <div style={S.skeletonWrap}>{[0, 1, 2].map((i) => <div key={i} className="af-shimmer" style={S.skeleton} />)}</div>}

        {/* KEYWORD MATCH */}
        {kw && (
          <section style={{ ...S.card, marginTop: 16 }}>
            <div style={S.label}>Keyword match vs your resume</div>
            <div style={S.kwGroup}>
              <div style={S.kwHead}><span style={{ ...S.dot, background: "#3fd68c" }} />Already covered</div>
              <div style={S.kwWrap}>{(kw.have || []).map((k, i) => <span key={i} style={{ ...S.tag, ...S.tagHave }}>{k}</span>)}</div>
            </div>
            <div style={S.kwGroup}>
              <div style={S.kwHead}><span style={{ ...S.dot, background: "#6ee7ff" }} />Relevant, woven in automatically</div>
              <div style={S.kwWrap}>{(kw.relevantMissing || []).map((k, i) => <span key={i} style={{ ...S.tag, ...S.tagRel }}>{k}</span>)}</div>
            </div>
            <div style={S.kwGroup}>
              <div style={S.kwHead}><span style={{ ...S.dot, background: "#ffb454" }} />Different — flagged, NOT added (your call)</div>
              <div style={S.kwWrap}>{(kw.differentMissing || []).length ? (kw.differentMissing || []).map((k, i) => <span key={i} style={{ ...S.tag, ...S.tagDiff }}>{k}</span>) : <span style={S.count}>None — your profile covers the JD well.</span>}</div>
              {(kw.differentMissing || []).length > 0 && <div style={S.flagNote}>These aren't in your background. To include any, tell the chat below how you actually relate to it, and it'll add it honestly.</div>}
            </div>
          </section>
        )}

        {/* RESULTS */}
        {result && (
          <section style={{ ...S.card, marginTop: 16 }}>
            <div style={S.tabs}>{TABS.map((t) => <button key={t.key} onClick={() => setTab(t.key)} style={{ ...S.tab, ...(tab === t.key ? S.tabActive : {}) }}>{t.label}</button>)}</div>
            <div style={S.hint}>{TABS.find((t) => t.key === tab)?.hint}</div>
            <div style={S.variantRow}>
              {["metrics", "concise"].map((v) => <button key={v} onClick={() => setVariant(v)} style={{ ...S.chip, ...(variant === v ? S.chipActive : {}) }}>{v === "metrics" ? "Metrics-forward" : "Concise / direct"}</button>)}
              <button style={S.copy} onClick={() => copy(current, tab + variant)}>{copied === tab + variant ? "Copied ✓" : "Copy"}</button>
            </div>
            <pre style={S.output}>{current}</pre>
          </section>
        )}

        {/* CHAT */}
        {result && (
          <section style={{ ...S.card, marginTop: 16 }}>
            <div style={S.label}>Refine by chat</div>
            <div style={S.chatBox}>
              {chat.map((m, i) => <div key={i} style={{ ...S.bubble, ...(m.role === "user" ? S.bubbleUser : S.bubbleBot) }}>{m.text}</div>)}
              {loading && result && <div style={{ ...S.bubble, ...S.bubbleBot }}>Revising…</div>}
              <div ref={chatEndRef} />
            </div>
            <div style={S.chatInputRow}>
              <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendRevision()} placeholder='e.g. "shorten the email" or "add my SHAP research to the bullets"' style={S.chatInput} />
              <button onClick={sendRevision} disabled={loading} style={{ ...S.cta, ...(loading ? S.ctaOff : {}) }}>Send</button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

const CSS = `
  @keyframes afshimmer { 0% { background-position: -400px 0 } 100% { background-position: 400px 0 } }
  .af-shimmer { background: linear-gradient(90deg,#151b2e 25%,#1e2740 50%,#151b2e 75%); background-size: 800px 100%; animation: afshimmer 1.3s infinite linear; }
  textarea:focus, input:focus, button:focus-visible { outline: 2px solid #6ee7ff; outline-offset: 2px; }
  @media (prefers-reduced-motion: reduce) { .af-shimmer { animation: none } }
`;

const S = {
  page: { minHeight: "100vh", background: "#0a0e1a", color: "#e8ecf5", fontFamily: "'Inter',system-ui,sans-serif", padding: "32px 16px" },
  wrap: { maxWidth: 760, margin: "0 auto" },
  header: { marginBottom: 24 },
  mark: { fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", color: "#6ee7ff" },
  tagline: { marginTop: 6, color: "#9aa7c2", fontSize: 15, lineHeight: 1.5 },
  card: { background: "#111725", border: "1px solid #1f2940", borderRadius: 16, padding: 20 },
  discBtn: { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "transparent", border: "none", color: "#e8ecf5", fontSize: 15, fontWeight: 700, cursor: "pointer", padding: 0 },
  discState: { color: "#6ee7ff", fontSize: 13, fontWeight: 600 },
  subtle: { fontSize: 13, color: "#5c6a89", marginBottom: 14, lineHeight: 1.5 },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#9aa7c2", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" },
  textarea: { width: "100%", minHeight: 150, background: "#0a0e1a", color: "#e8ecf5", border: "1px solid #1f2940", borderRadius: 12, padding: 14, fontSize: 14, lineHeight: 1.6, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" },
  inputRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 },
  count: { fontSize: 12, color: "#5c6a89" },
  cta: { background: "#6ee7ff", color: "#04121a", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 15, fontWeight: 700, cursor: "pointer" },
  ctaOff: { opacity: 0.5, cursor: "wait" },
  error: { marginTop: 12, color: "#ff9db0", fontSize: 14 },
  skeletonWrap: { marginTop: 16, display: "grid", gap: 12 },
  skeleton: { height: 64, borderRadius: 12 },
  kwGroup: { marginTop: 14 },
  kwHead: { display: "flex", alignItems: "center", fontSize: 13, fontWeight: 600, color: "#9aa7c2", marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: "50%", marginRight: 8, display: "inline-block" },
  kwWrap: { display: "flex", flexWrap: "wrap", gap: 6 },
  tag: { fontSize: 12, fontWeight: 600, padding: "5px 10px", borderRadius: 8, border: "1px solid" },
  tagHave: { background: "rgba(63,214,140,0.1)", color: "#3fd68c", borderColor: "rgba(63,214,140,0.3)" },
  tagRel: { background: "rgba(110,231,255,0.1)", color: "#6ee7ff", borderColor: "rgba(110,231,255,0.3)" },
  tagDiff: { background: "rgba(255,180,84,0.1)", color: "#ffb454", borderColor: "rgba(255,180,84,0.3)" },
  flagNote: { marginTop: 10, fontSize: 12, color: "#8a7a5c", lineHeight: 1.5 },
  tabs: { display: "flex", gap: 6, background: "#0a0e1a", padding: 5, borderRadius: 12, flexWrap: "wrap" },
  tab: { flex: "1 1 auto", background: "transparent", color: "#9aa7c2", border: "none", borderRadius: 8, padding: "10px 8px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  tabActive: { background: "#1f2940", color: "#fff" },
  hint: { marginTop: 10, fontSize: 13, color: "#5c6a89" },
  variantRow: { display: "flex", alignItems: "center", gap: 8, marginTop: 16, flexWrap: "wrap" },
  chip: { background: "#0a0e1a", color: "#9aa7c2", border: "1px solid #1f2940", borderRadius: 20, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  chipActive: { background: "#6ee7ff", color: "#04121a", borderColor: "#6ee7ff" },
  copy: { marginLeft: "auto", background: "transparent", color: "#6ee7ff", border: "1px solid #6ee7ff", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  output: { marginTop: 16, background: "#0a0e1a", border: "1px solid #1f2940", borderRadius: 12, padding: 16, fontSize: 14, lineHeight: 1.7, color: "#dbe3f4", whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "inherit" },
  chatBox: { marginTop: 12, background: "#0a0e1a", border: "1px solid #1f2940", borderRadius: 12, padding: 14, maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 },
  bubble: { maxWidth: "85%", padding: "10px 14px", borderRadius: 14, fontSize: 14, lineHeight: 1.5 },
  bubbleBot: { background: "#1f2940", color: "#dbe3f4", alignSelf: "flex-start", borderBottomLeftRadius: 4 },
  bubbleUser: { background: "#6ee7ff", color: "#04121a", alignSelf: "flex-end", borderBottomRightRadius: 4, fontWeight: 600 },
  chatInputRow: { display: "flex", gap: 8, marginTop: 12 },
  chatInput: { flex: 1, background: "#0a0e1a", color: "#e8ecf5", border: "1px solid #1f2940", borderRadius: 10, padding: "12px 14px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" },
};
