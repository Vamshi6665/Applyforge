import { route, structured, profileOf, block } from "./_lib/llm.js";
import { resumeSystem } from "./_lib/prompts.js";
import { resumeSchema } from "./_lib/schemas.js";
import { autofix, lintResume } from "./_lib/lint.js";

export const config = { maxDuration: 60 };

export default route(async (req, body) => {
  const { jd, analysis, stretch = false } = body;
  if (!jd || !analysis) throw Object.assign(new Error("jd and analysis are required"), { status: 400 });
  const profile = profileOf(body);
  const draft = await structured(req, {
    system: resumeSystem({ stretch }),
    schema: resumeSchema,
    temperature: 0.5,
    user: [
      block("hiring_brief", analysis),
      block("job_description", jd),
      block("master_profile", profile),
      ...(Array.isArray(body.examples) && body.examples.length ? [block("approved_examples", body.examples.slice(0, 2))] : []),
    ].join("\n\n"),
  });
  const resume = autofix(draft);
  return { resume, issues: lintResume(resume, profile, { stretch, analysis }) };
});
