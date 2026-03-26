import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface NeonPageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function NeonPageHeader({ title, description, icon, actions, className }: NeonPageHeaderProps) {
  return (
    <div className={cn("relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4", className)}>
      <div className="space-y-1">
        <h1 className="flex items-center gap-3 text-2xl sm:text-3xl font-bold tracking-tight text-gradient">
          {icon && (
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              {icon}
            </span>
          )}
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
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
