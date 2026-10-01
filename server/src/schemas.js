import { z } from 'zod';
import { SECTIONS, TONES } from './prompts/builders.js';

const shortStr = (max) => z.string().trim().max(max);

export const profileSchema = z.object({
  name: shortStr(120).min(1, 'Profile name is required'),
  firstName: shortStr(60).optional().default(''),
  headline: shortStr(160).min(1, 'Headline is required'),
  years: shortStr(20).default(''),
  location: shortStr(120).optional().default(''),
  email: shortStr(160).optional().default(''),
  linkedin: shortStr(200).optional().default(''),
  education: shortStr(300).default(''),
  educationShort: shortStr(120).optional().default(''),
  certifications: z.array(shortStr(80)).max(30).default([]),
  certsShort: shortStr(200).optional().default(''),
  skills: z.array(shortStr(60)).max(150).default([]),
  metrics: z.array(shortStr(240)).max(20).default([]),
  experience: z
    .array(
      z.object({
        role: shortStr(120).default(''),
        org: shortStr(160).default(''),
        dates: shortStr(60).default(''),
        summary: shortStr(800).default(''),
      }),
    )
    .max(12)
    .default([]),
  goldEmail: shortStr(5000).optional().default(''),
  goldLinkedin: shortStr(600).optional().default(''),
  resumeText: shortStr(12000).optional().default(''),
});

const selection = {
  provider: z.string().trim().max(40).optional(),
  model: z.string().trim().max(120).optional(),
};

const jdField = z
  .string({ required_error: 'Paste a job description first.' })
  .trim()
  .min(80, 'That job description looks too short. Paste the full posting.')
  .max(60000, 'That job description is too long. Paste just the posting text.');

export const analyzeSchema = z.object({
  jd: z.string().max(60000).default(''),
  profile: profileSchema.optional(),
});

export const generateSchema = z.object({
  jd: jdField,
  profile: profileSchema.optional(),
  sections: z.array(z.enum(SECTIONS)).min(1, 'Pick at least one document.').max(SECTIONS.length).default(['email', 'linkedin']),
  tone: z.enum(TONES).default('metrics'),
  role: shortStr(120).optional(),
  company: shortStr(120).optional(),
  fresh: z.boolean().optional().default(false),
  ...selection,
});

export const chatSchema = z.object({
  message: z.string().trim().min(1, 'Type a message.').max(4000),
  docType: z.enum([...SECTIONS, 'general']).default('general'),
  draft: z.string().max(12000).optional().default(''),
  jd: z.string().max(60000).optional().default(''),
  role: shortStr(120).optional(),
  company: shortStr(120).optional(),
  history: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(20000) }))
    .max(60)
    .optional()
    .default([]),
  profile: profileSchema.optional(),
  ...selection,
});
