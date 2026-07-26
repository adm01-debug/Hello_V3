import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Gauge, Keyboard, MicOff, Send, Trash2, Volume2, VolumeX, X } from 'lucide-react';
import { useVoiceCommand } from '@/hooks/useVoiceCommand';
import { useVoicePreferences } from '@/hooks/useVoicePreferences';
import { formatTtsRate } from '@/lib/voice-preferences';
import { cancelSpeech, isSpeechSupported, speak } from '@/lib/voice-speech';
import { FloatingParticles } from './overlay/FloatingParticles';
import { VoiceOrb } from './overlay/VoiceOrb';
import { SpectrumWaveform } from './overlay/VoiceVisualEffects';
import { usePhaseColors, type VoicePhase } from './overlay/usePhaseColors';
import { describeIntent, parseVoiceIntent, type VoiceIntent } from './voice-intent';


interface VoiceAssistantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIntent: (intent: VoiceIntent) => void;
}

const SUGGESTIONS = [
  'Ligar para 11 98765-4321',
  'Encerrar chamada',
  'Ativar mudo',
  'Repetir última chamada',
];

const PHASE_META: Record<VoicePhase, { title: string; subtitle: string }> = {
  idle: { title: 'Assistente de Voz', subtitle: 'Toque no orbe para começar' },
  listening: { title: 'Ouvindo…', subtitle: 'Diga o que você precisa' },
  processing: { title: 'Processando…', subtitle: 'IA interpretando seu comando' },
  speaking: { title: 'Respondendo…', subtitle: 'Ouvindo a resposta' },
  error: { title: 'Não entendi', subtitle: 'Toque no orbe e tente de novo' },
};

/** Overlay imersivo do assistente de voz (design portado do PROMO GIFTS). */
export function VoiceAssistantDialog({ open, onOpenChange, onIntent }: VoiceAssistantDialogProps) {
  const { isListening, isProcessing, lastCommand, startListening, stopListening } = useVoiceCommand();
  const [showTextInput, setShowTextInput] = useState(false);
  const [textCommand, setTextCommand] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isBooting, setIsBooting] = useState(false);
  const [bootingTimedOut, setBootingTimedOut] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { ttsEnabled, ttsRate, history, toggleTts, cycleRate, recordCommand, clearHistory } =
    useVoicePreferences();
  const textInputRef = useRef<HTMLInputElement>(null);
  const wasOpenRef = useRef(false);
  const ttsEnabledRef = useRef(ttsEnabled);
  ttsEnabledRef.current = ttsEnabled;
  const ttsRateRef = useRef(ttsRate);
  ttsRateRef.current = ttsRate;

  const phase: VoicePhase = hasError
    ? 'error'
    : isProcessing
      ? 'processing'
      : isListening
        ? 'listening'
        : isSpeaking
          ? 'speaking'
          : 'idle';


  /** Fala uma resposta e mantém a fase "speaking" enquanto durar o áudio. */
  const respond = useCallback((text: string) => {
    if (!ttsEnabledRef.current) return;
    setIsSpeaking(true);
    const started = speak(text, { rate: ttsRateRef.current, onEnd: () => setIsSpeaking(false) });
    if (!started) setIsSpeaking(false);
  }, []);

  const handleIntent = useCallback(
    (text: string) => {
      const intent = parseVoiceIntent(text);
      const description = describeIntent(intent);
      setFeedback(description);
      recordCommand(text);


      if (intent.action === 'none') {
        // Fase de erro real: comando não reconhecido.
        setHasError(true);
        respond(description);
        return;
      }

      setHasError(false);
      respond(description);
      onIntent(intent);
      onOpenChange(false);
    },
    [onIntent, onOpenChange, respond, userId],
  );

  useEffect(() => {
    if (lastCommand?.command) handleIntent(lastCommand.command);
  }, [lastCommand, handleIntent]);

  // Transição de fechamento
  useEffect(() => {
    if (open) {
      wasOpenRef.current = true;
      setIsClosing(false);
      return;
    }
    if (wasOpenRef.current) {
      wasOpenRef.current = false;
      setIsClosing(true);
      setFeedback(null);
      setHasError(false);
      const timer = window.setTimeout(() => setIsClosing(false), 300);
      return () => window.clearTimeout(timer);
    }
  }, [open]);

  // Interrompe a fala ao fechar ou desmontar o overlay.
  useEffect(() => {
    if (open) return;
    cancelSpeech();
    setIsSpeaking(false);
  }, [open]);

  useEffect(() => () => cancelSpeech(), []);


  const toggleListening = useCallback(() => {
    if (isProcessing) return;
    setHasError(false);
    cancelSpeech();
    setIsSpeaking(false);
    if (isListening) {
      stopListening();
    } else {
      setIsBooting(true);
      void startListening();
    }
  }, [isListening, isProcessing, startListening, stopListening]);


  useEffect(() => {
    if (isListening || isProcessing) setIsBooting(false);
  }, [isListening, isProcessing]);

  // Timeout do estado "ativando microfone"
  useEffect(() => {
    if (!open || !isBooting) {
      setBootingTimedOut(false);
      return;
    }
    const timer = window.setTimeout(() => setBootingTimedOut(true), 10000);
    return () => window.clearTimeout(timer);
  }, [open, isBooting]);

  // Atalhos de teclado
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
        return;
      }
      const target = event.target;
      const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
      if (event.key === ' ' && !typing) {
        event.preventDefault();
        toggleListening();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange, toggleListening]);

  const showBooting = (isBooting && phase === 'idle') || isClosing;
  const meta = PHASE_META[phase];
  const colors = usePhaseColors(phase, showBooting);
  const isWaveformActive = phase === 'listening' || showBooting;

  const borderGlow = useMemo(() => {
    const match = colors.primary.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    const [h, s, l] = match ? [match[1], match[2], match[3]] : ['220', '80', '55'];
    return {
      border: `hsla(${h}, ${s}%, ${l}%, 0.35)`,
      shadowDim: `0 0 12px 1px hsla(${h}, ${s}%, ${l}%, 0.15), 0 0 30px 4px hsla(${h}, ${s}%, ${l}%, 0.08), inset 0 0 10px 0px hsla(${h}, ${s}%, ${l}%, 0.05)`,
      shadowBright: `0 0 25px 5px hsla(${h}, ${s}%, ${l}%, 0.35), 0 0 60px 10px hsla(${h}, ${s}%, ${l}%, 0.15), inset 0 0 18px 0px hsla(${h}, ${s}%, ${l}%, 0.1)`,
      borderDim: `hsla(${h}, ${s}%, ${l}%, 0.3)`,
      borderBright: `hsla(${h}, ${s}%, ${l}%, 0.7)`,
    };
  }, [colors.primary]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label="Assistente de Voz"
        >
          {/* Fundo glass pulsante */}
          <motion.div
            className="absolute inset-0 backdrop-blur-xl"
            animate={{ backgroundColor: ['rgba(2,2,10,0.20)', 'rgba(2,2,10,0.65)', 'rgba(2,2,10,0.20)'] }}
            transition={{ duration: 6.6, repeat: Infinity, ease: 'easeInOut' }}
            onClick={() => onOpenChange(false)}
          />

          <FloatingParticles phase={phase} isBooting={showBooting} />

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="pointer-events-auto relative w-full max-w-xs"
            >
              <motion.div
                className="relative flex max-h-[90vh] w-full flex-col items-center gap-4 overflow-hidden rounded-3xl px-6 py-7"
                style={{ background: 'rgba(8,8,18,0.95)' }}
                animate={{
                  boxShadow: [borderGlow.shadowDim, borderGlow.shadowBright, borderGlow.shadowDim],
                  borderColor: [borderGlow.borderDim, borderGlow.borderBright, borderGlow.borderDim],
                  border: `1.5px solid ${borderGlow.border}`,
                }}
                transition={{
                  boxShadow: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
                  borderColor: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
                  border: { duration: 0.8, ease: 'easeInOut' },
                }}
              >
                {/* Título */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="space-y-1 text-center"
                >
                  <h2 className="text-sm font-semibold tracking-wide text-white/70">
                    {showBooting
                      ? bootingTimedOut ? 'Microfone indisponível' : 'Ativando microfone…'
                      : meta.title}
                  </h2>
                  <p className="text-[11px] tracking-wider text-white/30">
                    {showBooting
                      ? bootingTimedOut ? 'Verifique as permissões do navegador' : 'Preparando sua conversa por voz'
                      : meta.subtitle}
                  </p>
                </motion.div>

                {/* Orbe clicável */}
                <motion.div
                  className="cursor-pointer select-none"
                  onClick={toggleListening}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  role="button"
                  aria-label={
                    showBooting ? 'Ativando microfone'
                      : phase === 'listening' ? 'Parar de ouvir'
                        : phase === 'processing' ? 'Processando comando'
                          : 'Iniciar microfone'
                  }
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') toggleListening();
                  }}
                >
                  <VoiceOrb phase={phase} isBooting={showBooting} />
                </motion.div>

                {/* Espectro */}
                <AnimatePresence mode="wait">
                  {isWaveformActive && (
                    <motion.div
                      key="spectrum"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <SpectrumWaveform colors={colors} isActive={isWaveformActive} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Transcrição / feedback */}
                <AnimatePresence mode="wait">
                  {lastCommand?.command && (
                    <motion.div
                      key="transcript"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="w-full"
                    >
                      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.06] px-5 py-4 backdrop-blur-sm">
                        <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.15em] text-white/35">
                          Você disse:
                        </p>
                        <p className="text-[15px] font-medium leading-relaxed text-white/90">
                          "{lastCommand.command}"
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {feedback && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="w-full"
                    >
                      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.06] px-5 py-4 backdrop-blur-sm">
                        <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.15em] text-white/35">
                          Assistente
                        </p>
                        <p className="text-sm leading-relaxed text-white/90">{feedback}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {bootingTimedOut && showBooting && (
                  <div className="flex w-full items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 px-5 py-4">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-destructive/20">
                      <MicOff className="h-3.5 w-3.5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-destructive">Microfone indisponível</p>
                      <p className="mt-1 text-xs text-white/40">Toque no orbe para tentar novamente</p>
                    </div>
                  </div>
                )}

                {/* Comandos recentes (fallback: sugestões) */}
                {(phase === 'idle' || phase === 'error') && !showBooting && (
                  <motion.div
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="w-full space-y-3 text-center"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <p className="text-[10px] font-medium uppercase tracking-widest text-white/25">
                        {history.length > 0 ? 'Comandos recentes' : 'Experimente dizer'}
                      </p>
                      {history.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setHistory(clearCommandHistory(userId))}
                          className="text-white/20 transition-colors hover:text-white/60"
                          aria-label="Limpar histórico de comandos"
                          title="Limpar histórico"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {(history.length > 0 ? history.map((entry) => entry.command) : SUGGESTIONS).map((cmd) => (
                        <button
                          key={cmd}
                          type="button"
                          onClick={() => handleIntent(cmd)}
                          className="group cursor-pointer rounded-full border border-white/[0.06] bg-white/[0.04] px-3 py-1.5 text-xs text-white/35 transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.08] hover:text-white/70 hover:shadow-[0_0_12px_rgba(255,255,255,0.05)]"
                        >
                          <span className="transition-all duration-200 group-hover:tracking-wide">"{cmd}"</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}


                {/* Entrada por texto */}
                <AnimatePresence>
                  {showTextInput && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="w-full overflow-hidden"
                    >
                      <form
                        onSubmit={(event) => {
                          event.preventDefault();
                          if (!textCommand.trim()) return;
                          handleIntent(textCommand.trim());
                          setTextCommand('');
                          setShowTextInput(false);
                        }}
                        className="flex gap-2"
                      >
                        <input
                          ref={textInputRef}
                          type="text"
                          value={textCommand}
                          onChange={(event) => setTextCommand(event.target.value)}
                          placeholder="Digite um comando..."
                          aria-label="Comando por texto"
                          className="flex-1 rounded-xl border border-white/[0.1] bg-white/[0.06] px-3 py-2 text-sm text-white/90 placeholder:text-white/30 focus:border-white/25 focus:outline-none focus:ring-1 focus:ring-white/10"
                          disabled={isProcessing}
                        />
                        <button
                          type="submit"
                          disabled={!textCommand.trim() || isProcessing}
                          aria-label="Enviar comando"
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/20 text-primary transition-colors hover:bg-primary/30 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Rodapé */}
                <div className="mt-1 flex w-full items-center justify-between">
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-[10px] text-white/20"
                  >
                    <kbd className="rounded border border-white/10 bg-white/5 px-1 py-0.5 font-mono text-[9px]">ESC</kbd> fechar
                    <span className="mx-1.5 text-white/10">·</span>
                    <kbd className="rounded border border-white/10 bg-white/5 px-1 py-0.5 font-mono text-[9px]">SPACE</kbd> ativar
                  </motion.p>
                  <div className="flex items-center gap-1.5">
                    {isSpeechSupported() && (
                      <button
                        type="button"
                        onClick={() => {
                          setTtsEnabled((enabled) => {
                            if (enabled) {
                              cancelSpeech();
                              setIsSpeaking(false);
                            }
                            return !enabled;
                          });
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
                        aria-label={ttsEnabled ? 'Desativar resposta falada' : 'Ativar resposta falada'}
                        aria-pressed={ttsEnabled}
                        title={ttsEnabled ? 'Resposta falada ativada' : 'Resposta falada desativada'}
                      >
                        {ttsEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setShowTextInput((v) => !v);
                        if (!showTextInput) window.setTimeout(() => textInputRef.current?.focus(), 100);
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
                      aria-label="Digitar comando"
                      title="Digitar comando (sem microfone)"
                    >
                      <Keyboard className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenChange(false)}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
                      aria-label="Fechar assistente de voz"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>

          <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {showBooting && 'Ativando microfone.'}
            {phase === 'listening' && 'Ouvindo. Fale seu comando.'}
            {phase === 'processing' && 'Processando comando.'}
            {phase === 'speaking' && 'Assistente respondendo.'}
            {phase === 'error' && 'Comando não reconhecido.'}
          </div>

        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
