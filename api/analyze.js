import { route, structured, profileOf, block } from "./_lib/llm.js";
import { ANALYZE_SYSTEM } from "./_lib/prompts.js";
import { analysisSchema } from "./_lib/schemas.js";
import { correlate, unbacked } from "./_lib/terms.js";

export const config = { maxDuration: 60 };

export default route(async (req, body) => {
  const jd = (body.jd || "").trim();
  if (jd.length < 200) throw Object.assign(new Error("Paste the full job description (at least a few paragraphs)."), { status: 400 });
  const profile = profileOf(body);
  const analysis = await structured(req, {
    system: ANALYZE_SYSTEM,
    schema: analysisSchema,
    temperature: 0.2,
    user: [block("job_description", jd), block("master_profile", profile)].join("\n\n"),
  });
  // deterministic JD ↔ profile term map: what he has, what is bridgeable, what is a true gap
  analysis.term_map = { ...correlate(jd, profile), unbacked: unbacked(profile) };
  return { analysis };
});
