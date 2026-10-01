import { useEffect, useRef, useState } from 'react';

/** Count up to a number once, or jump straight there with reduced motion. */
export function useCountUp(target, ms = 900) {
  const [value, setValue] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const reduce = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof requestAnimationFrame !== 'function') {
      setValue(target);
      return undefined;
    }
    const start = performance.now();
    const begin = from.current;
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / ms);
      const eased = 1 - (1 - p) ** 3;
      setValue(Math.round(begin + (target - begin) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return value;
}

/**
 * Ring split into the three honesty buckets, with the match score in the middle.
 * Segment length is proportional to how many keywords fall in each bucket.
 */
export default function ScoreDial({ score, have = 0, bridge = 0, gap = 0, size = 128, label = 'match' }) {
  const shown = useCountUp(score);
  const total = have + bridge + gap || 1;
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  const gapPx = total > 1 ? 4 : 0;
  const segs = [
    ['have', have],
    ['bridge', bridge],
    ['gap', gap],
  ].filter(([, n]) => n > 0);
  let offset = 0;

  return (
    <div className="dial" style={{ width: size, height: size }} role="img" aria-label={`Match score ${score} out of 100: ${have} have, ${bridge} bridge, ${gap} gaps`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} className="dial__track" />
        {segs.map(([bucket, n]) => {
          const len = Math.max(0, (n / total) * c - gapPx);
          const el = (
            <circle
              key={bucket}
              cx={size / 2}
              cy={size / 2}
              r={r}
              className={`dial__seg dial__seg--${bucket}`}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
            />
          );
          offset += (n / total) * c;
          return el;
        })}
      </svg>
      <div className="dial__center">
        <strong data-testid="match-score">{shown}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
