import { describe, it, expect } from 'vitest';
import { buildGenerateMessages, buildChatMessages, compactHistory, extractDraft, profileBlock } from '../src/prompts/builders.js';
import { analyzeJob } from '../src/services/analyze.js';
import { JD, PROFILE } from './fixtures.js';

const analysis = analyzeJob(JD, PROFILE, 12000);

describe('buildGenerateMessages', () => {
  it('only includes rules for the requested sections', () => {
    const { system } = buildGenerateMessages({ profile: PROFILE, analysis, sections: ['linkedin'], tone: 'concise' });
    expect(system).toMatch(/linkedin:/);
    expect(system).not.toMatch(/coverLetter:/);
    expect(system).toMatch(/"linkedin": "<text>"/);
    expect(system).toMatch(/concise and direct/);
  });

  it('skips the gold email sample when no outreach section is requested', () => {
    const resumeOnly = buildGenerateMessages({ profile: PROFILE, analysis, sections: ['resume'], tone: 'metrics' });
    const withEmail = buildGenerateMessages({ profile: PROFILE, analysis, sections: ['email'], tone: 'metrics' });
    expect(resumeOnly.system).not.toMatch(/GOLD EMAIL/);
    expect(withEmail.system).toMatch(/GOLD EMAIL/);
    expect(resumeOnly.system.length).toBeLessThan(withEmail.system.length);
  });

  it('sends the compressed JD and the keyword buckets', () => {
    const { messages } = buildGenerateMessages({ profile: PROFILE, analysis, sections: ['email'], tone: 'metrics' });
    const user = messages[0].content;
    expect(user).toMatch(/Airflow via Azure Data Factory/);
    expect(user).toMatch(/GAP keywords \(do not claim\):.*Kubernetes/);
    expect(user).not.toMatch(/401\(k\)/);
  });

  it('always carries the no-fabrication rule', () => {
    const { system } = buildGenerateMessages({ profile: PROFILE, analysis, sections: ['resume'], tone: 'metrics' });
    expect(system).toMatch(/NO FABRICATION/);
  });
});

describe('profileBlock', () => {
  it('includes resume text when provided and caps its length', () => {
    const block = profileBlock({ ...PROFILE, resumeText: 'x'.repeat(10000) });
    expect(block).toMatch(/Resume text/);
    expect(block.length).toBeLessThan(10000);
  });
});

describe('chat prompt helpers', () => {
  it('compactHistory keeps only the last N turns and collapses old drafts', () => {
    const history = Array.from({ length: 20 }, (_, i) => ({
      role: i % 2 ? 'assistant' : 'user',
      content: i % 2 ? `Done.\n<draft>long draft ${i}</draft>` : `msg ${i}`,
    }));
    const out = compactHistory(history, 3);
    expect(out).toHaveLength(6);
    expect(out.every((m) => !m.content.includes('long draft'))).toBe(true);
    expect(out[1].content).toMatch(/revised draft shown/);
  });

  it('compactHistory drops malformed entries', () => {
    expect(compactHistory([{ role: 'system', content: 'x' }, { role: 'user', content: '  ' }, null])).toEqual([]);
  });

  it('buildChatMessages puts the current draft in the system prompt and the message last', () => {
    const { system, messages } = buildChatMessages({
      profile: PROFILE,
      analysis,
      docType: 'linkedin',
      draft: 'Hi [Name], current note',
      history: [],
      message: 'shorter please',
      maxTurns: 6,
      jdExcerpt: 'excerpt',
    });
    expect(system).toMatch(/CURRENT LINKEDIN NOTE:\nHi \[Name\], current note/);
    expect(system).toMatch(/300 characters/);
    expect(messages.at(-1)).toEqual({ role: 'user', content: 'shorter please' });
  });

  it('extractDraft separates the note from the revised draft', () => {
    expect(extractDraft('Shortened it.\n<draft>\nNew text\n</draft>')).toEqual({ note: 'Shortened it.', draft: 'New text' });
    expect(extractDraft('Just an answer')).toEqual({ note: 'Just an answer', draft: null });
    expect(extractDraft('Partial <draft>unfinished').draft).toBe('unfinished');
  });
});
