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
    <div className={cn("relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 py-4", className)}>
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          {icon && (
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5 text-primary shrink-0 border border-primary/10 backdrop-blur-sm shadow-sm">
              {icon}
            </div>
          )}
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground/90 sm:text-4xl">
                {title}
              </h1>
              {badge}
            </div>
            {description && (
              <p className="text-sm font-medium text-muted-foreground/70 tracking-tight">{description}</p>
            )}
          </div>
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}
