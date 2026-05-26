export type Verdict = 'strong' | 'moderate' | 'weak';
export type Severity = 'high' | 'medium' | 'low';
export type DimensionKey =
  | 'technical_skills'
  | 'experience'
  | 'education'
  | 'domain_fit';

export interface Dimension {
  key: DimensionKey;
  label: string;
  score: number;
  reason: string;
}

export interface Strength {
  point: string;
  evidence: string;
}

export interface Gap {
  point: string;
  severity: Severity;
}

export interface Suggestion {
  action: string;
  rationale: string;
}

export interface FitReport {
  overallScore: number;
  verdict: Verdict;
  summary: string;
  dimensions: [Dimension, Dimension, Dimension, Dimension];
  strengths: Strength[];
  gaps: Gap[];
  suggestions: Suggestion[];
}
