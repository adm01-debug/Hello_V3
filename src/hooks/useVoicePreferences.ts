/**
 * Preferências do assistente de voz sincronizadas com o perfil do usuário.
 *
 * Estratégia local-first: o estado local responde imediatamente e a
 * persistência remota (`public.user_profiles`) acontece em segundo plano.
 * O histórico de comandos é fundido entre estação local e perfil, para que
 * um agente veja seus comandos recentes em qualquer dispositivo.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  clearCommandHistory,
  loadCommandHistory,
  pushCommandHistory,
  type VoiceCommandEntry,
} from '@/lib/voice-command-history';
import {
  clampTtsRate,
  mergeCommandHistories,
  nextTtsRate,
  nextVoiceUri,
  parseRemoteHistory,
  sanitizeVoiceUri,
  type VoiceOption,
} from '@/lib/voice-preferences';
import { isSpeechSupported, listVoices, onVoicesChanged } from '@/lib/voice-speech';
import { logger } from '@/lib/logger';

interface VoiceProfileRow {
  voice_tts_enabled?: unknown;
  voice_tts_rate?: unknown;
  voice_command_history?: unknown;
  voice_tts_voice?: unknown;
}

export interface UseVoicePreferences {
  userId: string | null;
  ttsEnabled: boolean;
  ttsRate: number;
  ttsVoice: string | null;
  voices: VoiceOption[];
  history: VoiceCommandEntry[];
  toggleTts: () => boolean;
  cycleRate: () => number;
  cycleVoice: () => string | null;
  recordCommand: (command: string) => void;
  clearHistory: () => void;
}

export function useVoicePreferences(): UseVoicePreferences {
  const speechSupported = isSpeechSupported();
  const [userId, setUserId] = useState<string | null>(null);
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(speechSupported);
  const [ttsRate, setTtsRate] = useState<number>(1);
  const [ttsVoice, setTtsVoice] = useState<string | null>(null);
  const [voices, setVoices] = useState<VoiceOption[]>(() => listVoices());
  const [history, setHistory] = useState<VoiceCommandEntry[]>(() => loadCommandHistory(null));

  // Vozes chegam de forma assíncrona no Chrome: reagir a `voiceschanged`.
  useEffect(() => {
    if (!speechSupported) return;
    const sync = () => setVoices(listVoices());
    sync();
    return onVoicesChanged(sync);
  }, [speechSupported]);

  const userIdRef = useRef<string | null>(null);
  const historyRef = useRef<VoiceCommandEntry[]>(history);
  historyRef.current = history;

  /** Grava um patch no perfil; falhas são acessórias e apenas logadas. */
  const pushToProfile = useCallback(async (patch: Record<string, unknown>) => {
    const uid = userIdRef.current;
    if (!uid) return;
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ ...patch, voice_prefs_updated_at: new Date().toISOString() })
        .eq('id', uid);
      if (error) throw error;
    } catch (error) {
      logger.warn('Falha ao sincronizar preferências de voz', { error });
    }
  }, []);

  // Hidratação inicial a partir do perfil + fusão com o histórico local.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const uid = authData?.user?.id ?? null;
        if (cancelled || !uid) return;
        userIdRef.current = uid;
        setUserId(uid);

        const local = loadCommandHistory(uid);
        if (!cancelled) setHistory(local);

        const { data, error } = await supabase
          .from('user_profiles')
          .select('voice_tts_enabled, voice_tts_rate, voice_command_history, voice_tts_voice')
          .eq('id', uid)
          .maybeSingle();
        if (error) throw error;
        if (cancelled || !data) return;

        const row = data as VoiceProfileRow;
        if (typeof row.voice_tts_enabled === 'boolean') {
          setTtsEnabled(speechSupported && row.voice_tts_enabled);
        }
        setTtsRate(clampTtsRate(row.voice_tts_rate));
        setTtsVoice(sanitizeVoiceUri(row.voice_tts_voice));

        const merged = mergeCommandHistories(local, parseRemoteHistory(row.voice_command_history));
        setHistory(merged);
        // Reescreve o local já fundido para manter as duas pontas coerentes.
        for (const entry of [...merged].reverse()) pushCommandHistory(uid, entry.command, entry.at || Date.now());
        if (merged.length > 0) void pushToProfile({ voice_command_history: merged });
      } catch (error) {
        logger.warn('Falha ao carregar preferências de voz', { error });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pushToProfile, speechSupported]);

  const toggleTts = useCallback((): boolean => {
    const next = !ttsEnabled;
    setTtsEnabled(next);
    void pushToProfile({ voice_tts_enabled: next });
    return next;
  }, [pushToProfile, ttsEnabled]);

  const cycleRate = useCallback((): number => {
    const next = nextTtsRate(ttsRate);
    setTtsRate(next);
    void pushToProfile({ voice_tts_rate: next });
    return next;
  }, [pushToProfile, ttsRate]);

  const cycleVoice = useCallback((): string | null => {
    const next = nextVoiceUri(voices, ttsVoice);
    setTtsVoice(next);
    void pushToProfile({ voice_tts_voice: next });
    return next;
  }, [pushToProfile, ttsVoice, voices]);

  const recordCommand = useCallback(
    (command: string) => {
      const next = pushCommandHistory(userIdRef.current, command);
      setHistory(next);
      void pushToProfile({ voice_command_history: next });
    },
    [pushToProfile],
  );

  const clearHistory = useCallback(() => {
    setHistory(clearCommandHistory(userIdRef.current));
    void pushToProfile({ voice_command_history: [] });
  }, [pushToProfile]);

  return {
    userId,
    ttsEnabled,
    ttsRate,
    ttsVoice,
    voices,
    history,
    toggleTts,
    cycleRate,
    cycleVoice,
    recordCommand,
    clearHistory,
  };
}
