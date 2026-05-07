import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface NeonPageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  badge?: ReactNode;
  className?: string;
}

export function NeonPageHeader({ title, description, icon, actions, badge, className }: NeonPageHeaderProps) {
  return (
    <div className={cn("relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-500", className)}>
      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          <h1 className="flex items-center gap-3 text-2xl sm:text-3xl font-bold tracking-tight text-gradient">
            {icon && (
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 shadow-[0_0_15px_hsl(var(--primary)/0.15)]">
                {icon}
              </span>
            )}
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground max-w-lg">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}
