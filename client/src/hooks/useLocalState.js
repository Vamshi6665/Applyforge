import { useEffect, useRef, useState } from 'react';
import { load, save } from '../lib/storage.js';

/** useState that persists to localStorage (best effort). */
export function useLocalState(key, initial) {
  const [value, setValue] = useState(() => load(key, typeof initial === 'function' ? initial() : initial));
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    save(key, value);
  }, [key, value]);
  return [value, setValue];
}

/** Debounced copy of a value. */
export function useDebounced(value, ms) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
