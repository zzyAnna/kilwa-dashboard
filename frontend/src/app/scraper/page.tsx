'use client';

import { useEffect, useState } from 'react';
import { getScraperHealth, getScraperSources, getScraperLanguages, FieldStat, ScraperHealth } from '@/lib/api';
import StatCard from '@/components/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

// Helper function to get color based on percentage value
function getScoreColor(value: number): { bg: string; text: string } {
  const pct = value * 100;
  if (pct >= 90) return { bg: 'bg-green-50', text: 'text-green-600' };
  if (pct >= 50) return { bg: 'bg-yellow-50', text: 'text-yellow-600' };
  return { bg: 'bg-red-50', text: 'text-red-600' };
}

function getFinalDQSColor(value: number): string {
  const pct = value * 100;
  if (pct >= 90) return 'from-green-500 to-green-600';
  if (pct >= 50) return 'from-yellow-500 to-yellow-600';
  return 'from-red-500 to-red-600';
}

export default function ScraperPage() {
  const [data, setData] = useState<ScraperHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [sources, setSources] = useState<{source: string, count: number}[]>([]);
  const [languages, setLanguages] = useState<{language: string, count: number}[]>([]);
  
  // DQS state
  const [dqsData, setDqsData] = useState<{
    completeness: number;
    accuracy: number;
    consistency: number;
    relevance: number;
    final_dqs: number;
    total_articles: number;
  } | null>(null);

  // Fetch filter options on mount
  useEffect(() => {
    getScraperSources().then(setSources).catch(console.error);
    getScraperLanguages().then(setLanguages).catch(console.error);
  }, []);

  // Fetch health data with filters
  useEffect(() => {
    setLoading(true);
    const source = sourceFilter !== 'all' ? sourceFilter : undefined;
    const language = languageFilter !== 'all' ? languageFilter : undefined;
    
    getScraperHealth(source, language)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [sourceFilter, languageFilter]);

  // Fetch DQS data with filters
  useEffect(() => {
    const params = new URLSearchParams();
    if (sourceFilter !== 'all') params.append('source', sourceFilter);
    if (languageFilter !== 'all') params.append('language', languageFilter);
    
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/scraper/dqs?${params.toString()}`)
      .then(res => res.json())
      .then(setDqsData)
      .catch(console.error);
  }, [sourceFilter, languageFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading scraper data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        Error: {error}
      </div>
    );
  }

  if (!data) return null;

  const chartData = data.field_stats.map((stat) => ({
    name: stat.field_name,
    filled: parseFloat(stat.non_null_percentage.toFixed(1)),
    empty: parseFloat(stat.null_percentage.toFixed(1)),
  }));

  const healthyFields = data.field_stats.filter((s) => s.non_null_percentage > 90).length;
  const totalFields = data.field_stats.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Scraper Health Monitor</h1>
        <p className="text-gray-500 mt-1">Monitor data quality and completeness</p>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Source
            </label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Sources</option>
              {sources.map((s) => (
                <option key={s.source} value={s.source}>
                  {s.source} ({s.count})
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Language
            </label>
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Languages</option>
              {languages.map((l) => (
                <option key={l.language} value={l.language}>
                  {l.language.toUpperCase()} ({l.count})
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              setSourceFilter('all');
              setLanguageFilter('all');
            }}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Data Quality Score Section */}
      {dqsData && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Quality Score (DQS)</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Completeness */}
            <div className={`text-center p-4 ${getScoreColor(dqsData.completeness).bg} rounded-lg`}>
              <div className="group relative inline-block cursor-help">
                <div className="text-sm text-gray-700 font-medium">Completeness</div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-48 z-10">
                  Measures presence of data in core fields: content, sentiment_score, sentiment_label, sentiment_confidence
                </div>
              </div>
              <div className={`text-2xl font-bold ${getScoreColor(dqsData.completeness).text} mt-1`}>
                {(dqsData.completeness * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">Weight: 30%</div>
            </div>
            
            {/* Accuracy */}
            <div className={`text-center p-4 ${getScoreColor(dqsData.accuracy).bg} rounded-lg`}>
              <div className="group relative inline-block cursor-help">
                <div className="text-sm text-gray-700 font-medium">Accuracy</div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-48 z-10">
                  Derived from model confidence levels. Uses mean sentiment_confidence as proxy for accuracy
                </div>
              </div>
              <div className={`text-2xl font-bold ${getScoreColor(dqsData.accuracy).text} mt-1`}>
                {(dqsData.accuracy * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">Weight: 40%</div>
            </div>
            
            {/* Consistency */}
            <div className={`text-center p-4 ${getScoreColor(dqsData.consistency).bg} rounded-lg`}>
              <div className="group relative inline-block cursor-help">
                <div className="text-sm text-gray-700 font-medium">Consistency</div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-48 z-10">
                  Checks if sentiment_label follows expected categories: Positive, Negative, Neutral, Irrelevant
                </div>
              </div>
              <div className={`text-2xl font-bold ${getScoreColor(dqsData.consistency).text} mt-1`}>
                {(dqsData.consistency * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">Weight: 15%</div>
            </div>
            
            {/* Relevance */}
            <div className={`text-center p-4 ${getScoreColor(dqsData.relevance).bg} rounded-lg`}>
              <div className="group relative inline-block cursor-help">
                <div className="text-sm text-gray-700 font-medium">Relevance</div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-48 z-10">
                  Determines if data is useful for analysis. Penalized due to missing relevance_score and word_count metadata
                </div>
              </div>
              <div className={`text-2xl font-bold ${getScoreColor(dqsData.relevance).text} mt-1`}>
                {(dqsData.relevance * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">Weight: 15%</div>
            </div>
            
            {/* Final DQS */}
            <div className={`text-center p-4 bg-gradient-to-br ${getFinalDQSColor(dqsData.final_dqs)} rounded-lg text-white`}>
              <div className="group relative inline-block cursor-help">
                <div className="text-sm font-medium opacity-90">Final DQS</div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-56 z-10">
                  Aggregate score: 0.30×Completeness + 0.40×Accuracy + 0.15×Consistency + 0.15×Relevance
                </div>
              </div>
              <div className="text-3xl font-bold mt-1">
                {(dqsData.final_dqs * 100).toFixed(1)}%
              </div>
              <div className="text-xs opacity-75 mt-1">
                Based on {dqsData.total_articles} articles
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Articles"
          value={data.total_articles.toLocaleString()}

        />
        <StatCard
          title="Fields Monitored"
          value={totalFields}

        />
        <StatCard
          title="Healthy Fields (≥90%)"
          value={healthyFields}
          subtitle={`${((healthyFields / totalFields) * 100).toFixed(0)}% healthy`}

        />
        <StatCard
          title="Critical Fields (<50%)"
          value={data.field_stats.filter((s) => s.non_null_percentage < 50).length}

        />
      </div>

      {/* Health Distribution Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie Chart - Field Health Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata Field Health Distribution</h2>
          {(() => {
            const healthy = data.field_stats.filter((s) => s.non_null_percentage >= 90).length;
            const warning = data.field_stats.filter((s) => s.non_null_percentage >= 50 && s.non_null_percentage < 90).length;
            const critical = data.field_stats.filter((s) => s.non_null_percentage < 50).length;
            const pieData = [
              { name: 'Healthy (≥90%)', value: healthy, color: '#22c55e' },
              { name: 'Warning (50-90%)', value: warning, color: '#eab308' },
              { name: 'Critical (<50%)', value: critical, color: '#ef4444' },
            ].filter(d => d.value > 0);
            
            return (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart margin={{ top: 30, right: 30, bottom: 30, left: 30 }}>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            );
          })()}
        </div>

        {/* Summary Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata Field Health Summary</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-gray-800">Healthy (≥90%)</span>
              </div>
              <span className="font-bold text-green-700">
                {data.field_stats.filter((s) => s.non_null_percentage >= 90).length}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-sm text-gray-800">Warning (50-90%)</span>
              </div>
              <span className="font-bold text-yellow-700">
                {data.field_stats.filter((s) => s.non_null_percentage >= 50 && s.non_null_percentage < 90).length}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm text-gray-800">Critical {'(<50%)'}</span>
              </div>
              <span className="font-bold text-red-700">
                {data.field_stats.filter((s) => s.non_null_percentage < 50).length}
              </span>
            </div>
            <div className="pt-4 border-t">
              <div className="text-sm text-gray-700 font-medium">
                Average Completeness
              </div>
              <div className="text-2xl font-bold mt-1 text-gray-900">
                {(data.field_stats.reduce((acc, s) => acc + s.non_null_percentage, 0) / data.field_stats.length).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Field Stats Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Metadata Field Completeness</h2>
          <p className="text-sm text-gray-700 mt-1">
            Status thresholds: Healthy ≥90% • Warning 50-90% • Critical {'<50%'}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Field</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Filled</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Empty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.field_stats.map((stat) => (
                <FieldRow key={stat.field_name} stat={stat} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata Field Completeness Chart</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 50, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} unit="%" />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={150}
              tick={{ fontSize: 12 }}
            />
            <Tooltip />
            <Bar dataKey="filled" stackId="a" fill="#22c55e" name="Filled %" />
            <Bar dataKey="empty" stackId="a" fill="#ef4444" name="Empty %" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function FieldRow({ stat }: { stat: FieldStat }) {
  const healthColor = 
    stat.non_null_percentage >= 90 ? 'bg-green-100 text-green-800' :
    stat.non_null_percentage >= 50 ? 'bg-yellow-100 text-yellow-800' :
    'bg-red-100 text-red-800';

  const statusText = 
    stat.non_null_percentage >= 90 ? 'Healthy' :
    stat.non_null_percentage >= 50 ? 'Warning' :
    'Critical';

  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {stat.field_name}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {stat.total_count}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {stat.total_count - stat.null_count}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {stat.null_count} ({stat.null_percentage.toFixed(1)}%)
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${healthColor}`}>
          {statusText}
        </span>
      </td>
    </tr>
  );
}
