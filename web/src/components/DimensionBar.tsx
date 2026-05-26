import type { Dimension } from '../lib/types';

interface Props {
  dimension: Dimension;
}

function barColor(score: number): string {
  if (score >= 75) return 'bg-score-good';
  if (score >= 50) return 'bg-score-mid';
  return 'bg-score-bad';
}

export function DimensionBar({ dimension }: Props) {
  const { label, score, reason } = dimension;
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-slate-800">{label}</span>
        <span className="font-mono text-xs text-slate-600">{clamped}/100</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
        <div
          className={`h-full ${barColor(clamped)} transition-[width] duration-500`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <p className="text-xs text-slate-600 leading-snug">{reason}</p>
    </div>
  );
}
