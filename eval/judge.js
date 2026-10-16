// Recruiter + hiring-manager judge. Scores each application the way a screener and the
// hiring manager would, and names concrete problems and rule changes.

const str = { type: "string" };
const score = { type: "integer", enum: [1, 2, 3, 4, 5] };
const obj = (p) => ({ type: "object", additionalProperties: false, required: Object.keys(p), properties: p });

export const judgeSchema = {
  name: "recruiter_judgment",
  strict: true,
  schema: obj({
    eight_second_take: str,
    scores: obj({
      role_fit: score,
      mandate_coverage: score,
      technical_soundness: score,
      naturalness: score,
      impact: score,
      honesty: score,
      structure: score,
      outreach: score,
    }),
    decision: { type: "string", enum: ["advance", "maybe", "reject"] },
    strengths: { type: "array", items: str },
    problems: { type: "array", items: obj({ section: str, issue: str, severity: { type: "string", enum: ["high", "medium", "low"] } }) },
    missing_for_this_jd: { type: "array", items: str },
    rule_suggestions: { type: "array", items: str },
  }),
};

export const JUDGE_SYSTEM = `You are two people reviewing one job application together:
1. A senior technical recruiter who screens 200 resumes a day for this exact role.
2. The hiring manager for the role, a staff-level practitioner in its discipline.

You receive the job description, the candidate's tailored resume, the recruiter email, the LinkedIn note, and the candidate's master profile (the truth about what he has done).

Judge strictly, as you would in a real pipeline. Do not grade on effort.

Scores (1 = poor, 3 = acceptable, 5 = excellent):
- role_fit: in an 8-second scan, does this read as a strong candidate for THIS role (title, summary, first bullets)?
- mandate_coverage: does it prove the core mandate and the must-haves the candidate actually has?
- technical_soundness: would every bullet survive a technical interview (tool order, tool capability, believable scale)?
- naturalness: do technologies appear because they did work, or does it read keyword-stuffed or templated?
- impact: are outcomes concrete, with metrics where real?
- honesty: compare against the master profile. Any claim of tools, domains, scale, or results he does not have lowers this sharply.
- structure: does each role read as a coherent scope of ownership (distinct stages, strongest proof first), with clean one-page formatting?
- outreach: is the email specific to this role and team, three paragraphs, concise, and is the LinkedIn note natural and under 300 characters?

decision: would the recruiter advance this to the hiring manager?
problems: concrete, located ("DXC bullet 3", "Skills", "Email P2"), with severity.
missing_for_this_jd: things the JD wants that the resume does not show; say whether the profile has them (resume omission) or not (true gap).
rule_suggestions: changes to the generator's rules that would fix the problems for every future JD, not just this one.

Return only the JSON object.`;

export function judgeInput(jd, result, profile, resumeAsText) {
  const o = result.outreach || {};
  return [
    `<job_description>\n${jd.text}\n</job_description>`,
    `<tailored_resume>\n${resumeAsText}\n</tailored_resume>`,
    `<recruiter_email>\n${o.emails?.[0] ? `Subject: ${o.emails[0].subject}\n\n${o.emails[0].body}` : "(none)"}\n</recruiter_email>`,
    `<linkedin_note>\n${o.linkedin?.[0]?.text || "(none)"}\n</linkedin_note>`,
    `<master_profile>\n${JSON.stringify(profile)}\n</master_profile>`,
  ].join("\n\n");
}
