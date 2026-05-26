import { SYSTEM_PROMPT, buildUserTurn, FIT_REPORT_SCHEMA } from "./prompt";

export interface Env {
  GEMINI_API_KEY: string;
  ALLOW_ORIGIN: string;
  RATE_LIMITER: { limit: (o: { key: string }) => Promise<{ success: boolean }> };
}

const MAX_FIELD = 15000;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent";

function json(obj: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", ...cors },
  });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const cors = {
      "Access-Control-Allow-Origin": env.ALLOW_ORIGIN,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (req.method !== "POST") return json({ error: "method" }, 405, cors);

    const ip = req.headers.get("CF-Connecting-IP") ?? "unknown";
    const { success } = await env.RATE_LIMITER.limit({ key: ip });
    if (!success) return json({ error: "rate_limited" }, 429, cors);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return json({ error: "bad_input" }, 400, cors);
    }
    if (!body || typeof body !== "object") return json({ error: "bad_input" }, 400, cors);
    const { resume, jd } = body as { resume?: unknown; jd?: unknown };
    if (
      typeof resume !== "string" ||
      typeof jd !== "string" ||
      resume.length === 0 ||
      jd.length === 0 ||
      resume.length > MAX_FIELD ||
      jd.length > MAX_FIELD
    ) {
      return json({ error: "bad_input" }, 400, cors);
    }

    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: buildUserTurn(jd, resume) }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: FIT_REPORT_SCHEMA,
        },
      }),
    });
    if (!res.ok) return json({ error: "upstream" }, 502, cors);

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    try {
      return json(JSON.parse(raw), 200, cors);
    } catch {
      return json({ error: "parse" }, 502, cors);
    }
  },
};
