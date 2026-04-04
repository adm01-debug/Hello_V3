import { ReactNode, memo, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: ReactNode;
  className?: string;
  glowColor?: 'primary' | 'success' | 'warning' | 'info';
}

export const StatsCard = memo(function StatsCard({ 
  title, 
  value, 
  change, 
  changeLabel,
  icon,
  className,
  glowColor = 'primary'
}: StatsCardProps) {
  const isPositive = change !== undefined && change >= 0;

  // Parse numeric value for animation
  const numericValue = useMemo(() => {
    if (typeof value === 'number') return value;
    const parsed = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
    return isNaN(parsed) ? null : parsed;
  }, [value]);

  const decimals = useMemo(() => {
    if (numericValue === null) return 0;
    const str = String(numericValue);
    const dot = str.indexOf('.');
    return dot === -1 ? 0 : str.length - dot - 1;
  }, [numericValue]);

  const animatedValue = useAnimatedCounter(numericValue ?? 0, { decimals });

  // Build display value preserving prefix/suffix
  const displayValue = useMemo(() => {
    if (numericValue === null || typeof value !== 'string') return value;
    const str = String(value);
    const numStr = String(numericValue);
    const idx = str.indexOf(numStr);
    if (idx === -1) return value;
    const prefix = str.slice(0, idx);
    const suffix = str.slice(idx + numStr.length);
    return `${prefix}${animatedValue}${suffix}`;
  }, [value, numericValue, animatedValue]);

  const glowMap = {
    primary: 'hover:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.35)]',
    success: 'hover:shadow-[0_0_30px_-5px_hsl(var(--success)/0.35)]',
    warning: 'hover:shadow-[0_0_30px_-5px_hsl(var(--warning)/0.35)]',
    info: 'hover:shadow-[0_0_30px_-5px_hsl(var(--info)/0.35)]',
  };

  const iconBgMap = {
    primary: 'bg-primary/10 text-primary shadow-[0_0_15px_hsl(var(--primary)/0.2)]',
    success: 'bg-success/10 text-success shadow-[0_0_15px_hsl(var(--success)/0.2)]',
    warning: 'bg-warning/10 text-warning shadow-[0_0_15px_hsl(var(--warning)/0.2)]',
    info: 'bg-info/10 text-info shadow-[0_0_15px_hsl(var(--info)/0.2)]',
  };

  return (
    <Card className={cn(
      'overflow-hidden group transition-all duration-300 border-border/50 card-shine',
      'hover:border-primary/25 hover:-translate-y-1',
      glowMap[glowColor],
      className
    )} role="article" aria-label={`${title}: ${displayValue}`}>
      <CardContent className="p-5 relative">
        {/* Subtle neon mesh background */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/5 blur-2xl" />
        </div>

        <div className="relative flex items-start justify-between gap-3">
          <div className="space-y-2 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight tabular-nums text-display">{displayValue}</p>
            
            {change !== undefined && (
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className={cn(
                  'inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full',
                  isPositive 
                    ? 'text-success bg-success/10' 
                    : 'text-destructive bg-destructive/10'
                )} aria-label={`${isPositive ? 'Aumento' : 'Redução'} de ${Math.abs(change)}%`}>
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <TrendingDown className="h-3 w-3" aria-hidden="true" />
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

          <div className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all duration-300',
            iconBgMap[glowColor],
          )} aria-hidden="true">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
