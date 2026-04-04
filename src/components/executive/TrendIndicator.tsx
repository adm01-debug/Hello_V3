import { memo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TrendIndicatorProps {
  value: number;
}

export const TrendIndicator = memo(function TrendIndicator({ value }: TrendIndicatorProps) {
  if (value > 0) {
    return (
      <div className="flex items-center text-green-500 text-sm" aria-label={`Aumento de ${value.toFixed(1)}%`}>
        <TrendingUp className="h-4 w-4 mr-1" aria-hidden="true" />
        +{value.toFixed(1)}%
      </div>
    );
  }
  if (value < 0) {
    return (
      <div className="flex items-center text-red-500 text-sm" aria-label={`Redução de ${Math.abs(value).toFixed(1)}%`}>
        <TrendingDown className="h-4 w-4 mr-1" aria-hidden="true" />
        {value.toFixed(1)}%
      </div>
    );
  }
  return <span className="text-muted-foreground text-sm" aria-label="Sem variação">--</span>;
});
