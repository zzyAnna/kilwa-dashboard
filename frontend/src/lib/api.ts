const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface FieldStat {
  field_name: string;
  total_count: number;
  null_count: number;
  null_percentage: number;
  non_null_percentage: number;
}

export interface ScraperHealth {
  total_articles: number;
  field_stats: FieldStat[];
  source_breakdown?: Record<string, number>;
  language_breakdown?: Record<string, number>;
}

export interface SentimentResult {
  text: string;
  vader: {
    score: number;
    label: string;
  };
  textblob: {
    polarity: number;
    subjectivity: number;
    label: string;
  };
}

export interface ModelComparison {
  text: string;
  vader: {
    compound: number;
    pos: number;
    neg: number;
    neu: number;
    label: string;
  };
  textblob: {
    polarity: number;
    subjectivity: number;
    label: string;
  };
  difference: number;
}

export async function getScraperHealth(): Promise<ScraperHealth> {
  const res = await fetch(`${API_BASE}/api/scraper/health`);
  if (!res.ok) throw new Error('Failed to fetch scraper health');
  return res.json();
}

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  const res = await fetch(`${API_BASE}/api/sentiment/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error('Failed to analyze sentiment');
  return res.json();
}

export async function compareModels(text: string): Promise<ModelComparison> {
  const res = await fetch(`${API_BASE}/api/sentiment/compare-models`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error('Failed to compare models');
  return res.json();
}
