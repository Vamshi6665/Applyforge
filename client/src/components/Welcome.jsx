import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import ScoreDial from './ScoreDial.jsx';
import { SAMPLE_JD } from '../lib/sample.js';

// A short posting marked the way the real analyzer marks it.
const DEMO = [
  ['Build ', ['ETL pipelines', 'have'], ' in ', ['Python', 'have'], ' and ', ['SQL', 'have'], '.'],
  ['Model data in ', ['Snowflake', 'have'], ' and ', ['BigQuery', 'bridge'], '.'],
  ['Orchestrate jobs with ', ['Airflow', 'bridge'], ' and ', ['dbt', 'bridge'], '.'],
  ['Deploy services on ', ['Kubernetes', 'gap'], '.'],
  ['Share ', ['Power BI', 'have'], ' dashboards with ', ['stakeholders', 'have'], '.'],
];

const readText = (file) =>
  typeof file.text === 'function'
    ? file.text()
    : new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = reject;
        r.readAsText(file);
      });

const reduceMotion = () => typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function Demo() {
  const [cycle, setCycle] = useState(0);
  // Replay the marker sweep every few seconds so the page feels alive.
  useEffect(() => {
    if (reduceMotion()) return undefined;
    const loop = setInterval(() => setCycle((c) => c + 1), 9000);
    return () => clearInterval(loop);
  }, []);

  let n = 0;
  return (
    <figure className="showcase" aria-label="Example: a job posting checked against a profile">
      <div className="showcase__bar">
        <span className="showcase__lights" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="showcase__title">Senior Data Engineer at Northwind Analytics</span>
      </div>
      <div className="showcase__body">
        <div className="showcase__jd" key={cycle}>
          {DEMO.map((line, i) => (
            <p key={i}>
              {line.map((part, j) => {
                if (typeof part === 'string') return <span key={j}>{part}</span>;
                const delay = 0.2 + n++ * 0.09;
                return (
                  <mark key={j} className={`hl hl--${part[1]} demo__mark`} style={{ animationDelay: `${delay}s` }}>
                    {part[0]}
                  </mark>
                );
              })}
            </p>
          ))}
        </div>
        <figcaption className="showcase__side">
          <ScoreDial key={cycle} score={76} have={6} bridge={3} gap={1} size={132} />
          <ul className="legend">
            <li>
              <span className="dot dot--have" /> <strong>6</strong> on your profile
            </li>
            <li>
              <span className="dot dot--bridge" /> <strong>3</strong> bridged honestly
            </li>
            <li>
              <span className="dot dot--gap" /> <strong>1</strong> gap, never claimed
            </li>
          </ul>
        </figcaption>
      </div>
    </figure>
  );
}

export default function Welcome({ jd, setJd, onStart, notify, modelLabel, onOpenProfile }) {
  const [over, setOver] = useState(false);
  const areaRef = useRef(null);

  const readFile = async (file) => {
    if (!file) return;
    if (!/\.(txt|md)$/i.test(file.name) && !file.type.startsWith('text/')) {
      notify('Drop a .txt or .md file, or paste the text.', 'error');
      return;
    }
    onStart((await readText(file)).slice(0, 60000));
  };

  const pasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) onStart(text);
      else notify('Your clipboard is empty. Copy the job posting first.', 'error');
    } catch {
      notify('Clipboard access was blocked. Press Ctrl+V in the box instead.', 'error');
      areaRef.current?.focus();
    }
  };

  const ready = jd.trim().length >= 80;

  return (
    <main className="welcome">
      <section className="hero">
        <h2 className="hero__title">
          Every application.
          <br />
          Tailored and honest.
        </h2>
        <p className="hero__sub">
          Paste a job posting. ApplyForge checks every requirement against your profile, then writes your email, LinkedIn note,
          resume bullets and cover letter in your own voice. It never claims a skill you don’t have.
        </p>
        <div className="hero__actions">
          <button type="button" className="btn btn--pill btn--pill-primary" onClick={pasteClipboard}>
            Paste from clipboard
          </button>
          {ready ? (
            <button type="button" className="btn btn--pill btn--pill-secondary" onClick={() => onStart(jd)}>
              Mark it up
            </button>
          ) : (
            <button type="button" className="btn btn--pill btn--pill-secondary" onClick={() => onStart(SAMPLE_JD)}>
              Try a sample job
            </button>
          )}
        </div>

        <div
          className={`drop ${over ? 'is-over' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) readFile(file);
            else {
              const text = e.dataTransfer.getData('text');
              if (text) onStart(text);
            }
          }}
        >
          <label htmlFor="jd-start" className="sr-only">
            Job description
          </label>
          <textarea
            id="jd-start"
            ref={areaRef}
            className="drop__area"
            value={jd}
            onChange={(e) => {
              const v = e.target.value;
              // A paste lands as one big change: go straight to the workspace.
              if (v.length - jd.length > 40 && v.trim().length >= 80) onStart(v);
              else setJd(v);
            }}
            placeholder="Or paste the job posting here. You can also drop a .txt file."
            spellCheck={false}
          />
          <div className="drop__foot">
            <span>
              <span className="model-chip__dot" aria-hidden="true" /> {modelLabel}
            </span>
            <span>Nothing is sent until you choose to write.</span>
          </div>
        </div>
      </section>

      <section className="showcase-wrap" aria-label="How a posting is checked">
        <Demo />
      </section>

      <section className="features" aria-label="What ApplyForge does">
        <div>
          <Icon name="eye" size={28} />
          <h3>See your match instantly.</h3>
          <p>Every requirement is sorted into what you have, what you can honestly bridge, and real gaps. No tokens spent.</p>
        </div>
        <div>
          <Icon name="edit" size={28} />
          <h3>Write in your own voice.</h3>
          <p>Drafts follow a real email you sent, use only your real metrics, and leave out filler.</p>
        </div>
        <div>
          <Icon name="chat" size={28} />
          <h3>Refine with a coach.</h3>
          <p>Ask for any change. You see exactly what changed before it’s applied, and undo is one click.</p>
        </div>
      </section>

      <p className="welcome__foot">
        Drafts use the details in{' '}
        <button type="button" className="link-btn link-btn--inline" onClick={onOpenProfile}>
          your profile
        </button>
        . Everything stays in this browser.
      </p>
    </main>
  );
}
