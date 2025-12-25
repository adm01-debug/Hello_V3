import React from 'react';

interface SkeletonProps {
  className?: string;
  count?: number;
}

export function SkeletonLoader({ className = '', count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse rounded-md bg-muted ${className}`}
        />
      ))}
    </>
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLoader key={i} className="h-4 w-full" />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-lg border p-4">
      <SkeletonLoader className="mb-4 h-48 w-full" />
      <SkeletonLoader className="mb-2 h-6 w-3/4" />
      <SkeletonText lines={2} />
    </div>
  );
}
