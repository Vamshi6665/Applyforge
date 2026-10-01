import { analyzeJob } from './analyze.js';
import { cleanDoc, checkQuality } from './sanitize.js';
import { hashKey } from './cache.js';
import { buildGenerateMessages } from '../prompts/builders.js';
import { ProviderError } from '../providers/http.js';

/** Parse model JSON even when it arrives wrapped in fences or chatter. */
export function parseJsonLoose(text = '') {
  const t = String(text).replace(/```(?:json)?/gi, '').trim();
  try {
    return JSON.parse(t);
  } catch {
    const start = t.indexOf('{');
    const end = t.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(t.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

const hasAll = (obj, sections) => obj && sections.every((s) => typeof obj[s] === 'string' && obj[s].trim());

/** Output budget scales with what was asked for instead of a fixed large number. */
export function outputBudget(sections, cap) {
  const per = { email: 380, linkedin: 120, resume: 380, coverLetter: 520, followUp: 220 };
  const total = sections.reduce((n, s) => n + (per[s] || 300), 120);
  return Math.min(cap, total);
}

export function publicAnalysis(analysis) {
  return {
    role: analysis.role,
    company: analysis.company,
    keywords: analysis.keywords,
    compression: { ...analysis.compressed.stats, truncated: analysis.compressed.truncated },
  };
}

export function createGenerateService({ registry, cache, config, defaultProfile }) {
  return async function generate(input, { userKey, signal } = {}) {
    const profile = input.profile || defaultProfile;
    const analysis = analyzeJob(input.jd, profile, config.maxJdChars);
    if (input.role) analysis.role = input.role;
    if (input.company) analysis.company = input.company;

    const { adapter, model, apiKey } = registry.resolve({ provider: input.provider, model: input.model, userKey });
    const key = hashKey({
      p: adapter.id,
      model,
      sections: [...input.sections].sort(),
      tone: input.tone,
      profile,
      jd: analysis.compressed.text,
      role: analysis.role,
      company: analysis.company,
    });

    if (!input.fresh) {
      const hit = cache.get(key);
      if (hit) return { ...hit, cached: true, usage: { input: 0, output: 0, cached: 0 } };
    }

    const { system, messages } = buildGenerateMessages({ profile, analysis, sections: input.sections, tone: input.tone });
    const call = {
      system,
      messages,
      model,
      apiKey,
      maxTokens: outputBudget(input.sections, config.maxOutputTokens),
      temperature: 0.6,
      json: true,
      signal,
      meta: { kind: 'generate', profile, analysis, sections: input.sections, tone: input.tone },
    };

    let res = await adapter.complete(call);
    let usage = { ...res.usage };
    let parsed = parseJsonLoose(res.text);

    if (!hasAll(parsed, input.sections)) {
      // One repair attempt. Only paid for when the model breaks the contract.
      res = await adapter.complete({
        ...call,
        messages: [
          ...messages,
          { role: 'assistant', content: String(res.text).slice(0, 6000) },
          { role: 'user', content: `That was not valid. Reply with only the JSON object with keys: ${input.sections.join(', ')}.` },
        ],
      });
      usage = {
        input: usage.input + res.usage.input,
        output: usage.output + res.usage.output,
        cached: (usage.cached || 0) + (res.usage.cached || 0),
      };
      parsed = parseJsonLoose(res.text);
    }

    if (!hasAll(parsed, input.sections)) {
      throw new ProviderError('The model returned an unexpected format. Try again or switch models.', {
        status: 502,
        provider: adapter.label,
        code: 'bad_output',
      });
    }

    const drafts = {};
    for (const s of input.sections) {
      const text = cleanDoc(parsed[s], s);
      drafts[s] = { text, quality: checkQuality(text, { type: s }) };
    }

    const result = {
      provider: adapter.id,
      model,
      tone: input.tone,
      analysis: publicAnalysis(analysis),
      drafts,
    };
    cache.set(key, result);
    return { ...result, cached: false, usage };
  };
}
