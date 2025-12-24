import { 
  Trophy, Star, Award, Crown, Phone, Smile, Clock, Zap, Medal,
  LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge as BadgeType } from '@/hooks/useGamification';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const iconMap: Record<string, LucideIcon> = {
  trophy: Trophy,
  star: Star,
  award: Award,
  crown: Crown,
  phone: Phone,
  smile: Smile,
  clock: Clock,
  zap: Zap,
  medal: Medal,
};

const tierStyles = {
  bronze: 'from-amber-600 to-amber-800 shadow-amber-500/30',
  silver: 'from-slate-300 to-slate-500 shadow-slate-400/30',
  gold: 'from-yellow-400 to-amber-500 shadow-yellow-400/30',
  platinum: 'from-purple-400 to-indigo-600 shadow-purple-500/30',
};

const tierBorderStyles = {
  bronze: 'border-amber-600/50',
  silver: 'border-slate-400/50',
  gold: 'border-yellow-400/50',
  platinum: 'border-purple-400/50',
};

interface BadgeCardProps {
  badge: BadgeType;
  earned?: boolean;
  earnedAt?: string;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export function BadgeCard({ 
  badge, 
  earned = false, 
  earnedAt,
  size = 'md',
  showDetails = false 
}: BadgeCardProps) {
  const Icon = iconMap[badge.icon] || Trophy;
  
  const sizeStyles = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
  };

  const iconSizes = {
    sm: 16,
    md: 24,
    lg: 32,
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              'relative flex flex-col items-center gap-2 p-2 rounded-lg transition-all duration-300',
              earned ? 'opacity-100' : 'opacity-40 grayscale',
              showDetails && 'bg-muted/50 p-4'
            )}
          >
            <div 
              className={cn(
                'relative rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg',
                sizeStyles[size],
                tierStyles[badge.tier],
                earned && 'animate-pulse'
              )}
            >
              <Icon 
                className="text-white drop-shadow-md" 
                size={iconSizes[size]} 
              />
              {earned && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-[8px] font-bold">✓</span>
                </div>
              )}
            </div>
            
            {showDetails && (
              <div className="text-center">
                <p className="font-medium text-sm">{badge.name}</p>
                <p className="text-xs text-muted-foreground">{badge.points} pts</p>
                {earnedAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(earnedAt).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">{badge.name}</p>
            <p className="text-xs text-muted-foreground">{badge.description}</p>
            <div className="flex items-center gap-2 text-xs">
              <span className={cn(
                'px-2 py-0.5 rounded-full text-white capitalize',
                badge.tier === 'bronze' && 'bg-amber-600',
                badge.tier === 'silver' && 'bg-slate-500',
                badge.tier === 'gold' && 'bg-yellow-500',
                badge.tier === 'platinum' && 'bg-purple-500',
              )}>
                {badge.tier}
              </span>
              <span className="text-muted-foreground">{badge.points} pontos</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
