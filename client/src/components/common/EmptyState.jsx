import React from 'react';
import { FolderOpen } from 'lucide-react';

export default function EmptyState({ title, description, icon: Icon = FolderOpen, actionText, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-slate-200 text-center">
      <div className="p-3 bg-slate-100 rounded-full text-slate-500 mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 text-xs text-slate-500 max-w-sm">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-4 inline-flex items-center px-3.5 py-1.5 border border-transparent text-xs font-medium rounded-lg shadow-sm text-white bg-brand-600 hover:bg-brand-700 focus:outline-none transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
