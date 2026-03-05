import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("skeleton h-4 w-full", className)}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ 
  lines = 3, 
  className 
}: { 
  lines?: number; 
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-6", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          <div className="flex items-center gap-2 pt-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonStatsCard({ className }: SkeletonProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-6 animate-pulse", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-9 w-24" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-3.5 w-16" />
          </div>
        </div>
        <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
      </div>
    </div>
  );
}

export function SkeletonChart({ className }: SkeletonProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-6", className)}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
        <div className="flex items-end gap-2 h-48">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end">
              <Skeleton 
                className="w-full rounded-t" 
                style={{ height: `${Math.random() * 60 + 40}%` }} 
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-8" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonTable({ 
  rows = 5,
  columns = 4,
  className 
}: { 
  rows?: number; 
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border bg-card overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b bg-muted/30">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton 
            key={i} 
            className={cn(
              "h-4",
              i === 0 ? "w-40" : "w-24"
            )} 
          />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div 
          key={rowIndex} 
          className="flex items-center gap-4 p-4 border-b last:border-0"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={colIndex} 
              className={cn(
                "h-4",
                colIndex === 0 ? "w-40" : "w-24"
              )} 
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ 
  items = 5,
  className 
}: { 
  items?: number; 
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonAvatar({ 
  size = "md",
  className 
}: { 
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  return (
    <Skeleton className={cn("rounded-full shrink-0", sizeClasses[size], className)} />
  );
}

export function SkeletonButton({ 
  size = "md",
  className 
}: { 
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "h-8 w-20",
    md: "h-10 w-24",
    lg: "h-12 w-32",
  };

  return (
    <Skeleton className={cn("rounded-md", sizeClasses[size], className)} />
  );
}

export function SkeletonBadge({ className }: SkeletonProps) {
  return (
    <Skeleton className={cn("h-5 w-16 rounded-full", className)} />
  );
}

export function SkeletonInput({ className }: SkeletonProps) {
  return (
    <Skeleton className={cn("h-10 w-full rounded-md", className)} />
  );
}

// Dashboard-specific skeletons
export function SkeletonDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatsCard key={i} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SkeletonChart />
        <SkeletonChart />
      </div>

      {/* Lists Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <Skeleton className="h-5 w-32 mb-4" />
          <SkeletonList items={4} />
        </div>
        <div className="rounded-lg border bg-card p-6">
          <Skeleton className="h-5 w-32 mb-4" />
          <SkeletonList items={4} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonCallCard({ className }: SkeletonProps) {
  return (
    <div className={cn("flex items-center gap-3 p-4 rounded-lg border", className)}>
      <SkeletonAvatar size="md" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28" />
          <SkeletonBadge />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}
