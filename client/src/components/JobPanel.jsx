import { useMemo, useState } from 'react';
import { segmentJd } from '../lib/highlight.js';
import { fmtNum } from '../lib/format.js';
import { SAMPLE_JD } from '../lib/sample.js';

const BUCKET_TITLE = {
  have: 'On your profile',
  bridge: 'Not claimed, but bridged honestly',
  gap: 'Not on your profile, never claimed',
};

function markTitle(seg) {
  if (seg.bucket === 'bridge') return `${seg.term}: bridged through ${seg.via?.join(', ')}`;
  return `${seg.term}: ${BUCKET_TITLE[seg.bucket]}`;
}

export function MarkedJob({ jd, keywords }) {
  const segments = useMemo(() => segmentJd(jd, keywords), [jd, keywords]);
  return (
    <div className="marked" data-testid="marked-jd">
      {segments.map((s, i) =>
        s.bucket ? (
          <mark key={i} className={`hl hl--${s.bucket}`} title={markTitle(s)}>
            {s.text}
          </mark>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </div>
  );
}

function KeywordGroup({ bucket, items, label }) {
  if (!items?.length) return null;
  return (
    <div className="kw-group">
      <h4>
        <span className={`swatch swatch--${bucket}`} aria-hidden="true" />
        {label} <span className="muted">{items.length}</span>
      </h4>
      <ul className="chips">
        {items.map((k) => (
          <li key={k.term} className={`chip chip--${bucket}`} title={bucket === 'bridge' ? `via ${k.via.join(', ')}` : undefined}>
            {k.term}
            {bucket === 'bridge' && <span className="chip__via"> via {k.via[0]}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function JobPanel({ jd, setJd, analysis, analyzing, role, company, setRole, setCompany }) {
  const [editing, setEditing] = useState(false);
  const showEditor = editing || !jd.trim();
  const kw = analysis?.keywords;

  return (
    <section className="pane pane--job" aria-labelledby="job-title">
      <div className="pane__head">
        <h2 id="job-title">The job</h2>
        {jd.trim() && (
          <div className="seg" role="group" aria-label="Job view">
            <button type="button" aria-pressed={!showEditor} onClick={() => setEditing(false)}>
              Marked up
            </button>
            <button type="button" aria-pressed={showEditor} onClick={() => setEditing(true)}>
              Edit text
            </button>
          </div>
        )}
      </div>

      <div className="pane__scroll">
        {showEditor ? (
          <div className="paste">
            <label htmlFor="jd" className="sr-only">
              Job description
            </label>
            <textarea
              id="jd"
              className="paste__area"
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the full job posting here. Skills you have get marked green, ones you can bridge honestly get yellow, and real gaps get pink."
              spellCheck={false}
            />
            {!jd.trim() && (
              <button type="button" className="link-btn" onClick={() => setJd(SAMPLE_JD)}>
                No posting handy? Try a sample job
              </button>
            )}
          </div>
        ) : (
          <MarkedJob jd={jd} keywords={kw} />
        )}

        {jd.trim() && (
          <div className="job-meta">
            <div className="field-row">
              <label className="field">
                <span>Role</span>
                <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Detected from the posting" />
              </label>
              <label className="field">
                <span>Company</span>
                <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Detected from the posting" />
              </label>
            </div>

            {kw && (
              <>
                <div className="match" aria-live="polite">
                  <div className="match__bar" role="img" aria-label={`Match score ${kw.score} out of 100`}>
                    <span className="match__fill" style={{ width: `${kw.score}%` }} />
                  </div>
                  <p>
                    <strong data-testid="match-score">{kw.score}</strong> match
                    {analyzing && <span className="muted"> updating…</span>}
                  </p>
                </div>
                <KeywordGroup bucket="have" items={kw.have} label="You have" />
                <KeywordGroup bucket="bridge" items={kw.bridge} label="Bridge honestly" />
                <KeywordGroup bucket="gap" items={kw.gap} label="Gaps, not claimed" />
                {analysis.compression?.savedTokens > 0 && (
                  <p className="fineprint">
                    Benefits and legal boilerplate are trimmed before sending, about {fmtNum(analysis.compression.savedTokens)} tokens
                    saved per request.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
