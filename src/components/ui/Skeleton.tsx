import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse-subtle bg-obsidian-card/70 border border-obsidian-border/40 rounded-lg ${className}`}
    />
  );
};

export const HomepageSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero skeleton */}
      <Skeleton className="h-64 w-full rounded-2xl" />

      {/* 2x3 Quick Access skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>

      {/* Rail skeletons */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-48 rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
};
