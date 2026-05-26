import type { FitReport } from './types';

export type Result =
  | { ok: true; data: FitReport }
  | { ok: false; kind: 'rate_limited' | 'bad_input' | 'upstream' | 'network' };

const BASE = import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:8787';

export async function analyze(resume: string, jd: string): Promise<Result> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume, jd }),
    });
  } catch {
    return { ok: false, kind: 'network' };
  }

  if (res.ok) {
    try {
      const data = (await res.json()) as FitReport;
      return { ok: true, data };
    } catch {
      return { ok: false, kind: 'upstream' };
    }
  }

  if (res.status === 429) return { ok: false, kind: 'rate_limited' };
  if (res.status === 400) return { ok: false, kind: 'bad_input' };
  return { ok: false, kind: 'upstream' };
}
