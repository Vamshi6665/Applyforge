import OpenAI from "openai";
import { PROFILE, RULES, OUTPUT_CONTRACT } from "./_profile.js";

// Vercel serverless function. Key stays server-side via env var — never shipped
// to the browser. Set OPENAI_API_KEY in your Vercel project settings.
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST." });
  }
  const { jobDescription } = req.body || {};
  if (!jobDescription || jobDescription.trim().length < 40) {
    return res.status(400).json({ error: "Job description too short." });
  }

  const system = `${PROFILE}\n\n${RULES}\n\n${OUTPUT_CONTRACT}`;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.6,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: `JOB DESCRIPTION:\n\n${jobDescription}\n\nGenerate the tailored outputs now as JSON.` },
      ],
    });
    const parsed = JSON.parse(completion.choices[0].message.content);
    return res.status(200).json(parsed);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Generation failed. Try again." });
  }
}
