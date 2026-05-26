import { useState } from 'react';
import { InputPanel } from './components/InputPanel';
import { ResultPanel, type AppState } from './components/ResultPanel';
import { analyze } from './lib/api';

export default function App() {
  const [state, setState] = useState<AppState>({ kind: 'idle' });

  async function handleSubmit(resume: string, jd: string) {
    setState({ kind: 'loading' });
    const result = await analyze(resume, jd);
    if (result.ok) {
      setState({ kind: 'done', report: result.data });
      return;
    }
    if (result.kind === 'rate_limited') {
      setState({ kind: 'rateLimited' });
      return;
    }
    const message =
      result.kind === 'bad_input'
        ? 'The input was rejected. Make sure both fields have real content.'
        : result.kind === 'network'
        ? 'Could not reach the analyzer. Check that the worker is running.'
        : 'The analyzer returned an unexpected response. Try again.';
    setState({ kind: 'error', message });
  }

  return (
    <div className="min-h-full">
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <h1 className="font-serif text-3xl text-ink leading-none">Fit Analyzer</h1>
          <p className="mt-2 text-sm text-slate-600 max-w-2xl">
            Drop a resume, paste a job description, get a candid read on fit — score,
            four dimensions, and concrete fixes for each gap.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputPanel onSubmit={handleSubmit} loading={state.kind === 'loading'} />
          <ResultPanel state={state} />
        </div>
      </main>
    </div>
  );
}
