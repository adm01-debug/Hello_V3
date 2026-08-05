import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBattleCardDetection, type BattleCard } from '@/hooks/useBattleCardDetection';

vi.mock('@/integrations/supabase/client', () => {
  const cards = [
    { id: 'card-1', competitor_name: 'Acme', description: null, our_strengths: ['preço'], their_weaknesses: [], talking_points: ['suporte 24h'], objection_responses: [], is_active: true },
    { id: 'card-2', competitor_name: 'Globex', description: null, our_strengths: [], their_weaknesses: [], talking_points: [], objection_responses: [], is_active: true },
  ];
  const triggers = [
    { id: 't1', battle_card_id: 'card-1', keyword: 'acme', match_type: 'contains' },
    { id: 't2', battle_card_id: 'card-2', keyword: 'globex', match_type: 'exact' },
    { id: 't3', battle_card_id: 'card-1', keyword: 'concor', match_type: 'starts_with' },
  ];
  return {
    supabase: {
      from: (table: string) => ({
        select: () => ({
          eq: () => Promise.resolve({ data: table === 'battle_cards' ? cards : triggers, error: null }),
        }),
      }),
    },
  };
});

describe('useBattleCardDetection', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does nothing when inactive', () => {
    const { result } = renderHook(() => useBattleCardDetection(false));
    expect(result.current.checkText('acme corp')).toBeNull();
  });

  it('matches contains keyword', async () => {
    const { result } = renderHook(() => useBattleCardDetection(true));
    await waitFor(() => expect(result.current.cards.length).toBeGreaterThan(0));
    let card: BattleCard | null = null;
    act(() => { card = result.current.checkText('Vi a Acme oferecendo desconto'); });
    expect(card).not.toBeNull();
    expect(card!.competitor_name).toBe('Acme');
  });

  it('matches exact keyword as a whole word', async () => {
    const { result } = renderHook(() => useBattleCardDetection(true));
    await waitFor(() => expect(result.current.triggers.length).toBeGreaterThan(0));
    act(() => { result.current.reset(); });
    let card: BattleCard | null = null;
    act(() => { card = result.current.checkText('estou usando globex hoje'); });
    expect(card!.competitor_name).toBe('Globex');
  });

  it('matches starts_with keyword', async () => {
    const { result } = renderHook(() => useBattleCardDetection(true));
    await waitFor(() => expect(result.current.triggers.length).toBeGreaterThan(0));
    act(() => { result.current.reset(); });
    let card = null;
    act(() => { card = result.current.checkText('concorrente novo no mercado'); });
    expect(card).not.toBeNull();
  });

  it('does not fire same card twice until reset', async () => {
    const { result } = renderHook(() => useBattleCardDetection(true));
    await waitFor(() => expect(result.current.cards.length).toBeGreaterThan(0));
    act(() => { result.current.reset(); });
    let first = null, second = null;
    act(() => { first = result.current.checkText('Acme'); });
    act(() => { second = result.current.checkText('Acme novamente'); });
    expect(first).not.toBeNull();
    expect(second).toBeNull();
    act(() => { result.current.reset(); });
    let third = null;
    act(() => { third = result.current.checkText('Acme'); });
    expect(third).not.toBeNull();
  });
});
