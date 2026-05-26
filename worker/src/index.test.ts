import { afterEach, describe, expect, it, vi } from "vitest";
import worker, { type Env } from "./index";

function makeEnv(overrides: Partial<Env> = {}): Env {
  return {
    GEMINI_API_KEY: "test-key",
    ALLOW_ORIGIN: "http://localhost:5173",
    RATE_LIMITER: { limit: async () => ({ success: true }) },
    ASSETS: { fetch: async () => new Response("not-found", { status: 404 }) },
    ...overrides,
  };
}

function postJson(payload: unknown): Request {
  return new Request("http://x/api/analyze", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}

describe("worker /api/analyze", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("empty body field → 400 bad_input", async () => {
    const res = await worker.fetch(postJson({ resume: "", jd: "" }), makeEnv());
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "bad_input" });
  });

  it("field over 15000 chars → 400 bad_input", async () => {
    const big = "a".repeat(15001);
    const res = await worker.fetch(postJson({ resume: big, jd: "ok" }), makeEnv());
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "bad_input" });
  });

  it("Gemini returns non-JSON text → 502 parse", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            candidates: [{ content: { parts: [{ text: "not-json-at-all" }] } }],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      ),
    );
    const res = await worker.fetch(
      postJson({ resume: "resume text", jd: "jd text" }),
      makeEnv(),
    );
    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({ error: "parse" });
  });

  it("rate limiter denies → 429 rate_limited", async () => {
    const env = makeEnv({
      RATE_LIMITER: { limit: async () => ({ success: false }) },
    });
    const res = await worker.fetch(postJson({ resume: "r", jd: "j" }), env);
    expect(res.status).toBe(429);
    await expect(res.json()).resolves.toEqual({ error: "rate_limited" });
  });

  it("Gemini upstream 429 (quota/rate) → 429 rate_limited", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ error: { code: 429, status: "RESOURCE_EXHAUSTED" } }), {
          status: 429,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
    const res = await worker.fetch(
      postJson({ resume: "resume text", jd: "jd text" }),
      makeEnv(),
    );
    expect(res.status).toBe(429);
    await expect(res.json()).resolves.toEqual({ error: "rate_limited" });
  });

  it("Gemini upstream 5xx → 502 upstream (generic)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ error: "server" }), { status: 503 }),
      ),
    );
    const res = await worker.fetch(
      postJson({ resume: "resume text", jd: "jd text" }),
      makeEnv(),
    );
    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({ error: "upstream" });
  });
});
