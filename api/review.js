import { route, structured, profileOf, block } from "./_lib/llm.js";
import { REVIEW_SYSTEM, resumeSystem } from "./_lib/prompts.js";
import { resumeSchema } from "./_lib/schemas.js";
import { autofix, lintResume } from "./_lib/lint.js";

export const config = { maxDuration: 60 };

export default route(async (req, body) => {
  const { jd, analysis, resume, stretch = false, instruction } = body;
  if (!analysis || !resume) throw Object.assign(new Error("analysis and resume are required"), { status: 400 });
  const profile = profileOf(body);
  const before = lintResume(resume, profile, { stretch, analysis });

  const parts = [
    block("hiring_brief", analysis),
    block("job_description", jd || ""),
    block("master_profile", profile),
    block("resume", resume),
    block("lint_report", before.length ? before : "No lint issues."),
  ];
  if (instruction) parts.push(block("user_revision_request", instruction));

  const reviewed = await structured(req, {
    // the writing rules travel with the reviewer so fixes obey the same spec
    system: `${REVIEW_SYSTEM}\n\nTHE WRITING SPEC YOU ENFORCE:\n${resumeSystem({ stretch })}`,
    schema: resumeSchema,
    temperature: 0.3,
    user: parts.join("\n\n"),
  });
  const fixed = autofix(reviewed);
  return { resume: fixed, issues: lintResume(fixed, profile, { stretch, analysis }), resolved: before.length };
});
