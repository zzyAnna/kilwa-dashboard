'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getScraperHealth, ScraperHealth } from '@/lib/api';
import StatCard from '@/components/StatCard';
import { ArrowRight, Database, Brain } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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

interface DQSData {
  completeness: number;
  accuracy: number;
  consistency: number;
  relevance: number;
  final_dqs: number;
  total_articles: number;
}

interface ModelMetrics {
  finbert_available: boolean;
  average_difference: number;
  average_finbert_score: number;
  average_traditional_score: number;
  finbert_bias: number;
  standard_deviation: number;
  interpretation: string;
}

export default function Home() {
  const [data, setData] = useState<ScraperHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [dqsData, setDqsData] = useState<DQSData | null>(null);
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics | null>(null);

  useEffect(() => {
    getScraperHealth()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Fetch DQS data
    fetch(`${API_BASE}/api/scraper/dqs`)
      .then(res => res.json())
      .then(setDqsData)
      .catch(console.error);

    // Fetch model accuracy metrics
    fetch(`${API_BASE}/api/sentiment/model-accuracy?limit=50`)
      .then(res => res.json())
      .then(data => setModelMetrics(data.metrics))
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-2">Monitor Kilwa data processing and sentiment analysis across the pipeline.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Articles"
          value={loading ? '...' : data?.total_articles.toLocaleString() || '0'}

        />
        <StatCard
          title="Fields Monitored"
          value={loading ? '...' : data?.field_stats.length || 0}

        />
        <StatCard
          title="Sentiment Models"
          value="3"
          subtitle="FinBERT, VADER, TextBlob"

        />
        <StatCard
          title="Backend Status"
          value={loading ? 'Checking...' : 'Online'}

        />
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
                  Measures presence of data in core fields
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
                  Derived from model confidence levels
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
                  Checks if sentiment_label follows expected categories
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
                  Determines if data is useful for analysis
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

      {/* Model Comparison Insight */}
      {modelMetrics && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sentiment Model Comparison</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-sm text-gray-700 font-medium">FinBERT vs Traditional</div>
              <div className="text-2xl font-bold text-orange-600 mt-1">
                {modelMetrics.finbert_bias > 0 ? '+' : ''}{modelMetrics.finbert_bias.toFixed(3)}
              </div>
              <div className="text-xs text-gray-500 mt-1">Average difference</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg md:col-span-2">
              <div className="text-sm text-gray-700 font-medium">Key Insight</div>
              <div className="text-lg font-semibold text-gray-900 mt-2">
                {modelMetrics.interpretation}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Based on {modelMetrics.average_difference.toFixed(3)} avg difference, σ = {modelMetrics.standard_deviation.toFixed(3)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/scraper"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Scraper Monitor</h2>
                <p className="text-sm text-gray-500">Data quality and completeness</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
          </div>
        </Link>

        <Link
          href="/sentiment"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Sentiment Analysis</h2>
                <p className="text-sm text-gray-500">Compare NLP models</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
          </div>
        </Link>
      </div>

      {/* System Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">System Overview</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-500">Backend API</span>
            <span className="text-green-600 font-medium">Running on port 8000</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-500">Database</span>
            <span className="text-green-600 font-medium">PostgreSQL Connected</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-500">Sentiment Engine</span>
            <span className="text-green-600 font-medium">FinBERT + VADER + TextBlob Ready</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Data Source</span>
            <span className="text-gray-700">kilwa_dashboard database</span>
          </div>
        </div>
      </div>
    </div>
  );
}
