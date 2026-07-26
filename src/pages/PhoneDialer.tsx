import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Radio, Headphones, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useMultiChannelCall, type CallChannel } from '@/hooks/useMultiChannelCall';
import { useCallHistory } from '@/hooks/useCallHistory';
import { useSipCall } from '@/hooks/useSipCall';
import { useDialerFavorites } from '@/hooks/useDialerFavorites';
import { PhoneFrame } from '@/components/dialer/phone/PhoneFrame';
import { PhoneDialpad } from '@/components/dialer/phone/PhoneDialpad';
import { PhoneCallScreen } from '@/components/dialer/phone/PhoneCallScreen';
import { PhoneQuickAccess, type QuickAccessEntry } from '@/components/dialer/phone/PhoneQuickAccess';
import { sanitizeDialInput, isDialable } from '@/components/dialer/phone/phone-utils';
import { VoiceAssistantDialog } from '@/components/voice/VoiceAssistantDialog';
import { VoiceAssistantOrb } from '@/components/voice/VoiceAssistantOrb';
import type { VoiceIntent } from '@/components/voice/voice-intent';
import {
  ensureNotificationPermission,
  startIncomingCallAlert,
} from '@/lib/incoming-call-alert';
import { formatPhoneDisplay } from '@/components/dialer/phone/phone-utils';

const CHANNELS: Array<{ id: CallChannel; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'sip', label: 'SIP', icon: Headphones },
  { id: 'webrtc', label: 'WebRTC', icon: Radio },
  { id: 'wavoip', label: 'WhatsApp', icon: MessageCircle },
];

const STATUS_LABEL: Record<string, string> = {
  connecting: 'Conectando',
  ringing: 'Chamando',
  active: 'Em chamada',
  'on-hold': 'Em espera',
  conference: 'Conferência',
  transferring: 'Transferindo',
};

const PhoneDialer = () => {
  usePageTitle('Discador');
  const navigate = useNavigate();
  const call = useMultiChannelCall();
  const { sessions, isLoading } = useCallHistory();
  const sip = useSipCall();
  const { favorites: savedFavorites, isFavorite, toggleFavorite, moveFavorite } = useDialerFavorites();

  const [input, setInput] = useState('');
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [lastDialed, setLastDialed] = useState<string | null>(null);

  const current = call.currentCall;
  const incomingSessionIdRef = useRef<string | null>(null);

  /**
   * Espelha convites SIP entrantes no estado multicanal para que a tela de
   * chamada exiba "Atender/Recusar" com dados reais do chamador.
   */
  useEffect(() => {
    const incoming = sip.incomingCall;
    if (incoming && !incomingSessionIdRef.current) {
      const session = call.initiateCall('sip', incoming.from || 'desconhecido', incoming.displayName ?? undefined);
      if (!session) {
        // Sem linha livre: rejeita para não deixar o chamador em espera indefinida.
        sip.rejectCall();
        toast.warning('Chamada recebida recusada', { description: 'Limite de linhas simultâneas atingido.' });
        return;
      }
      incomingSessionIdRef.current = session.id;
      call.updateCallStatus('ringing', session.id);
    }
    if (!incoming && incomingSessionIdRef.current) {
      const pendingId = incomingSessionIdRef.current;
      incomingSessionIdRef.current = null;
      // Só encerra se ainda estiver tocando (não atendida)
      const pending = call.getCallById(pendingId);
      if (pending && pending.status === 'ringing') call.endCall(pendingId);
    }
  }, [sip, call]);

  const recents: QuickAccessEntry[] = useMemo(
    () =>
      (sessions ?? [])
        .filter((session) => Boolean(session.caller_phone))
        .slice(0, 12)
        .map((session) => ({
          id: session.id,
          name: session.caller_name || session.caller_phone || 'Desconhecido',
          phone: session.caller_phone as string,
          hint: session.direction === 'inbound' ? 'Recebida' : 'Feita',
        })),
    [sessions],
  );

  const favorites: QuickAccessEntry[] = useMemo(
    () =>
      savedFavorites.map((favorite) => ({
        id: favorite.id,
        name: favorite.label || favorite.phone,
        phone: favorite.phone,
        favorite: true,
      })),
    [savedFavorites],
  );

  const startCall = useCallback(
    (rawNumber: string, contactName?: string) => {
      const number = sanitizeDialInput(rawNumber);
      if (!isDialable(number)) {
        toast.error('Número inválido', { description: 'Informe pelo menos 3 dígitos.' });
        return;
      }
      const session = call.initiateCall(call.activeChannel, number, contactName);
      if (!session) {
        toast.error('Limite de chamadas simultâneas atingido');
        return;
      }
      setLastDialed(number);
      call.updateCallStatus('ringing', session.id);
      if (call.activeChannel === 'sip') {
        void sip.startCall(number).then((ok) => {
          if (!ok) call.endCall(session.id);
        });
      }
      toast.success('Chamada iniciada', { description: `Canal ${call.activeChannel.toUpperCase()}` });
    },
    [call, sip],
  );

  const handleVoiceIntent = useCallback(
    (intent: VoiceIntent) => {
      switch (intent.action) {
        case 'dial':
          if (intent.target) startCall(intent.target);
          break;
        case 'hangup':
          sip.endCall();
          call.endCall();
          break;
        case 'mute':
        case 'unmute': {
          const next = !(current?.isMuted ?? false);
          sip.toggleMute(next);
          call.toggleMute();
          break;
        }
        case 'redial':
          if (lastDialed) startCall(lastDialed);
          else toast.info('Nenhuma chamada recente para repetir');
          break;
        case 'history':
          navigate('/history');
          break;
        default:
          break;
      }
    },
    [call, current, lastDialed, navigate, sip, startCall],
  );

  // Suporte a teclado físico no dialpad
  useEffect(() => {
    if (current || assistantOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return;
      if (/^[0-9*#+]$/.test(event.key)) setInput((prev) => sanitizeDialInput(prev + event.key));
      else if (event.key === 'Backspace') setInput((prev) => prev.slice(0, -1));
      else if (event.key === 'Enter') setInput((prev) => { if (isDialable(prev)) startCall(prev); return prev; });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [current, assistantOpen, startCall]);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(sanitizeDialInput(text));
    } catch {
      toast.error('Não foi possível ler a área de transferência');
    }
  }, []);

  return (
    <div className="animate-fade-in space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Discador</h1>
          <p className="text-sm text-muted-foreground">Faça chamadas por teclado ou por voz</p>
        </div>
        <Button type="button" variant="outline" onClick={() => setAssistantOpen(true)}>
          <Sparkles className="mr-2 h-4 w-4" />
          Assistente de voz
        </Button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <PhoneFrame>
          {current ? (
            <PhoneCallScreen
              phoneNumber={current.phoneNumber ?? ''}
              contactName={current.contactName}
              statusLabel={STATUS_LABEL[current.status] ?? 'Chamada'}
              duration={current.duration}
              isMuted={current.isMuted}
              isSpeaker={isSpeaker}
              isIncoming={current.direction === 'inbound' && current.status === 'ringing'}
              onToggleMute={() => { sip.toggleMute(!current.isMuted); call.toggleMute(); }}
              onToggleSpeaker={() => setIsSpeaker((prev) => !prev)}
              onToggleKeypad={() => navigate('/calls')}
              onAddCall={() => navigate('/calls')}
              onVideo={() => navigate('/video-conference')}
              onContacts={() => navigate('/contacts')}
              onHangup={() => {
                if (sip.incomingCall) sip.rejectCall();
                else if (current.direction === 'inbound' || call.activeChannel === 'sip') sip.endCall();
                call.endCall();
              }}
              onAccept={() => {
                void sip.answerCall().then((ok) => {
                  if (ok) call.updateCallStatus('active');
                });
              }}
            />
          ) : (
            <>
              <div className="flex justify-center gap-2 pb-2" role="group" aria-label="Canal de chamada">
                {CHANNELS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => call.setActiveChannel(id)}
                    aria-pressed={call.activeChannel === id}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full border border-border/50 px-3 py-1.5 text-xs transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      call.activeChannel === id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card/60 text-muted-foreground hover:bg-accent',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>
              <PhoneDialpad
                value={input}
                onDigit={(digit) => setInput((prev) => sanitizeDialInput(prev + digit))}
                onBackspace={() => setInput((prev) => prev.slice(0, -1))}
                onClear={() => setInput('')}
                onCall={() => startCall(input)}
              />
            </>
          )}
        </PhoneFrame>

        <div className="min-h-[400px]">
          <PhoneQuickAccess
            recents={recents}
            favorites={favorites}
            isLoading={isLoading}
            onSelect={(phone, name) => {
              setInput(sanitizeDialInput(phone));
              if (name) toast.info(name, { description: 'Número carregado no discador' });
            }}
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
            onPaste={handlePaste}
            onOpenContacts={() => navigate('/contacts')}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setAssistantOpen(true)}
        aria-label="Abrir assistente de voz"
        className="fixed bottom-6 right-6 z-40 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <VoiceAssistantOrb size={64} active={assistantOpen} />
      </button>

      <VoiceAssistantDialog open={assistantOpen} onOpenChange={setAssistantOpen} onIntent={handleVoiceIntent} />

      <Badge variant="outline" className="sr-only">
        {call.activeCalls.length} chamadas ativas
      </Badge>
    </div>
  );
};

export default PhoneDialer;
