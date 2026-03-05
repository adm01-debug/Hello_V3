import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge as BadgeType } from '@/hooks/useGamification';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BadgeCardProps {
  badge: BadgeType;
  earned: boolean;
  earnedAt?: string;
  size?: 'sm' | 'md';
}

export function BadgeCard({ badge, earned, earnedAt, size = 'md' }: BadgeCardProps) {
  const sizeClasses = size === 'sm' ? 'p-2 text-2xl' : 'p-3 text-3xl';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'flex flex-col items-center justify-center rounded-lg border transition-all cursor-default',
            sizeClasses,
            earned
              ? 'bg-primary/10 border-primary/30 shadow-sm'
              : 'bg-muted/30 border-border/50 opacity-40 grayscale'
          )}
        >
          <span>{badge.icon}</span>
          {size === 'md' && (
            <span className="text-[10px] mt-1 text-center leading-tight text-muted-foreground truncate w-full">
              {badge.name}
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[200px]">
        <p className="font-semibold">{badge.name}</p>
        <p className="text-xs text-muted-foreground">{badge.description}</p>
        <p className="text-xs mt-1">+{badge.points} pontos</p>
        {earned && earnedAt && (
          <p className="text-xs text-primary mt-1">
            Conquistado em {format(new Date(earnedAt), "dd/MM/yyyy", { locale: ptBR })}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
