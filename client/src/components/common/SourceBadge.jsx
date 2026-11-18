import React from 'react';
import { FileText, ChevronRight } from 'lucide-react';

export default function SourceBadge({ source, onClick }) {
  return (
    <div
      onClick={() => onClick && onClick(source)}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-emerald-50/50 hover:border-emerald-300 text-xs font-medium text-slate-700 shadow-subtle transition-all cursor-pointer group`}
    >
      <FileText className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
      <span className="truncate max-w-[200px]">{source.documentTitle}</span>
      {source.section && (
        <span className="text-slate-400 font-normal border-l border-slate-200 pl-2">
          {source.section}
        </span>
      )}
      {source.pageNumber && (
        <span className="text-slate-400 font-normal">
          p. {source.pageNumber}
        </span>
      )}
      <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 transition-colors" />
    </div>
  );
}
