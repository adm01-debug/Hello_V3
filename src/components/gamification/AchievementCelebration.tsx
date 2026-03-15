import { useEffect, useState } from 'react';
import { Trophy, Star, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge as BadgeType } from '@/hooks/useGamification';
import { Button } from '@/components/ui/button';

const tierColors = {
  bronze: 'from-amber-600 to-amber-800',
  silver: 'from-slate-300 to-slate-500',
  gold: 'from-yellow-400 to-amber-500',
  platinum: 'from-purple-400 to-indigo-600',
};

const tierGlowColors = {
  bronze: 'shadow-amber-500/50',
  silver: 'shadow-slate-400/50',
  gold: 'shadow-yellow-400/50',
  platinum: 'shadow-purple-500/50',
};

interface AchievementCelebrationProps {
  badge: BadgeType;
  agentName: string;
  onClose: () => void;
}

export function AchievementCelebration({ badge, agentName, onClose }: AchievementCelebrationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; delay: number }[]>([]);

  useEffect(() => {
    // Generate confetti particles
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 0.5,
    }));
    setParticles(newParticles);
    
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 50);

    // Auto close after 5 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div 
        className={cn(
          'absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto',
          isVisible ? 'opacity-100' : 'opacity-0'
        )}
        onClick={handleClose}
      />

      {/* Confetti particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={cn(
            'absolute w-3 h-3 rounded-full animate-bounce',
            particle.id % 3 === 0 && 'bg-yellow-400',
            particle.id % 3 === 1 && 'bg-purple-500',
            particle.id % 3 === 2 && 'bg-primary'
          )}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: '1s',
          }}
        />
      ))}

      {/* Main celebration card */}
      <div
        className={cn(
          'relative bg-card border rounded-2xl p-8 shadow-2xl transition-all duration-500 pointer-events-auto max-w-md mx-4',
          isVisible ? 'scale-100 opacity-100' : 'scale-50 opacity-0',
          tierGlowColors[badge.tier],
          'shadow-lg'
        )}
      >
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Sparkles decoration */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <Sparkles className="h-8 w-8 text-warning animate-pulse" />
        </div>

        {/* Badge icon */}
        <div className="flex justify-center mb-6">
          <div
            className={cn(
              'relative w-24 h-24 rounded-full bg-gradient-to-br flex items-center justify-center animate-pulse',
              tierColors[badge.tier]
            )}
          >
            <Trophy className="h-12 w-12 text-white drop-shadow-lg" />
            
            {/* Rotating ring */}
            <div 
              className={cn(
                'absolute inset-0 rounded-full border-4 border-dashed animate-spin',
                badge.tier === 'bronze' && 'border-warning/50',
                badge.tier === 'silver' && 'border-muted-foreground/50',
                badge.tier === 'gold' && 'border-warning/50',
                badge.tier === 'platinum' && 'border-pending/50'
              )}
              style={{ animationDuration: '3s' }}
            />
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
            <Star className="h-5 w-5 text-warning fill-warning" />
            Nova Conquista!
            <Star className="h-5 w-5 text-warning fill-warning" />
          </h2>
          
          <p className="text-lg text-muted-foreground">
            {agentName}
          </p>

          {/* Badge name */}
          <div className="py-4">
            <h3 className="text-xl font-bold text-primary">{badge.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{badge.description}</p>
          </div>

          {/* Points earned */}
          <div className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-full text-white font-bold',
            `bg-gradient-to-r ${tierColors[badge.tier]}`
          )}>
            <Trophy className="h-4 w-4" />
            +{badge.points} pontos
          </div>

          {/* Tier badge */}
          <p className={cn(
            'text-sm font-medium capitalize mt-2',
            badge.tier === 'bronze' && 'text-warning',
            badge.tier === 'silver' && 'text-muted-foreground',
            badge.tier === 'gold' && 'text-warning',
            badge.tier === 'platinum' && 'text-pending'
          )}>
            Badge {badge.tier}
          </p>
        </div>
      </div>
    </div>
  );
}
