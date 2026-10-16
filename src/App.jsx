import React, { useMemo, useState } from "react";
import ResumeDoc, { resumeToText } from "./components/ResumeDoc.jsx";
import { call } from "./lib/api.js";
const downloadDocx = async (...a) => (await import("./lib/exportDocx.js")).downloadDocx(...a);
import { lintResume } from "../api/_lib/lint.js";
import { loadProfile, saveProfile, resetProfile, loadSettings, saveSettings, loadHistory, pushHistory, loadExamples, approveExample, examplesFor, setOutcome, examplesJsonl } from "./lib/store.js";

const STAGES = [
  ["analyze", "Analyze role"],
  ["resume", "Restructure resume"],
  ["review", "Technical review"],
  ["outreach", "Email and LinkedIn"],
];

const ARCH_LABEL = {
  data_analyst_bi: "Data Analyst / BI",
  data_engineer: "Data Engineer",
  analytics_engineer: "Analytics Engineer",
  data_scientist_ml: "Data Scientist / ML",
  ml_llm_engineer: "AI / LLM Engineer",
  software_engineer: "Software Engineer",
  business_analyst: "Business Analyst",
  product_analyst: "Product Analyst",
  other: "Other",
};

function copy(text, setToast) {
  navigator.clipboard.writeText(text).then(() => setToast("Copied"), () => setToast("Copy failed"));
}

export default function App() {
  const [profile, setProfile] = useState(loadProfile);
  const [jd, setJd] = useState("");
  const [company, setCompany] = useState("");
  const [recipient, setRecipient] = useState("");
  const [stretch, setStretch] = useState(false);
  const [status, setStatus] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [resume, setResume] = useState(null);
  const [outreach, setOutreach] = useState(null);
  const [tab, setTab] = useState("analysis");
  const [fit, setFit] = useState({ size: 10.5, overflow: false });
  const [revision, setRevision] = useState("");
  const [history, setHistory] = useState(loadHistory);
  const [modal, setModal] = useState(null);
  const [runId, setRunId] = useState(null);
  const [examples, setExamples] = useState(loadExamples);
  const [toast, setToastRaw] = useState("");
  const setToast = (t) => { setToastRaw(t); setTimeout(() => setToastRaw(""), 1600); };

  const issues = useMemo(() => (resume ? lintResume(resume, profile, { stretch, analysis }) : []), [resume, profile, stretch, analysis]);
  const base = { jd, profile, stretch };

  async function stage(name, fn) {
    setStatus((s) => ({ ...s, [name]: "run" }));
    try {
      const r = await fn();
      setStatus((s) => ({ ...s, [name]: "done" }));
      return r;
    } catch (e) {
      setStatus((s) => ({ ...s, [name]: "fail" }));
      throw e;
    }
  }

  async function forge() {
    setBusy(true); setError(""); setStatus({}); setAnalysis(null); setResume(null); setOutreach(null); setTab("analysis");
    try {
      const { analysis: a } = await stage("analyze", () => call("analyze", base));
      setAnalysis(a);
      const draft = await stage("resume", () => call("resume", { ...base, analysis: a, examples: examplesFor(a.archetype) }));
      setResume(draft.resume); setTab("resume");
      const reviewed = await stage("review", () => call("review", { ...base, analysis: a, resume: draft.resume }));
      setResume(reviewed.resume);
      const o = await stage("outreach", () => call("outreach", { ...base, analysis: a, resume: reviewed.resume, recipient, company: company || a.company }));
      setOutreach(o);
      const id = Date.now();
      setRunId(id);
      setHistory(pushHistory({ id, at: new Date().toISOString(), title: a.role_title, company: company || a.company, jd, analysis: a, resume: reviewed.resume, outreach: o, stretch }));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function revise() {
    if (!revision.trim() || !resume) return;
    setBusy(true); setError("");
    try {
      const r = await call("review", { ...base, analysis, resume, instruction: revision });
      setResume(r.resume); setRevision("");
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  async function regenOutreach() {
    setBusy(true); setError("");
    try {
      setOutreach(await call("outreach", { ...base, analysis, resume, recipient, company: company || analysis.company }));
      setTab("email");
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  function openRun(run) {
    setRunId(run.id); setJd(run.jd); setCompany(run.company || ""); setAnalysis(run.analysis); setResume(run.resume); setOutreach(run.outreach); setStretch(!!run.stretch);
    setStatus({ analyze: "done", resume: "done", review: "done", outreach: "done" }); setTab("resume"); setModal(null);
  }

  function approve() {
    const ex = { id: runId || Date.now(), at: new Date().toISOString(), archetype: analysis.archetype, title: analysis.role_title, company: company || analysis.company, jd, analysis, resume };
    setExamples(approveExample(ex));
    setToast("Saved as a style example for this role type");
  }

  function exportExamples() {
    const text = examplesJsonl();
    if (!text) return setToast("Approve a few resumes first");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text + "\n"], { type: "application/jsonl" }));
    a.download = "applyforge_finetune.jsonl";
    a.click();
  }

  const approvedCount = analysis ? examples.filter((e) => e.archetype === analysis.archetype).length : 0;

  const fileBase = `Vamshi_Krishna_${(analysis?.strategy?.headline || "Resume").replace(/[^A-Za-z0-9]+/g, "_")}${company || analysis?.company ? "_" + (company || analysis.company).replace(/[^A-Za-z0-9]+/g, "") : ""}`;

  return (
    <div className="app">
      <header className="top">
        <div className="brand">ApplyForge<span>Resume Forge</span></div>
        <nav>
          <button className="ghost" onClick={() => setModal("history")}>History</button>
          <button className="ghost" onClick={() => setModal("profile")}>Profile</button>
          <button className="ghost" onClick={() => setModal("settings")}>Settings</button>
        </nav>
      </header>

      <main className="grid">
        <section className="left">
          <label className="lbl">Job description</label>
          <textarea className="jd" value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste the full job description here." />
          <div className="two">
            <div><label className="lbl">Company</label><input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Optional" /></div>
            <div><label className="lbl">Recipient name</label><input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Optional" /></div>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={stretch} onChange={(e) => setStretch(e.target.checked)} />
            <span>
              <b>Stretch mode</b>
              <small>Allow close-equivalent JD tools. Every stretch is listed for interview prep.</small>
            </span>
          </label>
          <button className="primary" disabled={busy || jd.trim().length < 200} onClick={forge}>{busy ? "Forging…" : "Forge application"}</button>
          <ol className="stages">
            {STAGES.map(([k, l]) => <li key={k} className={status[k] || ""}><i />{l}</li>)}
          </ol>
          {error && <div className="err">{error}</div>}
        </section>

        <section className="right">
          <div className="tabs">
            {[["analysis", "Role Analysis"], ["resume", "Resume"], ["email", "Email"], ["linkedin", "LinkedIn"]].map(([k, l]) => (
              <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>
            ))}
          </div>

          {tab === "analysis" && (analysis ? <Analysis a={analysis} /> : <Empty text="Paste a JD and forge. The role analysis appears here first." />)}

          {tab === "resume" && (resume ? (
            <div className="resume-wrap">
              <div className="toolbar">
                <button onClick={() => downloadDocx(resume, profile, Math.max(9.5, fit.size - 0.5), `${fileBase}.docx`)}>Download DOCX</button>
                <button onClick={() => window.print()}>Save as PDF</button>
                <button onClick={() => copy(resumeToText(resume, profile), setToast)}>Copy text</button>
                <button onClick={regenOutreach} disabled={busy}>Refresh email and note</button>
                <button onClick={approve} title="Use this resume, with your edits, as a style example for future JDs of this role type">Approve as example</button>
                <span className="meta">{approvedCount ? `${approvedCount} approved example${approvedCount > 1 ? "s" : ""} for this role type · ` : ""}{fit.size} pt{fit.overflow ? " · over one page" : " · fits one page"}</span>
              </div>
              <div className="revise">
                <input value={revision} onChange={(e) => setRevision(e.target.value)} onKeyDown={(e) => e.key === "Enter" && revise()} placeholder="Ask for a change, e.g. lead DXC with Snowflake modeling, tighten the summary" />
                <button onClick={revise} disabled={busy || !revision.trim()}>Revise</button>
              </div>
              <div className="split">
                <div className="paper-scroll"><ResumeDoc resume={resume} profile={profile} editable onChange={setResume} onFit={setFit} /></div>
                <Quality issues={issues} notes={resume.review_notes} />
              </div>
            </div>
          ) : <Empty text="The restructured resume appears here." />)}

          {tab === "email" && (outreach ? (
            <div className="cards">
              {outreach.emails.map((e, i) => (
                <article className="card" key={i}>
                  <header><b>{e.label}</b>
                    <div>
                      <button onClick={() => copy(`Subject: ${e.subject}\n\n${e.body}`, setToast)}>Copy</button>
                      <a className="btn" href={`mailto:?subject=${encodeURIComponent(e.subject)}&body=${encodeURIComponent(e.body)}`}>Open in Mail</a>
                    </div>
                  </header>
                  <div className="subj">Subject: {e.subject}</div>
                  <pre>{e.body}</pre>
                </article>
              ))}
            </div>
          ) : <Empty text="The recruiter email appears here." />)}

          {tab === "linkedin" && (outreach ? (
            <div className="cards">
              {outreach.linkedin.map((n, i) => (
                <article className="card" key={i}>
                  <header><b>{n.label}</b><div><span className={`count ${n.text.length > 300 ? "bad" : ""}`}>{n.text.length}/300</span><button onClick={() => copy(n.text, setToast)}>Copy</button></div></header>
                  <pre>{n.text}</pre>
                </article>
              ))}
            </div>
          ) : <Empty text="The LinkedIn connection note appears here." />)}
        </section>
      </main>

      {resume && <div className="print-only"><ResumeDoc resume={resume} profile={profile} printMode fontPt={fit.size} /></div>}

      {modal === "profile" && <ProfileModal profile={profile} onClose={() => setModal(null)} onSave={(p) => { setProfile(p); saveProfile(p); setModal(null); setToast("Profile saved"); }} onReset={() => { setProfile(resetProfile()); setModal(null); setToast("Profile reset"); }} />}
      {modal === "settings" && <SettingsModal onClose={() => setModal(null)} />}
      {modal === "history" && (
        <Modal title="History" onClose={() => setModal(null)}>
          <div className="row-end">
            <span className="muted small" style={{ marginRight: "auto" }}>{examples.length} approved example{examples.length === 1 ? "" : "s"}</span>
            <button onClick={exportExamples}>Export fine-tuning data</button>
          </div>
          {history.length ? history.map((r) => (
            <div key={r.id} className="hist-row">
              <button className="hist" onClick={() => openRun(r)}>
                <b>{r.title}</b><span>{r.company || "Company not set"} · {new Date(r.at).toLocaleString()}</span>
              </button>
              <select value={r.outcome || ""} onChange={(e) => setHistory(setOutcome(r.id, e.target.value))} title="Track what happened with this application">
                {["", "Applied", "Recruiter reply", "Interview", "Offer", "Rejected"].map((o) => <option key={o} value={o}>{o || "Outcome"}</option>)}
              </select>
            </div>
          )) : <p className="muted">No runs yet.</p>}
        </Modal>
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function Empty({ text }) {
  return <div className="empty">{text}</div>;
}

function Analysis({ a }) {
  return (
    <div className="analysis">
      <div className="hero">
        <span className="chip">{ARCH_LABEL[a.archetype]}</span>
        <span className="chip soft">{a.seniority}</span>
        <h2>{a.role_title}{a.company ? <small> at {a.company}</small> : null}</h2>
        <p className="mandate">{a.core_mandate}</p>
        <p className="muted">{a.archetype_rationale}</p>
        {a.term_map && (
          <div className={`reach ${a.term_map.reach < 0.65 ? "low" : ""}`}>
            <b>Profile reach {Math.round(a.term_map.coverage * 100)}%</b> of the JD's tools you have directly, {Math.round(a.term_map.reach * 100)}% counting close equivalents.
            {a.term_map.reach < 0.65 && <span> Low fit: {a.term_map.gaps.join(", ")} are true gaps. Expect a weaker match; consider whether to apply.</span>}
            <div className="terms">
              {a.term_map.matched.map((t) => <span key={t} className="t ok">{t}</span>)}
              {a.term_map.bridgeable.map((t) => <span key={t} className="t mid">{t}</span>)}
              {(a.term_map.context || []).map((t) => <span key={t} className="t ctx" title="In your history, not a listed skill">{t}</span>)}
              {a.term_map.gaps.map((t) => <span key={t} className="t bad">{t}</span>)}
            </div>
          </div>
        )}
      </div>
      <div className="acols">
        <Box title="What they own">{a.ownership_mode}</Box>
        <Box title="Business context">{a.business_context}</Box>
        <Box title="Success in 6 to 12 months"><ul>{a.success_signals.map((x, i) => <li key={i}>{x}</li>)}</ul></Box>
        <Box title="Primary stack"><ul>{a.primary_stack.map((x, i) => <li key={i}><b>{x.item}</b> <span className="muted">"{x.evidence}"</span></li>)}</ul></Box>
        <Box title="Must-haves"><ul>{a.must_haves.map((x, i) => <li key={i}>{x}</li>)}</ul></Box>
        <Box title="Nice-to-haves"><ul>{a.nice_to_haves.map((x, i) => <li key={i}>{x}</li>)}</ul></Box>
      </div>
      <h3 className="sec">Your fit</h3>
      <div className="acols three">
        <Box title="Strong matches" tone="good"><ul>{a.fit.strong_matches.map((x, i) => <li key={i}><b>{x.item}</b><br /><span className="muted">{x.evidence}</span></li>)}</ul></Box>
        <Box title="Bridgeable" tone="mid"><ul>{a.fit.bridgeable.map((x, i) => <li key={i}><b>{x.item}</b><br /><span className="muted">{x.bridge}</span></li>)}</ul></Box>
        <Box title="Gaps (not claimed)" tone="bad"><ul>{a.fit.true_gaps.map((x, i) => <li key={i}>{x}</li>)}</ul></Box>
      </div>
      <h3 className="sec">Resume strategy</h3>
      <div className="acols">
        <Box title={`Headline: ${a.strategy.headline}`}>{a.strategy.summary_angle}</Box>
        <Box title="Role emphasis"><ul>{a.strategy.role_emphasis.map((x, i) => <li key={i}><b>{x.role_id.toUpperCase()}</b>: {x.lead_with} <span className="muted">({x.frame_in_stack.join(", ")})</span></li>)}</ul></Box>
        <Box title="Projects chosen"><ul>{a.strategy.projects.map((x, i) => <li key={i}><b>{x.project_id}</b>: {x.why}</li>)}</ul></Box>
        <Box title="Bullet allocation"><ul>{(a.strategy.bullet_allocation || []).map((x, i) => <li key={i}><b>{x.role_id.toUpperCase()}: {x.bullets}</b> <span className="muted">{x.why}</span></li>)}</ul></Box>
        <Box title="Skills order">{a.strategy.skill_category_order.join("  ›  ")}</Box>
      </div>
    </div>
  );
}

function Box({ title, children, tone }) {
  return <div className={`box ${tone || ""}`}><h4>{title}</h4><div>{children}</div></div>;
}

function Quality({ issues, notes }) {
  const errs = issues.filter((i) => i.severity === "error");
  const warns = issues.filter((i) => i.severity === "warn");
  return (
    <aside className="quality">
      <h4>Quality check</h4>
      {!issues.length && <p className="ok">All spec checks pass.</p>}
      {[...errs, ...warns].map((i, k) => (
        <div key={k} className={`issue ${i.severity}`}><b>{i.where}</b><span>{i.message}</span></div>
      ))}
      {notes?.stretched_claims?.length > 0 && (
        <>
          <h4>Verify before sending</h4>
          {notes.stretched_claims.map((s, k) => <div key={k} className="issue warn"><b>{s.claim}</b><span>Basis: {s.real_basis}</span></div>)}
        </>
      )}
      {notes?.suggested_metrics?.length > 0 && (
        <>
          <h4>Metrics you could add</h4>
          <p className="muted small">Add real numbers to the metrics bank in Profile to use them.</p>
          {notes.suggested_metrics.map((s, k) => <div key={k} className="issue info"><b>{s.where}</b><span>{s.metric_idea}</span></div>)}
        </>
      )}
      <p className="muted small">Click any bullet or the summary to edit it directly.</p>
    </aside>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="scrim" onClick={onClose}>
      <div className={`modal ${wide ? "wide" : ""}`} onClick={(e) => e.stopPropagation()}>
        <header><b>{title}</b><button className="ghost" onClick={onClose}>Close</button></header>
        <div className="mbody">{children}</div>
      </div>
    </div>
  );
}

function ProfileModal({ profile, onClose, onSave, onReset }) {
  const [txt, setTxt] = useState(JSON.stringify(profile, null, 2));
  const [err, setErr] = useState("");
  return (
    <Modal title="Master profile (the only facts ApplyForge may use)" onClose={onClose} wide>
      <p className="muted small">Edit roles, facts, projects, skill inventory, and the metrics bank. Numbers in bullets must exist in metricsBank.</p>
      <textarea className="code" value={txt} onChange={(e) => setTxt(e.target.value)} spellCheck={false} />
      {err && <div className="err">{err}</div>}
      <div className="row-end">
        <button className="ghost" onClick={onReset}>Reset to default</button>
        <button className="primary" onClick={() => {
          try {
            const p = JSON.parse(txt);
            if (!p.experience || !p.metricsBank || !p.skillInventory) throw new Error("Profile needs experience, metricsBank, and skillInventory.");
            onSave(p);
          } catch (e) { setErr(e.message); }
        }}>Save profile</button>
      </div>
    </Modal>
  );
}

function SettingsModal({ onClose }) {
  const [s, setS] = useState(loadSettings);
  return (
    <Modal title="Settings" onClose={onClose}>
      <label className="lbl">OpenAI API key</label>
      <input type="password" value={s.apiKey} onChange={(e) => setS({ ...s, apiKey: e.target.value })} placeholder="Leave blank to use the server key (OPENAI_API_KEY)" />
      <p className="muted small">Stored only in this browser and sent to your own ApplyForge server.</p>
      <label className="lbl">Model</label>
      <input list="models" value={s.model} onChange={(e) => setS({ ...s, model: e.target.value })} placeholder="gpt-4o" />
      <datalist id="models">{["gpt-4o", "gpt-4.1", "gpt-4o-mini", "gpt-4.1-mini"].map((m) => <option key={m} value={m} />)}</datalist>
      <p className="muted small">Any OpenAI chat model that supports JSON Schema structured outputs.</p>
      <div className="row-end"><button className="primary" onClick={() => { saveSettings(s); onClose(); }}>Save</button></div>
    </Modal>
  );
}
