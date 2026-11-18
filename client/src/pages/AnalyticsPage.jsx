import React, { useState, useEffect } from 'react';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatCard from '../components/common/StatCard';
import {
  BarChart3,
  Users2,
  TrendingUp,
  PieChart as PieChartIcon,
  HelpCircle
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await api.get('/analytics/hiring');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) return <LoadingSpinner label="Compiling analytics telemetry..." />;

  const funnelData = data?.funnel || [
    { stage: 'Applied', count: 240 },
    { stage: 'Screened', count: 142 },
    { stage: 'Interviewed', count: 54 },
    { stage: 'Offered', count: 22 },
    { stage: 'Hired', count: 18 },
  ];

  const departmentData = data?.departments || [
    { name: 'Engineering', value: 110, color: '#4F46E5' },
    { name: 'Product', value: 45, color: '#0EA5E9' },
    { name: 'Human Resources', value: 35, color: '#10B981' },
    { name: 'Sales & Marketing', value: 58, color: '#F59E0B' },
  ];

  const popularTopics = [
    { topic: 'Paid Leave & Carry-forward Guidelines', count: 420 },
    { topic: 'Health Insurance & Dental OPD Claims', count: 310 },
    { topic: 'Work-From-Home & Remote Allowances', count: 285 },
    { topic: 'Performance Appraisal & Review Cycle', count: 195 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Workforce Intelligence & Analytics</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">Recruitment conversion telemetry, department breakdown, and AI query patterns.</p>
      </div>

      {/* Top Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Hiring Conversion" value="7.5%" change="+1.2% conversion rate" icon={TrendingUp} />
        <StatCard title="Active Applicants" value="240 Candidates" subtitle="142 AI evaluated" icon={Users2} />
        <StatCard title="Avg Time-to-Hire" value="18 Days" subtitle="Industry avg: 28 days" icon={BarChart3} />
        <StatCard title="AI Policy Queries" value="1,420 Total" subtitle="99.4% resolution rate" icon={HelpCircle} />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recruitment Funnel */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" /> Candidate Recruitment Funnel
            </h3>
            <span className="text-[11px] text-slate-400 font-normal">Last 30 Days</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={funnelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="stage" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="count" stroke="#4F46E5" strokeWidth={2} fill="url(#indigoGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-indigo-600" /> Department Distribution
            </h3>
            <span className="text-[11px] text-slate-400 font-normal">248 Total Employees</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '12px' }} />
                <Legend formatter={(value) => <span className="text-xs text-slate-600 font-medium">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Policy Queries Breakdown */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-indigo-600" /> Top Inquired HR Topics (AI Analytics)
        </h3>

        <div className="divide-y divide-slate-100">
          {popularTopics.map((topic, idx) => (
            <div key={idx} className="py-3 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-700">{topic.topic}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-indigo-600">{topic.count} queries</span>
                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${(topic.count / 420) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
