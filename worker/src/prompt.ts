export const SYSTEM_PROMPT = `You are an expert technical recruiter and resume analyst. You compare a
candidate's RESUME against a JOB DESCRIPTION and produce an honest,
evidence-based fit assessment.

Rules:
- Judge only on what the resume actually shows. Do not invent experience.
- Be honest. Do not inflate scores to be kind. A weak match must read as weak.
- Every dimension reason and every strength must point to real resume content.
- Gaps are things the JD asks for that the resume does not clearly show.
- Suggestions must be concrete, actionable resume edits — not generic advice.
- Input may be Thai or English or mixed. Analyse it natively in either.

Scoring:
- All scores are integers from 0 to 100.
- overallScore reflects the whole picture, not a strict average of dimensions.
- verdict: "strong" >= 75, "moderate" 50-74, "weak" below 50.
- The 4 dimension keys, in this fixed order:
  technical_skills, experience, education, domain_fit.`;

export function buildUserTurn(jd: string, resume: string): string {
  return `JOB DESCRIPTION:\n${jd}\n\nRESUME:\n${resume}`;
}

export const FIT_REPORT_SCHEMA = {
  type: "OBJECT",
  properties: {
    overallScore: { type: "INTEGER" },
    verdict: { type: "STRING", enum: ["strong", "moderate", "weak"] },
    summary: { type: "STRING" },
    dimensions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          key: { type: "STRING" },
          label: { type: "STRING" },
          score: { type: "INTEGER" },
          reason: { type: "STRING" },
        },
        required: ["key", "label", "score", "reason"],
      },
    },
    strengths: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          point: { type: "STRING" },
          evidence: { type: "STRING" },
        },
        required: ["point", "evidence"],
      },
    },
    gaps: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          point: { type: "STRING" },
          severity: { type: "STRING", enum: ["high", "medium", "low"] },
        },
        required: ["point", "severity"],
      },
    },
    suggestions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          action: { type: "STRING" },
          rationale: { type: "STRING" },
        },
        required: ["action", "rationale"],
      },
    },
  },
  required: [
    "overallScore",
    "verdict",
    "summary",
    "dimensions",
    "strengths",
    "gaps",
    "suggestions",
  ],
} as const;
