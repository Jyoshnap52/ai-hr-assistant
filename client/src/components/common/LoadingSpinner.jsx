import React from 'react';

export default function LoadingSpinner({ label = 'Loading...', size = 'md' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3'
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 text-slate-500 gap-3">
      <div className={`${sizeClasses[size]} border-brand-600 border-t-transparent rounded-full animate-spin`} />
      {label && <p className="text-xs font-medium text-slate-500">{label}</p>}
    </div>
  );
}
