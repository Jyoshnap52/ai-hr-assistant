import React from 'react';

export default function StatCard({ title, value, change, subtitle, icon: Icon, iconBg }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-start justify-between">
      <div className="space-y-1">
        <span className="text-xs font-medium text-slate-500">{title}</span>
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">{value}</h3>
        {change && <p className="text-xs font-medium text-emerald-600">{change}</p>}
        {subtitle && <p className="text-xs text-slate-400 font-normal">{subtitle}</p>}
      </div>
      {Icon && (
        <div className={`p-2.5 rounded-lg text-indigo-600 bg-indigo-50 border border-indigo-100 ${iconBg || ''}`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}
