import React from 'react';

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-slate-800/40 border border-slate-700/40 rounded-2xl p-4 ${className}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-slate-700/50"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-700/50 rounded w-3/4"></div>
          <div className="h-3 bg-slate-700/30 rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-2 mt-4">
        <div className="h-3 bg-slate-700/40 rounded w-full"></div>
        <div className="h-3 bg-slate-700/30 rounded w-5/6"></div>
      </div>
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 4 }) => {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 bg-slate-800/30 border border-slate-700/30 rounded-xl w-full flex items-center px-4 justify-between">
          <div className="h-4 bg-slate-700/50 rounded w-1/3"></div>
          <div className="h-4 bg-slate-700/40 rounded w-1/4"></div>
          <div className="h-4 bg-slate-700/50 rounded w-16"></div>
        </div>
      ))}
    </div>
  );
};
