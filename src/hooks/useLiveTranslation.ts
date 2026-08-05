import { useCallback, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { traceHeaders, withTrace } from '@/lib/tracing';
import { detectLanguage, type SupportedLang } from '@/lib/language-detection';

export interface TranslatedSegment {
  id: string;
  speaker: 'agent' | 'customer';
  sourceLang: string;
  targetLang: string;
  original: string;
  translated: string;
  at: Date;
  latencyMs?: number;
}

interface Options {
  callSessionId?: string;
  targetLang: SupportedLang;
  /** ms — segura traduções rápidas demais */
  throttleMs?: number;
  /** mínimo de palavras para disparar tradução */
  minWords?: number;
}

export function useLiveTranslation({ callSessionId, targetLang, throttleMs = 1500, minWords = 4 }: Options) {
  const [segments, setSegments] = useState<TranslatedSegment[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const lastCallRef = useRef(0);
  const queueRef = useRef<string>('');

  const translate = useCallback(async (text: string, speaker: 'agent' | 'customer') => {
    if (!callSessionId || !text?.trim()) return;
    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount < minWords) {
      queueRef.current += ` ${text}`;
      return;
    }
    const now = Date.now();
    const merged = (queueRef.current + ' ' + text).trim();
    queueRef.current = '';
    if (now - lastCallRef.current < throttleMs) return;
    lastCallRef.current = now;

    const detected = detectLanguage(merged);
    if (detected.lang === targetLang && detected.confidence > 0.6) return; // já está no idioma alvo

    setIsTranslating(true);
    try {
      const { data, error } = await withTrace('translate-utterance', () =>
        supabase.functions.invoke('translate-utterance', {
          body: {
            callSessionId,
            text: merged,
            speaker,
            sourceLang: detected.lang,
            targetLang,
          },
          headers: traceHeaders(),
        }),
      );
      if (error) throw error;
      if (data?.translated) {
        setSegments((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            speaker,
            sourceLang: detected.lang,
            targetLang,
            original: merged,
            translated: data.translated,
            at: new Date(),
            latencyMs: data.latency_ms,
          },
        ]);
      }
    } catch (e) {
      logger.error('useLiveTranslation', e);
    } finally {
      setIsTranslating(false);
    }
  }, [callSessionId, targetLang, throttleMs, minWords]);

  const reset = useCallback(() => {
    setSegments([]);
    queueRef.current = '';
    lastCallRef.current = 0;
  }, []);

  return { segments, isTranslating, translate, reset };
}
