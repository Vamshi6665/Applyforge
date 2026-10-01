import { createHash } from 'node:crypto';

/**
 * Tiny in-memory LRU cache with TTL. Identical generate requests (same JD,
 * profile, model and sections) are served from here and cost zero tokens.
 */
export class LruCache {
  constructor({ max = 200, ttlMs = 6 * 60 * 60 * 1000, now = () => Date.now() } = {}) {
    this.max = max;
    this.ttlMs = ttlMs;
    this.now = now;
    this.map = new Map();
    this.hits = 0;
    this.misses = 0;
  }

  get(key) {
    const entry = this.map.get(key);
    if (!entry) {
      this.misses += 1;
      return undefined;
    }
    if (entry.expires <= this.now()) {
      this.map.delete(key);
      this.misses += 1;
      return undefined;
    }
    this.map.delete(key);
    this.map.set(key, entry);
    this.hits += 1;
    return entry.value;
  }

  set(key, value) {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, { value, expires: this.now() + this.ttlMs });
    while (this.map.size > this.max) this.map.delete(this.map.keys().next().value);
  }

  get size() {
    return this.map.size;
  }

  stats() {
    return { size: this.map.size, hits: this.hits, misses: this.misses };
  }
}

export const hashKey = (obj) => createHash('sha256').update(JSON.stringify(obj)).digest('hex');
