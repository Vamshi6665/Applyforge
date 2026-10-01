import { useEffect, useState } from 'react';

const STAGES = [
  'Reading the posting',
  'Matching it to your profile',
  'Writing in your voice',
  'Removing filler and checking limits',
];

/**
 * Shown while drafts are being written. The real request is one call, so the
 * stages advance on a timer and the last one holds until the response lands.
 */
export default function ForgeProgress({ count = 1, modelLabel = '' }) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 1100);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="forge" role="status" aria-live="polite">
      <p className="forge__title">
        Writing {count} draft{count === 1 ? '' : 's'}
        {modelLabel && <span className="muted"> with {modelLabel}</span>}
      </p>
      <ol className="forge__steps">
        {STAGES.map((s, i) => (
          <li key={s} className={i < stage ? 'is-done' : i === stage ? 'is-now' : ''}>
            <span className="forge__mark" aria-hidden="true" />
            {s}
          </li>
        ))}
      </ol>
      <div className="forge__lines" aria-hidden="true">
        {[92, 100, 84, 96, 60].map((w, i) => (
          <span key={i} style={{ width: `${w}%`, animationDelay: `${i * 0.12}s` }} />
        ))}
      </div>
    </div>
  );
}
