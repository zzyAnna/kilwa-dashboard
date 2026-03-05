'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getScraperHealth, ScraperHealth } from '@/lib/api';
import StatCard from '@/components/StatCard';
import { ArrowRight, Database, Brain } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<ScraperHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getScraperHealth()
      .then(setData)
      .finally(() => setLoading(false));
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

      {/* Recent Activity */}
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
