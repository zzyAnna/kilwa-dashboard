'use client';

import { useEffect, useState } from 'react';
import { getScraperHealth, getScraperSources, getScraperLanguages, FieldStat, ScraperHealth } from '@/lib/api';
import StatCard from '@/components/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function ScraperPage() {
  const [data, setData] = useState<ScraperHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [sources, setSources] = useState<{source: string, count: number}[]>([]);
  const [languages, setLanguages] = useState<{language: string, count: number}[]>([]);

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
        <div className="flex flex-wrap items-center gap-4">
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Articles"
          value={data.total_articles.toLocaleString()}
          color="blue"
        />
        <StatCard
          title="Fields Monitored"
          value={totalFields}
          color="green"
        />
        <StatCard
          title="Healthy Fields (≥90%)"
          value={healthyFields}
          subtitle={`${((healthyFields / totalFields) * 100).toFixed(0)}% healthy`}
          color={healthyFields === totalFields ? 'green' : 'yellow'}
        />
        <StatCard
          title="Critical Fields (<50%)"
          value={data.field_stats.filter((s) => s.non_null_percentage < 50).length}
          color="red"
        />
      </div>

      {/* Health Distribution Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie Chart - Field Health Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Field Health Distribution</h2>
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
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Quality Summary</h2>
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
          <h2 className="text-lg font-semibold text-gray-900">Field Completeness</h2>
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Field Completeness Chart</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} unit="%" />
            <YAxis type="category" dataKey="name" width={100} />
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
