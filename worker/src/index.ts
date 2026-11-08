import { SYSTEM_PROMPT, buildUserTurn, FIT_REPORT_SCHEMA, USER_DATA_SEP } from "./prompt";

export interface Env {
  GEMINI_API_KEY: string;
  ALLOW_ORIGIN: string;
  RATE_LIMITER: { limit: (o: { key: string }) => Promise<{ success: boolean }> };
  ASSETS: { fetch: (req: Request) => Promise<Response> };
}

const MAX_FIELD = 15000;
const MAX_BODY = 50000;
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "worker-src 'self' blob:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
].join("; ");
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent";

function json(obj: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", ...cors },
  });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    // non-API requests → static SPA assets (handled by Cloudflare Workers Assets)
    if (url.pathname !== "/api/analyze") {
      const res = await env.ASSETS.fetch(req);
      const r = new Response(res.body, res);
      r.headers.set("Content-Security-Policy", CSP);
      r.headers.set("X-Frame-Options", "DENY");
      r.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
      return r;
    }

    const cors = {
      "Access-Control-Allow-Origin": env.ALLOW_ORIGIN,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (req.method !== "POST") return json({ error: "method" }, 405, cors);

    const ip = req.headers.get("CF-Connecting-IP");
    if (!ip) return json({ error: "bad_input" }, 400, cors);
    const { success } = await env.RATE_LIMITER.limit({ key: ip });
    if (!success) return json({ error: "rate_limited" }, 429, cors);

    const len = Number(req.headers.get("content-length") ?? "0");
    if (len > MAX_BODY) return json({ error: "bad_input" }, 400, cors);

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
    if (resume.includes(USER_DATA_SEP) || jd.includes(USER_DATA_SEP)) {
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
    if (!res.ok) {
      // Surface Gemini's own rate-limit/quota as our 429 so the frontend
      // shows the same "give it a minute" UI rather than a generic error
      // (the user action — wait and retry — is the same either way).
      // Body is logged to `wrangler tail` only — never echoed in client response.
      console.warn("gemini upstream non-ok:", res.status, await res.clone().text());
      if (res.status === 429) return json({ error: "rate_limited" }, 429, cors);
      return json({ error: "upstream" }, 502, cors);
    }

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
