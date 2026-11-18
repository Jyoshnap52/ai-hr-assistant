import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatCard from '../components/common/StatCard';
import { useAuth } from '../context/AuthContext';
import {
  Users2,
  BrainCircuit,
  FileCheck2,
  UserCheck2,
  FolderGit2,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardStats() {
      try {
        const res = await api.get('/analytics/hiring');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardStats();
  }, []);

  if (loading) return <LoadingSpinner label="Loading dashboard metrics..." size="lg" />;

  const quickActions = [
    { title: 'Ask HR AI Assistant', desc: 'Query company policy, leaves, and insurance.', path: '/ai-assistant', icon: BrainCircuit },
    { title: 'Screen Resumes', desc: 'AI candidate matching against target job profiles.', path: '/resumes', icon: FileCheck2 },
    { title: 'Employee Directory', desc: 'Manage active team profiles and onboarding.', path: '/employees', icon: Users2 },
    { title: 'Policy Knowledge Base', desc: 'Ingest and update HR vector documents.', path: '/documents', icon: FolderGit2 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Welcome back, {user?.name || 'Sarah'}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Enterprise HR workspace overview and AI telemetry status.
          </p>
        </div>

        <button
          onClick={() => navigate('/ai-assistant')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg shadow-xs transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          Ask AI Assistant
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Workforce"
          value="248"
          change="+12 this month"
          icon={Users2}
        />
        <StatCard
          title="Active Onboarding"
          value="18 New Hires"
          subtitle="84% milestone completion"
          icon={UserCheck2}
        />
        <StatCard
          title="Resumes Screened"
          value="142"
          change="91% avg match score"
          icon={FileCheck2}
        />
        <StatCard
          title="AI Queries Ingested"
          value="1,420"
          subtitle="0.4s avg vector latency"
          icon={BrainCircuit}
        />
      </div>

      {/* Quick Operations Hub */}
      <div className="space-y-3 pt-2">
        <h2 className="text-sm font-semibold text-slate-900">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <div
                key={idx}
                onClick={() => navigate(action.path)}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer space-y-3 group"
              >
                <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-normal">{action.desc}</p>
                </div>
                <div className="flex items-center text-xs font-medium text-indigo-600 pt-1 group-hover:translate-x-0.5 transition-transform">
                  Open <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
