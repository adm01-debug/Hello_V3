import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

const log = logger.create('BattleCardDetection');

export interface BattleCard {
  id: string;
  competitor_name: string;
  description: string | null;
  our_strengths: string[];
  their_weaknesses: string[];
  talking_points: string[];
  objection_responses: Array<{ objection: string; response: string }>;
  is_active: boolean;
}

interface Trigger {
  id: string;
  battle_card_id: string;
  keyword: string;
  match_type: 'contains' | 'exact' | 'starts_with';
}

export function useBattleCardDetection(active: boolean) {
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [cards, setCards] = useState<BattleCard[]>([]);
  const [activeCard, setActiveCard] = useState<BattleCard | null>(null);
  const firedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!active) return;
    (async () => {
      const [{ data: cardsData }, { data: trigsData }] = await Promise.all([
        (supabase.from('battle_cards') as any).select('*').eq('is_active', true),
        (supabase.from('battle_card_triggers') as any).select('*').eq('is_active', true),
      ]);
      setCards((cardsData || []) as BattleCard[]);
      setTriggers((trigsData || []) as Trigger[]);
      log.info('Battle cards loaded', { count: cardsData?.length || 0 });
    })();
  }, [active]);

  const checkText = useCallback((text: string): BattleCard | null => {
    if (!text || triggers.length === 0) return null;
    const lower = text.toLowerCase();
    for (const t of triggers) {
      const kw = t.keyword.toLowerCase();
      const hit =
        t.match_type === 'exact' ? lower.split(/\W+/).includes(kw)
        : t.match_type === 'starts_with' ? lower.startsWith(kw)
        : lower.includes(kw);
      if (hit && !firedRef.current.has(t.battle_card_id)) {
        firedRef.current.add(t.battle_card_id);
        const card = cards.find(c => c.id === t.battle_card_id);
        if (card) {
          setActiveCard(card);
          return card;
        }
      }
    }
    return null;
  }, [triggers, cards]);

  const dismiss = useCallback(() => setActiveCard(null), []);

  const reset = useCallback(() => {
    firedRef.current.clear();
    setActiveCard(null);
  }, []);

  return { activeCard, checkText, dismiss, reset, cards, triggers };
}
