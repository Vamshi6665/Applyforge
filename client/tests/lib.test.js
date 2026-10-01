import { describe, it, expect, vi } from 'vitest';
import { wordDiff, diffStats } from '../src/lib/diff.js';
import { segmentJd, buildMarks } from '../src/lib/highlight.js';
import { splitSse, streamChat, request, ApiError } from '../src/lib/api.js';
import { load, save } from '../src/lib/storage.js';
import { isFollowUpDue, toCsv, daysBetween, fmtNum, copyText } from '../src/lib/format.js';
import { visibleText } from '../src/components/ChatPanel.jsx';
import { ANALYSIS, sse, mockServer } from './mockServer.js';

describe('wordDiff', () => {
  it('marks additions and deletions at word level', () => {
    const parts = wordDiff('I built big pipelines', 'I built fast pipelines');
    expect(parts).toEqual([
      { type: 'same', text: 'I built ' },
      { type: 'del', text: 'big' },
      { type: 'add', text: 'fast' },
      { type: 'same', text: ' pipelines' },
    ]);
    expect(diffStats(parts)).toEqual({ added: 1, removed: 1 });
  });

  it('handles empty inputs', () => {
    expect(wordDiff('', 'new text')).toEqual([{ type: 'add', text: 'new text' }]);
    expect(wordDiff('old', '')).toEqual([{ type: 'del', text: 'old' }]);
  });

  it('falls back to a full replace for huge inputs', () => {
    const big = 'word '.repeat(800);
    expect(wordDiff(big, `${big}x`)).toHaveLength(2);
  });
});

describe('segmentJd', () => {
  it('tags matched keywords with their bucket', () => {
    const segs = segmentJd('Need SQL, Tableau and Kubernetes.', ANALYSIS.keywords);
    const marked = segs.filter((s) => s.bucket).map((s) => [s.text, s.bucket]);
    expect(marked).toEqual([
      ['SQL', 'have'],
      ['Tableau', 'bridge'],
      ['Kubernetes', 'gap'],
    ]);
    expect(segs.map((s) => s.text).join('')).toBe('Need SQL, Tableau and Kubernetes.');
  });

  it('prefers longer matches and respects word boundaries', () => {
    const kw = { have: [{ term: 'Power BI', matches: ['Power BI', 'BI'] }], bridge: [], gap: [] };
    expect(buildMarks(kw)[0].text).toBe('Power BI');
    const segs = segmentJd('Power BI and BIG data', kw);
    expect(segs.filter((s) => s.bucket).map((s) => s.text)).toEqual(['Power BI']);
  });

  it('returns plain text when there are no keywords', () => {
    expect(segmentJd('hello', null)).toEqual([{ text: 'hello' }]);
    expect(segmentJd('', ANALYSIS.keywords)).toEqual([]);
  });
});

describe('SSE client', () => {
  it('splitSse keeps incomplete frames for the next chunk', () => {
    const { events, rest } = splitSse('data: {"a":1}\n\ndata: {"b":');
    expect(events).toEqual([{ a: 1 }]);
    expect(rest).toBe('data: {"b":');
  });

  it('streamChat delivers events in order', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(sse([{ type: 'text', text: 'a' }, { type: 'done', note: 'n' }])));
    const seen = [];
    await streamChat({ message: 'x' }, { onEvent: (e) => seen.push(e.type) });
    expect(seen).toEqual(['text', 'done']);
  });

  it('streamChat throws on an error event', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(sse([{ type: 'error', error: 'boom', code: 'internal' }])));
    await expect(streamChat({}, { onEvent: () => {} })).rejects.toThrow('boom');
  });

  it('streamChat surfaces JSON errors returned before streaming', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'No key', code: 'missing_key' }), { status: 400 })));
    await expect(streamChat({}, { onEvent: () => {} })).rejects.toMatchObject({ code: 'missing_key', status: 400 });
  });

  it('request maps network failures and HTTP errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    await expect(request('/x')).rejects.toBeInstanceOf(ApiError);
    mockServer();
    await expect(request('/unknown')).rejects.toMatchObject({ status: 404 });
  });

  it('request sends the user key header', async () => {
    const { calls } = mockServer();
    await request('/models', { key: 'sk-1' });
    expect(calls[0].headers['x-provider-key']).toBe('sk-1');
  });

  it('visibleText hides the draft block while streaming', () => {
    expect(visibleText('Done. <draft>secret')).toBe('Done.');
    expect(visibleText('plain')).toBe('plain');
  });
});

describe('storage and format helpers', () => {
  it('round-trips values and survives broken storage', () => {
    save('k', { a: 1 });
    expect(load('k', null)).toEqual({ a: 1 });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(load('k', 'fallback')).toBe('fallback');
  });

  it('save returns false when storage throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(save('k', 1)).toBe(false);
  });

  it('flags follow-ups after five days in Sent', () => {
    const now = new Date('2026-09-30T12:00:00Z');
    expect(isFollowUpDue({ status: 'sent', sentAt: '2026-09-24T12:00:00Z' }, now)).toBe(true);
    expect(isFollowUpDue({ status: 'sent', sentAt: '2026-09-28T12:00:00Z' }, now)).toBe(false);
    expect(isFollowUpDue({ status: 'interview', sentAt: '2026-09-01T12:00:00Z' }, now)).toBe(false);
    expect(daysBetween(null)).toBe(0);
  });

  it('exports CSV with escaping', () => {
    const csv = toCsv([{ company: 'A, Inc', role: 'Analyst "II"', status: 'sent', createdAt: 'x', sentAt: '', notes: 'line\nbreak' }]);
    expect(csv.split('\n')[0]).toBe('company,role,status,createdAt,sentAt,notes');
    expect(csv).toContain('"A, Inc"');
    expect(csv).toContain('"Analyst ""II"""');
  });

  it('formats numbers and copies text', async () => {
    expect(fmtNum(12345.6)).toBe('12,346');
    expect(await copyText('hi')).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hi');
  });
});
