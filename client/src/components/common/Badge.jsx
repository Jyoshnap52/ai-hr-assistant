import React from 'react';

export default function Badge({ children, variant = 'default', size = 'sm' }) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  const variants = {
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200 font-medium',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200 font-medium',
    primary: 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium',
    default: 'bg-slate-100 text-slate-700 border border-slate-200 font-medium'
  };

  return (
    <span className={`inline-flex items-center rounded-md font-medium tracking-tight ${variants[variant] || variants.default} ${sizeClasses}`}>
      {children}
    </span>
  );
}
