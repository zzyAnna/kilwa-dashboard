'use client';

import { useEffect, useState } from 'react';
import { Loader2, Send, Upload, Clock, BarChart3, Globe } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type TabType = 'manual' | 'efficiency' | 'accuracy' | 'translation';

interface ModelResult {
  score: number;
  label: string;
  confidence: number;
  [key: string]: any;
}

interface ComparisonResult {
  text_preview: string;
  models: Record<string, ModelResult>;
  score_range?: number;
  average_score?: number;
  label_agreement?: boolean;
}

interface EfficiencyResult {
  batch_size: number;
  models: Record<string, {
    total_time_seconds?: number;
    avg_time_ms?: number;
    articles_per_second?: number;
    available?: boolean;
    message?: string;
  }>;
  summary?: {
    fastest_model: string;
    vader_vs_finbert_ratio?: number;
  };
}

interface AccuracyResult {
  total_analyzed: number;
  metrics: {
    finbert_available: boolean;
    average_difference?: number;
    average_finbert_score?: number;
    average_traditional_score?: number;
    finbert_bias?: number;
    standard_deviation?: number;
    interpretation?: string;
    message?: string;
  };
  comparisons: Array<{
    article_id: number;
    title: string;
    traditional_score: number;
    finbert_score?: number;
    finbert_vs_traditional?: number;
  }>;
}

export default function SentimentPage() {
  const [activeTab, setActiveTab] = useState<TabType>('manual');
  
  // Manual test state
  const [text, setText] = useState('');
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Efficiency state
  const [efficiency, setEfficiency] = useState<EfficiencyResult | null>(null);
  const [efficiencyLoading, setEfficiencyLoading] = useState(false);
  
  // Accuracy state
  const [accuracy, setAccuracy] = useState<AccuracyResult | null>(null);
  const [accuracyLoading, setAccuracyLoading] = useState(false);
  
  // Upload state
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  const analyzeText = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/sentiment/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, models: ['vader', 'textblob', 'finbert'] }),
      });
      const data = await res.json();
      setComparison(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadEfficiency = async () => {
    setEfficiencyLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/sentiment/efficiency?batch_size=20`);
      const data = await res.json();
      setEfficiency(data);
    } catch (e) {
      console.error(e);
    } finally {
      setEfficiencyLoading(false);
    }
  };

  const loadAccuracy = async () => {
    setAccuracyLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/sentiment/model-accuracy?limit=50`);
      const data = await res.json();
      setAccuracy(data);
    } catch (e) {
      console.error(e);
    } finally {
      setAccuracyLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch(`${API_BASE}/api/sentiment/upload-test`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setUploadResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setUploadLoading(false);
    }
  };

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'efficiency' && !efficiency) loadEfficiency();
    if (activeTab === 'accuracy' && !accuracy) loadAccuracy();
  }, [activeTab]);

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'manual', label: 'Manual Test', icon: Send },
    { id: 'efficiency', label: 'Efficiency Logs', icon: Clock },
    { id: 'accuracy', label: 'Model Accuracy', icon: BarChart3 },
    { id: 'translation', label: 'Translation', icon: Globe },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sentiment Analysis</h1>
        <p className="text-gray-500 mt-1">Compare FinBERT vs VADER + TextBlob</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Manual Test Tab */}
      {activeTab === 'manual' && (
        <div className="space-y-6">
          {/* Text Input Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter text to analyze
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Paste an article or text to test..."
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={analyzeText}
                disabled={loading || !text.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Analyze
                  </>
                )}
              </button>
            </div>
          </div>

          {comparison && <ModelComparisonCard comparison={comparison} />}

          {/* File Upload Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Articles to Test
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Upload a text file (.txt) or JSON file (.json) containing articles to batch test.
              For JSON, use format: {`{"texts": ["article1", "article2"]}`}
            </p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".txt,.json"
                onChange={handleUpload}
                disabled={uploadLoading}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-10 h-10 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  {uploadLoading ? 'Processing...' : 'Click to upload or drag and drop'}
                </span>
                <span className="text-xs text-gray-400 mt-1">TXT, JSON up to 10MB</span>
              </label>
            </div>

            {/* Upload Results */}
            {uploadResult && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Upload Results</h4>
                  <span className="text-sm text-gray-500">
                    {uploadResult.items_analyzed} items analyzed
                  </span>
                </div>

                {/* Summary Stats */}
                {uploadResult.summary && (
                  <div className="grid grid-cols-3 gap-4">
                    {Object.entries(uploadResult.summary).map(([model, stats]: [string, any]) => (
                      <div key={model} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 uppercase">{model}</p>
                        <p className="text-lg font-bold">{stats.avg_score?.toFixed(3)}</p>
                        <p className="text-xs text-gray-400">
                          Range: {stats.min?.toFixed(3)} to {stats.max?.toFixed(3)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Individual Results */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {uploadResult.results?.slice(0, 20).map((r: any, i: number) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm font-medium truncate">{r.text_preview}</p>
                      <div className="flex gap-4 mt-2 text-xs">
                        {Object.entries(r.analysis?.models || {}).map(([model, data]: [string, any]) => (
                          <span key={model} className={`${
                            data.label === 'positive' ? 'text-green-600' :
                            data.label === 'negative' ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {model}: {data.score?.toFixed(3)} ({data.label})
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Efficiency Tab */}
      {activeTab === 'efficiency' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-gray-600">Processing time comparison for each model</p>
            <button
              onClick={loadEfficiency}
              disabled={efficiencyLoading}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              {efficiencyLoading ? 'Running...' : 'Re-run Test'}
            </button>
          </div>

          {efficiencyLoading && !efficiency && (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          )}

          {efficiency && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['vader', 'textblob', 'finbert'].map((model) => {
                const data = efficiency.models[model];
                return (
                  <div key={model} className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold uppercase mb-4">{model}</h3>
                    {data?.available === false ? (
                      <p className="text-yellow-600 text-sm">{data.message}</p>
                    ) : (
                      <div className="space-y-3">
                        <MetricRow label="Total Time" value={`${data?.total_time_seconds}s`} />
                        <MetricRow label="Avg per Article" value={`${data?.avg_time_ms}ms`} />
                        <MetricRow label="Articles/sec" value={data?.articles_per_second} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {efficiency?.summary && (
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Fastest Model:</strong> {efficiency.summary.fastest_model.toUpperCase()}
                {efficiency.summary.vader_vs_finbert_ratio && (
                  <span className="ml-4">
                    VADER is {efficiency.summary.vader_vs_finbert_ratio}x faster than FinBERT
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Accuracy Tab */}
      {activeTab === 'accuracy' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-gray-600">FinBERT vs Traditional (VADER + TextBlob) comparison</p>
            <button
              onClick={loadAccuracy}
              disabled={accuracyLoading}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              {accuracyLoading ? 'Analyzing...' : 'Refresh'}
            </button>
          </div>

          {accuracyLoading && !accuracy && (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          )}

          {accuracy?.metrics && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                  title="Articles Analyzed"
                  value={accuracy.total_analyzed}
                />
                <StatCard
                  title="Avg Difference"
                  value={accuracy.metrics.average_difference?.toFixed(4) || 'N/A'}
                />
                <StatCard
                  title="FinBERT Bias"
                  value={accuracy.metrics.finbert_bias?.toFixed(4) || 'N/A'}
                  subtitle={accuracy.metrics.finbert_bias && accuracy.metrics.finbert_bias > 0 ? 'Overscores' : 'Underscores'}
                />
                <StatCard
                  title="Std Deviation"
                  value={accuracy.metrics.standard_deviation?.toFixed(4) || 'N/A'}
                />
              </div>

              {accuracy.metrics.interpretation && (
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-green-800">{accuracy.metrics.interpretation}</p>
                </div>
              )}

              {/* Scatter Plot - FinBERT vs Traditional */}
              {accuracy.comparisons.some(c => c.finbert_score !== undefined) && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Score Distribution: FinBERT vs Traditional</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid />
                      <XAxis 
                        type="number" 
                        dataKey="traditional_score" 
                        name="Traditional" 
                        domain={[-1, 1]}
                        label={{ value: 'Traditional Score', position: 'bottom', offset: 0 }}
                      />
                      <YAxis 
                        type="number" 
                        dataKey="finbert_score" 
                        name="FinBERT" 
                        domain={[-1, 1]}
                        label={{ value: 'FinBERT Score', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value: any) => value?.toFixed(3)}
                        labelFormatter={() => ''}
                      />
                      <Scatter 
                        name="Articles" 
                        data={accuracy.comparisons.filter(c => c.finbert_score !== undefined).map(c => ({
                          traditional_score: c.traditional_score,
                          finbert_score: c.finbert_score,
                          title: c.title
                        }))} 
                        fill="#3b82f6"
                      >
                        {accuracy.comparisons.filter(c => c.finbert_score !== undefined).map((entry, index) => {
                          const diff = Math.abs((entry.finbert_score || 0) - entry.traditional_score);
                          const color = diff < 0.1 ? '#22c55e' : diff < 0.3 ? '#eab308' : '#ef4444';
                          return <Cell key={`cell-${index}`} fill={color} />;
                        })}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-6 mt-4 text-sm">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" /> Low difference (&lt;0.1)
                    </span>
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" /> Medium (0.1-0.3)
                    </span>
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" /> High (&gt;0.3)
                    </span>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Article</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Traditional</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">FinBERT</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Difference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {accuracy.comparisons.slice(0, 15).map((c) => (
                      <tr key={c.article_id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{c.title}</td>
                        <td className="px-4 py-3 text-sm">{c.traditional_score.toFixed(3)}</td>
                        <td className="px-4 py-3 text-sm">{c.finbert_score?.toFixed(3) || 'N/A'}</td>
                        <td className={`px-4 py-3 text-sm font-medium ${
                          (c.finbert_vs_traditional || 0) > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {c.finbert_vs_traditional?.toFixed(3) || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Translation Tab */}
      {activeTab === 'translation' && (
        <div className="space-y-6">
          <p className="text-gray-600">Compare sentiment scores for translated vs original language articles</p>
          
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              This feature requires articles with <code className="bg-yellow-100 px-1">was_translated</code> flag in the database.
            </p>
          </div>

          <div className="text-center py-12 text-gray-500">
            <Globe className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Translation accuracy analysis coming soon.</p>
            <p className="text-sm mt-2">Will show original vs translated sentiment differences.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ModelComparisonCard({ comparison }: { comparison: ComparisonResult }) {
  const models = comparison.models || {};
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['vader', 'textblob', 'finbert'].map((model) => {
          const data = models[model];
          if (!data) return null;
          
          return (
            <div key={model} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold uppercase mb-4">{model}</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Score</span>
                  <span className={`font-bold ${
                    data.score > 0.1 ? 'text-green-600' :
                    data.score < -0.1 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {data.score.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Label</span>
                  <span className="font-medium capitalize">{data.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Confidence</span>
                  <span>{(data.confidence * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Agreement Status */}
      <div className={`rounded-lg p-4 ${
        comparison.label_agreement ? 'bg-green-50' : 'bg-yellow-50'
      }`}>
        <p className={comparison.label_agreement ? 'text-green-800' : 'text-yellow-800'}>
          {comparison.label_agreement
            ? '✓ All models agree on sentiment label'
            : '⚠ Models disagree on sentiment label'}
        </p>
        {comparison.score_range !== undefined && (
          <p className="text-sm mt-1 opacity-75">
            Score range: {comparison.score_range.toFixed(4)} | Average: {comparison.average_score?.toFixed(4)}
          </p>
        )}
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function StatCard({ title, value, subtitle }: { title: string; value: any; subtitle?: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-xs text-gray-500 uppercase">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
    </div>
  );
}
