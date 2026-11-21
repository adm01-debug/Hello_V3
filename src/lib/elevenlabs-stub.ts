// Stub for @elevenlabs/react - provides a mock useConversation hook
import { logger } from '@/lib/logger';
// Install @elevenlabs/react for real WebRTC functionality

export function useConversation(options?: {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (message: Record<string, unknown>) => void;
  onError?: (error: unknown) => void;
}) {
  return {
    status: 'disconnected' as const,
    isSpeaking: false,
    startSession: async (_opts?: Record<string, unknown>) => {
      // Nunca sinaliza conexão bem-sucedida: sem @elevenlabs/react instalado não há áudio.
      const err = new Error(
        'Chamada WebRTC indisponível: o cliente ElevenLabs (@elevenlabs/react) não está instalado. Use SIP ou Wavoip.'
      );
      logger.warn('ElevenLabs not configured. Install @elevenlabs/react for WebRTC support.');
      options?.onError?.(err);
      return false;
    },
    endSession: async () => {
      options?.onDisconnect?.();
    },
    setVolume: (_opts: { volume: number }) => {},
  };
}
