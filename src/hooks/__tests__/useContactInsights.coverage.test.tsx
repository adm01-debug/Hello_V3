import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const orderMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: (...a: unknown[]) => orderMock(...a),
    })),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    create: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  },
}));

const fetchContactsMock = vi.fn();
const contactsState: { contacts: unknown[]; isLoading: boolean } = { contacts: [], isLoading: false };

vi.mock('@/hooks/useContacts', () => ({
  useContacts: () => ({
    contacts: contactsState.contacts,
    isLoading: contactsState.isLoading,
    fetchContacts: fetchContactsMock,
  }),
}));

import { useContactInsights } from '@/hooks/useContactInsights';

const now = new Date().toISOString();

function makeContact(id: string, insights: Record<string, unknown> | null) {
  return {
    id,
    name: `Contact ${id}`,
    personality_insights: insights ?? {},
    created_at: now,
    updated_at: now,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  contactsState.contacts = [];
  contactsState.isLoading = false;
  orderMock.mockResolvedValue({ data: [], error: null });
});

describe('useContactInsights', () => {
  it('returns empty metrics with no contacts', async () => {
    const { result } = renderHook(() => useContactInsights());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.metrics.totalContacts).toBe(0);
    expect(result.current.profileCoverage).toBe(0);
    expect(result.current.fetchContacts).toBe(fetchContactsMock);
  });

  it('computes distributions across varied personality profiles', async () => {
    contactsState.contacts = [
      makeContact('1', {
        sentiment_trend: 'positivo', engagement_level: 'alto', relationship_status: 'vip',
        interests: ['golf', 'wine'], pain_points: ['price'], buying_signals: ['ready'],
        recommendations: ['follow up'],
      }),
      makeContact('2', {
        sentiment_trend: 'melhorando', engagement_level: 'médio', relationship_status: 'em_desenvolvimento',
        interests: ['golf'], pain_points: ['support'], buying_signals: ['ready'],
        recommendations: ['call'],
      }),
      makeContact('3', {
        sentiment_trend: 'negativo', engagement_level: 'baixo', relationship_status: 'novo',
        interests: ['tech'], pain_points: ['price'], buying_signals: ['budget'],
        recommendations: ['email'],
      }),
      makeContact('4', {
        sentiment_trend: 'piorando', engagement_level: 'médio', relationship_status: 'estabelecido',
        interests: [], pain_points: [], buying_signals: [], recommendations: [],
      }),
      makeContact('5', {}), // no keys => not "with profile"
    ];
    orderMock.mockResolvedValue({
      data: [
        { id: 'i1', contact_id: '1', interaction_type: 'call', metadata: {}, created_at: now },
        { id: 'i2', contact_id: '2', interaction_type: 'call', metadata: {}, created_at: now },
        // old interaction outside 30 day window
        { id: 'i3', contact_id: '3', interaction_type: 'call', metadata: {}, created_at: '2000-01-01T00:00:00.000Z' },
      ],
      error: null,
    });

    const { result } = renderHook(() => useContactInsights());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await waitFor(() => expect(result.current.metrics.contactsWithProfile).toBe(4));

    const m = result.current.metrics;
    expect(m.totalContacts).toBe(5);
    expect(m.totalInteractions).toBe(3);
    expect(m.avgInteractionsPerContact).toBeGreaterThan(0);
    // sentiment: positive = positivo + melhorando = 2; negative = negativo + piorando = 2
    expect(m.sentimentDistribution.find(s => s.name === 'Positivo')?.value).toBe(2);
    expect(m.sentimentDistribution.find(s => s.name === 'Negativo')?.value).toBe(2);
    expect(m.engagementDistribution.find(s => s.name === 'Alto')?.value).toBe(1);
    expect(m.relationshipDistribution.find(s => s.name === 'VIP')?.value).toBe(1);
    expect(m.topInterests[0].name).toBe('golf');
    expect(m.allRecommendations.length).toBe(3);
    expect(m.interactionsTrend.length).toBe(1); // only the 2 recent share today's date
    expect(m.vipContacts.length).toBeGreaterThanOrEqual(1);
    expect(m.atRiskContacts.length).toBeGreaterThanOrEqual(1);
    expect(result.current.profileCoverage).toBe(80);
  });

  it('handles fetch error gracefully', async () => {
    orderMock.mockResolvedValue({ data: null, error: { message: 'db error' } });
    const { result } = renderHook(() => useContactInsights());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.metrics.totalInteractions).toBe(0);
  });
});
