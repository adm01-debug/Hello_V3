// Stub for @elevenlabs/react - provides a mock useConversation hook
import { logger } from '@/lib/logger';
// Install @elevenlabs/react for real WebRTC functionality

export function useConversation(options?: {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (message: any) => void;
  onError?: (error: unknown) => void;
}) {
  return {
    status: 'disconnected' as const,
    isSpeaking: false,
    startSession: async (_opts?: any) => {
      logger.warn('ElevenLabs not configured. Install @elevenlabs/react for WebRTC support.');
      options?.onConnect?.();
    },
    endSession: async () => {
      options?.onDisconnect?.();
    },
    setVolume: (_opts: { volume: number }) => {},
  };
}
