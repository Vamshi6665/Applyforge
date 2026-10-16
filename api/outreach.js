import { route, structured, text, profileOf, block } from "./_lib/llm.js";
import { OUTREACH_SYSTEM, SHORTEN_LINKEDIN } from "./_lib/prompts.js";
import { outreachSchema } from "./_lib/schemas.js";
import { enforceLinkedIn } from "./_lib/lint.js";

export const config = { maxDuration: 60 };

const stripSignoff = (body) =>
  body
    .replace(/\n+(best regards|regards|sincerely|thanks|thank you|warm regards)[\s\S]*$/i, "")
    .replace(/\s*(—|--)\s*/g, ", ")
    .trim();

export default route(async (req, body) => {
  const { jd, analysis, resume, recipient = "", company = "" } = body;
  if (!analysis || !resume) throw Object.assign(new Error("analysis and resume are required"), { status: 400 });
  const profile = profileOf(body);

  const out = await structured(req, {
    system: OUTREACH_SYSTEM,
    schema: outreachSchema,
    temperature: 0.5,
    user: [
      block("recipient_name", recipient || "unknown"),
      block("company", company || analysis.company || "unknown"),
      block("hiring_brief", analysis),
      block("tailored_resume", resume),
      block("job_description", jd || ""),
    ].join("\n\n"),
  });

  const signature = profile.signature.join("\n");
  const emails = out.emails.map((e) => ({ ...e, subject: e.subject.replace(/(—|--)/g, "|"), body: `${stripSignoff(e.body)}\n\n${signature}` }));

  const linkedin = [];
  for (const n of out.linkedin) {
    let t = n.text.replace(/\s+/g, " ").trim();
    if (t.length > 300) t = await text(req, { system: SHORTEN_LINKEDIN, user: t });
    linkedin.push({ label: n.label, text: enforceLinkedIn(t) });
  }
  return { emails, linkedin };
});
