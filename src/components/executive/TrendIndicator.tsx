import { TrendingUp, TrendingDown } from 'lucide-react';

interface TrendIndicatorProps {
  value: number;
}

export function TrendIndicator({ value }: TrendIndicatorProps) {
  if (value > 0) {
    return (
      <div className="flex items-center text-green-500 text-sm">
        <TrendingUp className="h-4 w-4 mr-1" />
        +{value.toFixed(1)}%
      </div>
    );
  }
  if (value < 0) {
    return (
      <div className="flex items-center text-red-500 text-sm">
        <TrendingDown className="h-4 w-4 mr-1" />
        {value.toFixed(1)}%
      </div>
    );
  }
  return <span className="text-muted-foreground text-sm">--</span>;
}
