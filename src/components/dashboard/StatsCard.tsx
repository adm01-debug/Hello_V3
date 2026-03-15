import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: ReactNode;
  className?: string;
}

export function StatsCard({ 
  title, 
  value, 
  change, 
  changeLabel,
  icon,
  className 
}: StatsCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <Card className={cn(
      'overflow-hidden group hover:shadow-soft-md transition-all duration-300 hover:border-primary/20',
      className
    )}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight tabular-nums">{value}</p>
            
            {change !== undefined && (
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className={cn(
                  'inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md',
                  isPositive 
                    ? 'text-success bg-success/10' 
                    : 'text-destructive bg-destructive/10'
                )}>
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(change)}%
                </span>
                {changeLabel && (
                  <span className="text-2xs text-muted-foreground">
                    {changeLabel}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/15 transition-colors duration-300">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
