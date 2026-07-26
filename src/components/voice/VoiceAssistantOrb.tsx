import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface VoiceAssistantOrbProps {
  active?: boolean;
  size?: number;
  className?: string;
}

/** Orbe animado do assistente de voz (puramente visual). */
export function VoiceAssistantOrb({ active = false, size = 160, className }: VoiceAssistantOrbProps) {
  return (
    <div
      className={cn('relative flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {[0, 1, 2].map((ring) => (
        <motion.span
          key={ring}
          className="absolute rounded-full border border-primary/30"
          style={{ width: size, height: size }}
          animate={
            active
              ? { scale: [1, 1.25, 1], opacity: [0.6, 0.1, 0.6], rotate: [0, 180, 360] }
              : { scale: 1, opacity: 0.25 }
          }
          transition={{ duration: 3 + ring, repeat: Infinity, ease: 'easeInOut', delay: ring * 0.3 }}
        />
      ))}
      <motion.span
        className="rounded-full bg-gradient-to-br from-primary via-primary/70 to-accent shadow-2xl"
        style={{ width: size * 0.55, height: size * 0.55 }}
        animate={active ? { scale: [1, 1.08, 1] } : { scale: 1 }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

interface VoiceWaveformProps {
  active: boolean;
}

/** Visualizador simplificado de onda de áudio. */
export function VoiceWaveform({ active }: VoiceWaveformProps) {
  const bars = Array.from({ length: 16 }, (_, index) => index);
  return (
    <div className="flex h-10 items-end justify-center gap-1" aria-hidden="true">
      {bars.map((bar) => (
        <motion.span
          key={bar}
          className="w-1 rounded-full bg-primary"
          animate={active ? { height: [6, 8 + ((bar * 7) % 28), 6] } : { height: 6 }}
          transition={{ duration: 0.7 + (bar % 5) * 0.1, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}
