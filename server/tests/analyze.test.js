import { describe, it, expect } from 'vitest';
import { compressJd, detectRoleAndCompany, analyzeKeywords, analyzeJob, estimateTokens } from '../src/services/analyze.js';
import { JD, PROFILE } from './fixtures.js';

describe('compressJd', () => {
  it('removes benefits and EEO boilerplate before it reaches a model', () => {
    const { text, stats } = compressJd(JD);
    expect(text).toContain('Snowflake and BigQuery');
    expect(text).not.toMatch(/401\(k\)/);
    expect(text).not.toMatch(/Dental/);
    expect(text).not.toMatch(/equal opportunity/i);
    expect(stats.compressedChars).toBeLessThan(stats.originalChars);
    expect(stats.savedTokens).toBeGreaterThan(0);
  });

  it('removes duplicate lines and markdown symbols', () => {
    const { text } = compressJd('**Requirements**\n- SQL skills\n- SQL skills\n* Python');
    expect(text.split('\n')).toEqual(['Requirements', 'SQL skills', 'Python']);
  });

  it('truncates long descriptions at a clean boundary', () => {
    const long = Array.from({ length: 400 }, (_, i) => `Line ${i} requires strong SQL and Python skills.`).join('\n');
    const { text, truncated } = compressJd(long, 2000);
    expect(truncated).toBe(true);
    expect(text.length).toBeLessThanOrEqual(2000);
    expect(text.endsWith('.')).toBe(true);
  });

  it('handles empty input', () => {
    expect(compressJd('').text).toBe('');
  });
});

describe('detectRoleAndCompany', () => {
  it('reads the title line and the "is hiring" sentence', () => {
    expect(detectRoleAndCompany(JD)).toEqual({ role: 'Senior Data Engineer', company: 'Acme Analytics' });
  });

  it('reads labeled fields', () => {
    const r = detectRoleAndCompany('Job Title: Data Analyst II\nCompany: Northwind Traders\nWe need SQL.');
    expect(r).toEqual({ role: 'Data Analyst II', company: 'Northwind Traders' });
  });

  it('reads "Role at Company" headers and strips work-mode suffixes', () => {
    expect(detectRoleAndCompany('Analytics Engineer at Lumen Health - Remote\nDetails follow.')).toEqual({
      role: 'Analytics Engineer',
      company: 'Lumen Health',
    });
  });

  it('reads "join X as a Y"', () => {
    const r = detectRoleAndCompany('We build tools.\nJoin Contoso as a Business Intelligence Analyst and own reporting.');
    expect(r.company).toBe('Contoso');
    expect(r.role).toBe('Business Intelligence Analyst');
  });

  it('returns empty strings when nothing is detectable', () => {
    expect(detectRoleAndCompany('just some text')).toEqual({ role: '', company: '' });
  });
});

describe('analyzeKeywords', () => {
  const result = analyzeKeywords(JD, PROFILE);
  const terms = (arr) => arr.map((k) => k.term);

  it('puts skills the profile already has in "have"', () => {
    expect(terms(result.have)).toEqual(expect.arrayContaining(['SQL', 'Python', 'Snowflake', 'Spark', 'Kafka', 'Power BI']));
  });

  it('marks adjacent skills as honest bridges with the reason', () => {
    const airflow = result.bridge.find((k) => k.term === 'Airflow');
    expect(airflow.via).toContain('Azure Data Factory');
    expect(terms(result.bridge)).toEqual(expect.arrayContaining(['BigQuery', 'Tableau', 'dbt']));
  });

  it('flags genuine gaps and never treats them as covered', () => {
    expect(terms(result.gap)).toEqual(expect.arrayContaining(['Kubernetes', 'FHIR']));
    expect(terms(result.have)).not.toContain('Kubernetes');
  });

  it('returns the exact surface forms for highlighting', () => {
    const pbi = result.have.find((k) => k.term === 'Power BI');
    expect(pbi.matches).toContain('Power BI');
  });

  it('respects word boundaries and symbol terms', () => {
    const r = analyzeKeywords('We use HTML and XML. Strong C++ and C# needed.', PROFILE);
    const all = [...r.have, ...r.bridge, ...r.gap].map((k) => k.term);
    expect(all).not.toContain('Machine Learning');
    expect(all).toEqual(expect.arrayContaining(['C++', 'C#']));
  });

  it('computes a 0-100 match score', () => {
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(analyzeKeywords('', PROFILE).score).toBe(0);
  });

  it('uses resume text as evidence', () => {
    const custom = { ...PROFILE, skills: [], resumeText: 'Built Kubernetes deployments.', experience: [], metrics: [] };
    expect(terms(analyzeKeywords('Kubernetes required', custom).have)).toContain('Kubernetes');
  });
});

describe('analyzeJob and estimateTokens', () => {
  it('combines detection, keywords and compression', () => {
    const a = analyzeJob(JD, PROFILE, 12000);
    expect(a.role).toBe('Senior Data Engineer');
    expect(a.keywords.have.length).toBeGreaterThan(0);
    expect(a.compressed.text.length).toBeGreaterThan(0);
  });

  it('estimates about four characters per token', () => {
    expect(estimateTokens('abcdefgh')).toBe(2);
    expect(estimateTokens('')).toBe(0);
  });
});
