// JSON Schemas for OpenAI structured outputs (strict mode: every key required, no extras).

const str = { type: "string" };
const strArr = { type: "array", items: str };
const obj = (properties) => ({
  type: "object",
  additionalProperties: false,
  required: Object.keys(properties),
  properties,
});

export const ARCHETYPES = [
  "data_analyst_bi",
  "data_engineer",
  "analytics_engineer",
  "data_scientist_ml",
  "ml_llm_engineer",
  "software_engineer",
  "business_analyst",
  "product_analyst",
  "other",
];

const evidenced = obj({ item: str, evidence: str });

export const analysisSchema = {
  name: "jd_analysis",
  strict: true,
  schema: obj({
    role_title: str,
    company: str,
    seniority: { type: "string", enum: ["entry", "mid", "senior", "lead", "unclear"] },
    archetype: { type: "string", enum: ARCHETYPES },
    archetype_rationale: str,
    core_mandate: str,
    ownership_mode: str,
    business_context: str,
    success_signals: strArr,
    primary_stack: { type: "array", items: evidenced },
    secondary_stack: strArr,
    must_haves: strArr,
    nice_to_haves: strArr,
    operating_expectations: strArr,
    fit: obj({
      strong_matches: { type: "array", items: evidenced },
      bridgeable: { type: "array", items: obj({ item: str, bridge: str }) },
      true_gaps: strArr,
    }),
    requirement_map: {
      type: "array",
      items: obj({ requirement: str, jd_wording: str, role_id: { type: "string", enum: ["lama", "nwmsu", "dxc", "none"] }, evidence: str }),
    },
    strategy: obj({
      headline: str,
      summary_angle: str,
      role_emphasis: { type: "array", items: obj({ role_id: str, lead_with: str, frame_in_stack: strArr }) },
      skill_category_order: strArr,
      bullet_allocation: { type: "array", items: obj({ role_id: str, bullets: { type: "integer" }, why: str }) },
    }),
  }),
};

// arc_step: which stage of the archetype's industry arc this bullet covers (planning field, not rendered)
const bullet = obj({ arc_step: str, label: str, text: str });

export const resumeSchema = {
  name: "tailored_resume",
  strict: true,
  schema: obj({
    headline: str,
    summary: str,
    experience: {
      type: "array",
      items: obj({
        role_id: str,
        company: str,
        title: str,
        location: str,
        dates: str,
        bullets: { type: "array", items: bullet },
      }),
    },
    skills: { type: "array", items: obj({ category: str, items: strArr }) },
    certifications: strArr,
    review_notes: obj({
      stretched_claims: { type: "array", items: obj({ claim: str, real_basis: str }) },
      suggested_metrics: { type: "array", items: obj({ where: str, metric_idea: str }) },
    }),
  }),
};

const emailVariant = obj({ label: str, subject: str, body: str });

export const outreachSchema = {
  name: "outreach",
  strict: true,
  schema: obj({
    emails: { type: "array", items: emailVariant },
    linkedin: { type: "array", items: obj({ label: str, text: str }) },
  }),
};
