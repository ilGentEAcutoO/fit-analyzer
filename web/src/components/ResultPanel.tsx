import type { FitReport } from '../lib/types';
import { ScoreGauge } from './ScoreGauge';
import { DimensionBar } from './DimensionBar';
import { FindingList } from './FindingList';

export type AppState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'done'; report: FitReport }
  | { kind: 'error'; message: string }
  | { kind: 'rateLimited' };

interface Props {
  state: AppState;
}

function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-slate-200 ${className}`} />;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center space-y-3">
        <SkeletonBlock className="w-44 h-44 rounded-full" />
        <SkeletonBlock className="w-24 h-3" />
      </div>
      <SkeletonBlock className="w-full h-4" />
      <div className="space-y-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <SkeletonBlock className="w-32 h-3" />
            <SkeletonBlock className="w-full h-2" />
            <SkeletonBlock className="w-3/4 h-3" />
          </div>
        ))}
      </div>
    </div>
  );
}

function IdleHint() {
  return (
    <div className="h-full flex items-center justify-center text-center px-6 py-12">
      <div className="max-w-sm">
        <p className="font-serif text-2xl text-slate-700 leading-snug">
          Drop a resume and paste a job description.
        </p>
        <p className="mt-3 text-sm text-slate-500">
          You will get a score, four dimensions, and a short list of gaps with concrete
          fixes.
        </p>
      </div>
    </div>
  );
}

function RateLimitedPanel() {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-6 text-center">
      <p className="font-serif text-xl text-amber-900">Give it a minute.</p>
      <p className="mt-2 text-sm text-amber-800">
        You have hit the per-minute analysis limit. Try again shortly.
      </p>
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-6">
      <p className="font-mono text-[11px] uppercase tracking-widest text-score-bad mb-2">
        Something went wrong
      </p>
      <p className="text-sm text-slate-700">{message}</p>
    </div>
  );
}

function Report({ report }: { report: FitReport }) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center text-center">
        <ScoreGauge score={report.overallScore} verdict={report.verdict} />
        <p className="mt-4 max-w-md font-serif text-lg text-slate-800 leading-snug">
          {report.summary}
        </p>
      </div>

      <section className="space-y-5">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">
          Dimensions
        </h3>
        <div className="space-y-4">
          {report.dimensions.map((d) => (
            <DimensionBar key={d.key} dimension={d} />
          ))}
        </div>
      </section>

      <FindingList
        strengths={report.strengths}
        gaps={report.gaps}
        suggestions={report.suggestions}
      />
    </div>
  );
}

export function ResultPanel({ state }: Props) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white/60 p-6 md:p-8 min-h-[24rem]">
      {state.kind === 'idle' && <IdleHint />}
      {state.kind === 'loading' && <LoadingSkeleton />}
      {state.kind === 'rateLimited' && <RateLimitedPanel />}
      {state.kind === 'error' && <ErrorPanel message={state.message} />}
      {state.kind === 'done' && <Report report={state.report} />}
    </div>
  );
}
