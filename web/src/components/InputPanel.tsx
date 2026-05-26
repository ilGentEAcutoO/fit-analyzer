import { useCallback, useRef, useState } from 'react';
import { extractTextFromPdf } from '../lib/pdf';

interface Props {
  onSubmit: (resume: string, jd: string) => void;
  loading: boolean;
}

export function InputPanel({ onSubmit, loading }: Props) {
  const [resume, setResume] = useState('');
  const [jd, setJd] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [pdfHint, setPdfHint] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setParsing(true);
    setPdfHint(null);
    const text = await extractTextFromPdf(file);
    setParsing(false);
    if (text.length === 0) {
      setPdfHint('Could not extract text — paste resume below instead.');
      return;
    }
    setResume(text);
    setPdfHint(`Extracted ${text.length.toLocaleString()} chars from ${file.name}`);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type === 'application/pdf') {
        void handleFile(file);
      } else if (file) {
        setPdfHint('Only PDF files are supported here. Paste text below instead.');
      }
    },
    [handleFile],
  );

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  };

  const canSubmit =
    !loading && !parsing && resume.trim().length > 0 && jd.trim().length > 0;

  return (
    <div className="rounded-lg border border-slate-200 bg-white/60 p-6 md:p-8 space-y-6">
      <div>
        <label className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">
          Resume
        </label>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mt-2 rounded-md border-2 border-dashed p-4 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-slate-700 bg-slate-50'
              : 'border-slate-300 hover:border-slate-400'
          }`}
        >
          <p className="text-sm text-slate-600">
            {parsing ? 'Reading PDF…' : 'Drop a PDF here or click to choose'}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={onFileInput}
          />
        </div>
        {pdfHint && (
          <p className="mt-2 text-xs text-slate-500 font-mono">{pdfHint}</p>
        )}
        <textarea
          value={resume}
          onChange={(e) => setResume(e.target.value)}
          placeholder="…or paste the resume text directly"
          className="mt-3 w-full h-40 resize-y rounded-md border border-slate-300 bg-white p-3 text-sm font-mono leading-snug focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>

      <div>
        <label className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">
          Job description
        </label>
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="Paste the job description here"
          className="mt-2 w-full h-40 resize-y rounded-md border border-slate-300 bg-white p-3 text-sm font-mono leading-snug focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>

      <button
        type="button"
        disabled={!canSubmit}
        onClick={() => onSubmit(resume.trim(), jd.trim())}
        className="w-full rounded-md bg-ink py-3 text-sm font-medium uppercase tracking-widest text-paper hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Analyzing…' : 'Analyze fit'}
      </button>
    </div>
  );
}
