import {
  Mic, MicOff, Grid3X3, Volume2, PhoneOff, UserPlus, Video, Users, PhoneIncoming,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatDuration, formatPhoneDisplay } from './phone-utils';

export interface PhoneCallScreenProps {
  phoneNumber: string;
  contactName?: string;
  statusLabel: string;
  duration: number;
  isMuted: boolean;
  isSpeaker: boolean;
  isIncoming?: boolean;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onToggleKeypad: () => void;
  onAddCall: () => void;
  onVideo: () => void;
  onContacts: () => void;
  onHangup: () => void;
  onAccept?: () => void;
}

interface ActionButtonProps {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function ActionButton({ label, active, onClick, children }: ActionButtonProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <motion.button
        type="button"
        whileTap={{ scale: 0.9 }}
        onClick={onClick}
        aria-label={label}
        aria-pressed={active}
        className={cn(
          'flex h-16 w-16 items-center justify-center rounded-full border border-border/50 transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          active ? 'bg-foreground text-background' : 'bg-card/70 text-foreground hover:bg-accent',
        )}
      >
        {children}
      </motion.button>
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
    </div>
  );
}

/** Tela de chamada ativa / recebida dentro da moldura do telefone. */
export function PhoneCallScreen(props: PhoneCallScreenProps) {
  const {
    phoneNumber, contactName, statusLabel, duration, isMuted, isSpeaker, isIncoming,
    onToggleMute, onToggleSpeaker, onToggleKeypad, onAddCall, onVideo, onContacts, onHangup, onAccept,
  } = props;

  return (
    <div className="flex flex-1 flex-col items-center pt-6">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-success">{statusLabel}</p>
      <h2 className="mt-3 text-center text-2xl font-bold text-foreground">
        {contactName || 'Chamador desconhecido'}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{formatPhoneDisplay(phoneNumber) || phoneNumber}</p>
      {!isIncoming && (
        <p className="mt-2 font-mono text-lg text-success" aria-live="polite">
          {formatDuration(duration)}
        </p>
      )}

      {isIncoming ? (
        <div className="mt-auto flex w-full items-center justify-around pb-8">
          <div className="flex flex-col items-center gap-2">
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={onHangup}
              aria-label="Recusar chamada"
              className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-lg"
            >
              <PhoneOff className="h-7 w-7" />
            </motion.button>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Recusar</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={() => onAccept?.()}
              aria-label="Atender chamada"
              className="flex h-16 w-16 items-center justify-center rounded-full bg-success text-success-foreground shadow-lg"
            >
              <PhoneIncoming className="h-7 w-7" />
            </motion.button>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Atender</span>
          </div>
        </div>
      ) : (
        <>
          <div className="mx-auto mt-10 grid w-full max-w-[300px] grid-cols-3 gap-y-6">
            <ActionButton label="Mudo" active={isMuted} onClick={onToggleMute}>
              {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </ActionButton>
            <ActionButton label="Teclado" onClick={onToggleKeypad}>
              <Grid3X3 className="h-6 w-6" />
            </ActionButton>
            <ActionButton label="Viva-voz" active={isSpeaker} onClick={onToggleSpeaker}>
              <Volume2 className="h-6 w-6" />
            </ActionButton>
            <ActionButton label="Adicionar" onClick={onAddCall}>
              <UserPlus className="h-6 w-6" />
            </ActionButton>
            <ActionButton label="Vídeo" onClick={onVideo}>
              <Video className="h-6 w-6" />
            </ActionButton>
            <ActionButton label="Contatos" onClick={onContacts}>
              <Users className="h-6 w-6" />
            </ActionButton>
          </div>

          <div className="mt-auto w-full pb-4 pt-8">
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={onHangup}
              aria-label="Encerrar chamada"
              className="mx-auto flex h-14 w-full max-w-[280px] items-center justify-center gap-2 rounded-full bg-destructive font-semibold uppercase tracking-widest text-destructive-foreground shadow-lg"
            >
              <PhoneOff className="h-5 w-5" />
              Encerrar
            </motion.button>
          </div>
        </>
      )}
    </div>
  );
}
