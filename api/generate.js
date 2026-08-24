import OpenAI from "openai";
import { buildSystem, OUTPUT_CONTRACT } from "./_profile.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });

  const { mode, jobDescription, sampleResume, sampleEmail, sampleLinkedin, current, instruction } = req.body || {};
  const system = buildSystem(sampleResume, sampleEmail, sampleLinkedin);

  try {
    let userContent;

    if (mode === "revise") {
      if (!current || !instruction) return res.status(400).json({ error: "Missing current outputs or instruction." });
      userContent =
        `Here are the CURRENT outputs as JSON:\n${JSON.stringify(current)}\n\n` +
        `The candidate wants this change:\n"${instruction}"\n\n` +
        `Apply the change. Keep everything else the same unless the change requires otherwise. ` +
        `Keep the keyword analysis accurate. Return the FULL updated set as JSON in the same shape. ${OUTPUT_CONTRACT}`;
    } else {
      if (!jobDescription || jobDescription.trim().length < 40) return res.status(400).json({ error: "Job description too short." });
      userContent =
        `JOB DESCRIPTION:\n\n${jobDescription}\n\n` +
        `Step 1: Extract the important keywords/skills/tools from this JD. Sort each into "have" (supported by his resume/profile), ` +
        `"relevantMissing" (not present but adjacent and safe to bridge honestly), or "differentMissing" (genuinely outside his experience — do NOT add these anywhere).\n` +
        `Step 2: Generate all outputs, weaving in the "have" and "relevantMissing" keywords naturally. Follow the email 3-paragraph structure and the LinkedIn template exactly.\n` +
        `Return everything as JSON.`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.6,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: userContent },
      ],
    });
    const parsed = JSON.parse(completion.choices[0].message.content);
    return res.status(200).json(parsed);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Generation failed. Try again." });
  }
}
