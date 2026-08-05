import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Heart, AlertTriangle, ShieldCheck } from 'lucide-react';

interface Props {
  score: number;
  issues: string[];
}

export function HealthScoreBadge({ score, issues }: Props) {
  const tier = score >= 80 ? 'good' : score >= 50 ? 'warn' : 'bad';
  const cfg = {
    good: {
      cls: 'bg-success/15 text-success border-success/30 shadow-[0_0_8px_hsl(var(--success)/0.3)]',
      Icon: ShieldCheck,
    },
    warn: {
      cls: 'bg-warning/15 text-warning border-warning/30 shadow-[0_0_8px_hsl(var(--warning)/0.25)]',
      Icon: AlertTriangle,
    },
    bad: {
      cls: 'bg-destructive/15 text-destructive border-destructive/30 shadow-[0_0_8px_hsl(var(--destructive)/0.3)]',
      Icon: Heart,
    },
  }[tier];

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={cn('gap-1.5 font-mono font-bold tabular-nums cursor-help', cfg.cls)}>
            <cfg.Icon className="h-3 w-3" />
            {score}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs">
          <div className="space-y-1.5">
            <p className="font-semibold">Score de Saúde: {score}/100</p>
            {issues.length === 0 ? (
              <p className="text-xs text-success">Tudo configurado corretamente ✓</p>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">Pontos de atenção:</p>
                <ul className="text-xs space-y-0.5">
                  {issues.map((i, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <span className="text-warning">•</span>
                      <span>{i}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
