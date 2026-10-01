import { describe, it, expect } from 'vitest';
import { humanize, fitToLimit, checkQuality, cleanDoc, LINKEDIN_LIMIT } from '../src/services/sanitize.js';
import { LruCache, hashKey } from '../src/services/cache.js';

describe('humanize', () => {
  it('strips markdown bold and headings', () => {
    expect(humanize('## Hello\nI used **Snowflake** and __dbt__.')).toBe('Hello\nI used Snowflake and dbt.');
  });

  it('replaces em dashes, en dashes and double hyphens with commas', () => {
    expect(humanize('Pipelines — fast')).toBe('Pipelines, fast');
    expect(humanize('Pipelines – fast')).toBe('Pipelines, fast');
    expect(humanize('Pipelines -- fast')).toBe('Pipelines, fast');
  });

  it('keeps hyphenated words and number formats intact', () => {
    expect(humanize('end-to-end work on 5,000,000 rows')).toBe('end-to-end work on 5,000,000 rows');
  });

  it('normalises bullets and blank lines', () => {
    expect(humanize('* one\n\n\n\n• two')).toBe('- one\n\n- two');
  });
});

describe('fitToLimit', () => {
  it('leaves short text alone', () => {
    expect(fitToLimit('Short note.')).toBe('Short note.');
  });

  it('cuts at a sentence end when possible', () => {
    const text = `${'A'.repeat(200)}. ${'B'.repeat(150)}.`;
    const out = fitToLimit(text, 300);
    expect(out.length).toBeLessThanOrEqual(300);
    expect(out.endsWith('A.')).toBe(true);
  });

  it('falls back to a word boundary', () => {
    const out = fitToLimit('word '.repeat(100), 50);
    expect(out.length).toBeLessThanOrEqual(50);
    expect(out.endsWith('.')).toBe(true);
  });
});

describe('checkQuality and cleanDoc', () => {
  it('flags filler, dashes, bold and placeholders', () => {
    const q = checkQuality('I am thrilled to leverage **skills** — at [Company]', { type: 'email' });
    expect(q.issues.join(' ')).toMatch(/Filler/);
    expect(q.issues.join(' ')).toMatch(/dashes/);
    expect(q.issues.join(' ')).toMatch(/bold/);
    expect(q.issues.join(' ')).toMatch(/placeholder/);
  });

  it('allows the [Name] placeholder in LinkedIn notes but enforces length', () => {
    expect(checkQuality('Hi [Name], hello', { type: 'linkedin' }).issues).toEqual([]);
    expect(checkQuality('x'.repeat(301), { type: 'linkedin' }).issues[0]).toMatch(/300/);
  });

  it('forces LinkedIn notes onto one line within the limit', () => {
    const out = cleanDoc(`Hi there,\n${'great '.repeat(80)}`, 'linkedin');
    expect(out).not.toContain('\n');
    expect(out.length).toBeLessThanOrEqual(LINKEDIN_LIMIT);
  });

  it('forces resume bullets to start with "- "', () => {
    expect(cleanDoc('1. Built X\n* Did Y\n- Shipped Z', 'resume')).toBe('- Built X\n- Did Y\n- Shipped Z');
  });
});

describe('LruCache', () => {
  it('returns stored values and tracks hits', () => {
    const c = new LruCache({ max: 2 });
    c.set('a', 1);
    expect(c.get('a')).toBe(1);
    expect(c.get('zz')).toBeUndefined();
    expect(c.stats()).toMatchObject({ hits: 1, misses: 1, size: 1 });
  });

  it('evicts the least recently used entry', () => {
    const c = new LruCache({ max: 2 });
    c.set('a', 1);
    c.set('b', 2);
    c.get('a');
    c.set('c', 3);
    expect(c.get('b')).toBeUndefined();
    expect(c.get('a')).toBe(1);
    expect(c.get('c')).toBe(3);
  });

  it('expires entries after the TTL', () => {
    let t = 0;
    const c = new LruCache({ ttlMs: 100, now: () => t });
    c.set('a', 1);
    t = 150;
    expect(c.get('a')).toBeUndefined();
    expect(c.size).toBe(0);
  });

  it('hashKey is stable and order sensitive', () => {
    expect(hashKey({ a: 1 })).toBe(hashKey({ a: 1 }));
    expect(hashKey({ a: 1 })).not.toBe(hashKey({ a: 2 }));
  });
});
