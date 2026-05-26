import type { Verdict } from '../lib/types';

interface Props {
  score: number;
  verdict: Verdict;
}

function bandColor(score: number): string {
  if (score >= 75) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

function bandTextClass(score: number): string {
  if (score >= 75) return 'text-score-good';
  if (score >= 50) return 'text-score-mid';
  return 'text-score-bad';
}

export function ScoreGauge({ score, verdict }: Props) {
  const clamped = Math.max(0, Math.min(100, score));
  const color = bandColor(clamped);
  const angle = (clamped / 100) * 360;
  const ringStyle: React.CSSProperties = {
    background: `conic-gradient(${color} ${angle}deg, #e5e7eb 0deg)`,
  };

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative w-44 h-44 rounded-full flex items-center justify-center"
        style={ringStyle}
        aria-label={`Overall fit score ${clamped} out of 100`}
        role="img"
      >
        <div className="absolute inset-3 rounded-full bg-paper flex flex-col items-center justify-center">
          <span className={`font-serif text-5xl leading-none ${bandTextClass(clamped)}`}>
            {clamped}
          </span>
          <span className="mt-1 text-[10px] uppercase tracking-widest text-slate-500">
            out of 100
          </span>
        </div>
      </div>
      <span className="mt-3 text-sm uppercase tracking-widest text-slate-700">
        {verdict}
      </span>
    </div>
  );
}
