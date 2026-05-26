import type { Gap, Severity, Strength, Suggestion } from '../lib/types';

interface Props {
  strengths: Strength[];
  gaps: Gap[];
  suggestions: Suggestion[];
}

function severityClass(s: Severity): string {
  if (s === 'high') return 'bg-score-bad/15 text-score-bad';
  if (s === 'medium') return 'bg-score-mid/20 text-amber-700';
  return 'bg-slate-200 text-slate-600';
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500 mb-3">
      {children}
    </h3>
  );
}

export function FindingList({ strengths, gaps, suggestions }: Props) {
  return (
    <div className="space-y-8">
      {strengths.length > 0 && (
        <section>
          <Kicker>Strengths</Kicker>
          <ul className="space-y-3">
            {strengths.map((s, i) => (
              <li key={i} className="border-l-2 border-score-good pl-3">
                <p className="text-sm text-slate-800">{s.point}</p>
                <p className="text-xs text-slate-500 mt-0.5 italic">{s.evidence}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(gaps.length > 0 || suggestions.length > 0) && (
        <section>
          <Kicker>Gaps and fixes</Kicker>
          <ul className="space-y-4">
            {gaps.map((g, i) => {
              const fix = suggestions[i];
              return (
                <li key={i} className="rounded-md border border-slate-200 bg-white p-3">
                  <div className="flex items-start gap-2">
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider font-medium ${severityClass(
                        g.severity,
                      )}`}
                    >
                      {g.severity}
                    </span>
                    <p className="text-sm text-slate-800 flex-1">{g.point}</p>
                  </div>
                  {fix && (
                    <div className="mt-2 pl-2 border-l-2 border-slate-300">
                      <p className="text-sm text-slate-700">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mr-2">
                          fix
                        </span>
                        {fix.action}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{fix.rationale}</p>
                    </div>
                  )}
                </li>
              );
            })}
            {suggestions.slice(gaps.length).map((s, i) => (
              <li
                key={`extra-${i}`}
                className="rounded-md border border-slate-200 bg-white p-3"
              >
                <p className="text-sm text-slate-800">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mr-2">
                    fix
                  </span>
                  {s.action}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{s.rationale}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
