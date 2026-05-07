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
   primary: 'bg-primary/10 text-primary shadow-[0_0_20px_hsl(var(--primary)/0.25)] ring-1 ring-primary/20',
   success: 'bg-success/10 text-success shadow-[0_0_20px_hsl(var(--success)/0.25)] ring-1 ring-success/20',
   warning: 'bg-warning/10 text-warning shadow-[0_0_20px_hsl(var(--warning)/0.25)] ring-1 ring-warning/20',
   info: 'bg-info/10 text-info shadow-[0_0_20px_hsl(var(--info)/0.25)] ring-1 ring-info/20',
  };

  return (
    <Card className={cn(
      'card-premium group overflow-hidden border-none',
      glowMap[glowColor],
      className
    )} role="article" aria-label={`${title}: ${displayValue}`}>
      <CardContent className="p-6 relative">
        {/* Premium ambient light effect */}
         <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-primary/5 blur-[100px] group-hover:bg-primary/15 transition-all duration-1000 pointer-events-none group-hover:scale-125" />
         <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-primary/5 blur-[100px] pointer-events-none group-hover:bg-primary/10 transition-all duration-1000" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="space-y-2 min-w-0">
             <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/60 group-hover:text-muted-foreground transition-colors duration-500">{title}</p>
             <p className="text-3xl font-bold tracking-tighter tabular-nums text-foreground/90 group-hover:text-foreground transition-colors duration-500">{displayValue}</p>
            
            {change !== undefined && (
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className={cn(
                  'inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md',
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
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3',
            iconBgMap[glowColor],
          )} aria-hidden="true">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
