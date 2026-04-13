import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useContacts, Contact, ContactInteraction } from '@/hooks/useContacts';
import { logger } from '@/lib/logger';

interface PersonalityProfile {
  personality_traits: string[];
  communication_style: string;
  preferred_contact_time: string;
  interests: string[];
  pain_points: string[];
  buying_signals: string[];
  relationship_status: string;
  engagement_level: string;
  sentiment_trend: string;
  recommendations: string[];
  summary: string;
}

export interface DashboardMetrics {
  totalContacts: number;
  contactsWithProfile: number;
  totalInteractions: number;
  avgInteractionsPerContact: number;
  sentimentDistribution: { name: string; value: number; color: string }[];
  engagementDistribution: { name: string; value: number; color: string }[];
  relationshipDistribution: { name: string; value: number; color: string }[];
  topInterests: { name: string; count: number }[];
  topPainPoints: { name: string; count: number }[];
  topBuyingSignals: { name: string; count: number }[];
  allRecommendations: { recommendation: string; contactName: string; contactId: string }[];
  interactionsTrend: { date: string; count: number }[];
  vipContacts: Contact[];
  atRiskContacts: Contact[];
}

const COLORS = {
  positive: '#22c55e', neutral: '#f59e0b', negative: '#ef4444',
  high: '#22c55e', medium: '#f59e0b', low: '#ef4444',
  novo: '#3b82f6', em_desenvolvimento: '#f59e0b', estabelecido: '#22c55e', vip: '#a855f7',
};

export function useContactInsights() {
  const { contacts, isLoading: loadingContacts, fetchContacts } = useContacts();
  const [allInteractions, setAllInteractions] = useState<ContactInteraction[]>([]);
  const [loadingInteractions, setLoadingInteractions] = useState(true);

  useEffect(() => {
    const fetchAllInteractions = async () => {
      setLoadingInteractions(true);
      try {
        const { data, error } = await supabase.from('contact_interactions').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setAllInteractions((data || []) as ContactInteraction[]);
      } catch (err) {
        logger.error('Error fetching interactions:', err);
      } finally {
        setLoadingInteractions(false);
      }
    };
    fetchAllInteractions();
  }, []);

  const metrics: DashboardMetrics = useMemo(() => {
    const contactsWithProfile = contacts.filter(c => c.personality_insights && Object.keys(c.personality_insights).length > 0);
    const sentimentCounts = { positivo: 0, neutro: 0, negativo: 0, melhorando: 0, piorando: 0 };
    const engagementCounts = { alto: 0, 'médio': 0, baixo: 0 };
    const relationshipCounts: Record<string, number> = { novo: 0, em_desenvolvimento: 0, estabelecido: 0, vip: 0 };
    const interestsCounts: Record<string, number> = {};
    const painPointsCounts: Record<string, number> = {};
    const buyingSignalsCounts: Record<string, number> = {};
    const allRecs: { recommendation: string; contactName: string; contactId: string }[] = [];

    contactsWithProfile.forEach(c => {
      const profile = c.personality_insights as unknown as PersonalityProfile;
      const sentiment = profile.sentiment_trend?.toLowerCase() || 'neutro';
      if (sentiment in sentimentCounts) sentimentCounts[sentiment as keyof typeof sentimentCounts]++;
      const engagement = profile.engagement_level?.toLowerCase() || 'médio';
      if (engagement in engagementCounts) engagementCounts[engagement as keyof typeof engagementCounts]++;
      const status = profile.relationship_status || 'novo';
      if (status in relationshipCounts) relationshipCounts[status]++;
      profile.interests?.forEach(i => { interestsCounts[i] = (interestsCounts[i] || 0) + 1; });
      profile.pain_points?.forEach(p => { painPointsCounts[p] = (painPointsCounts[p] || 0) + 1; });
      profile.buying_signals?.forEach(s => { buyingSignalsCounts[s] = (buyingSignalsCounts[s] || 0) + 1; });
      profile.recommendations?.forEach(rec => { allRecs.push({ recommendation: rec, contactName: c.name, contactId: c.id }); });
    });

    const sortByCount = (counts: Record<string, number>) =>
      Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);

    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const interactionsByDay: Record<string, number> = {};
    allInteractions.forEach(i => {
      const date = new Date(i.created_at);
      if (date >= thirtyDaysAgo) { const key = date.toISOString().split('T')[0]; interactionsByDay[key] = (interactionsByDay[key] || 0) + 1; }
    });

    const vipContacts = contactsWithProfile.filter(c => {
      const p = c.personality_insights as unknown as PersonalityProfile;
      return p.relationship_status === 'vip' || p.engagement_level?.toLowerCase() === 'alto';
    });
    const atRiskContacts = contactsWithProfile.filter(c => {
      const p = c.personality_insights as unknown as PersonalityProfile;
      return p.sentiment_trend?.toLowerCase() === 'negativo' || p.sentiment_trend?.toLowerCase() === 'piorando' || p.engagement_level?.toLowerCase() === 'baixo';
    });

    return {
      totalContacts: contacts.length,
      contactsWithProfile: contactsWithProfile.length,
      totalInteractions: allInteractions.length,
      avgInteractionsPerContact: contacts.length > 0 ? Math.round((allInteractions.length / contacts.length) * 10) / 10 : 0,
      sentimentDistribution: [
        { name: 'Positivo', value: sentimentCounts.positivo + sentimentCounts.melhorando, color: COLORS.positive },
        { name: 'Neutro', value: sentimentCounts.neutro, color: COLORS.neutral },
        { name: 'Negativo', value: sentimentCounts.negativo + sentimentCounts.piorando, color: COLORS.negative },
      ].filter(s => s.value > 0),
      engagementDistribution: [
        { name: 'Alto', value: engagementCounts.alto, color: COLORS.high },
        { name: 'Médio', value: engagementCounts['médio'], color: COLORS.medium },
        { name: 'Baixo', value: engagementCounts.baixo, color: COLORS.low },
      ].filter(s => s.value > 0),
      relationshipDistribution: [
        { name: 'Novo', value: relationshipCounts.novo, color: COLORS.novo },
        { name: 'Em Desenvolvimento', value: relationshipCounts.em_desenvolvimento, color: COLORS.em_desenvolvimento },
        { name: 'Estabelecido', value: relationshipCounts.estabelecido, color: COLORS.estabelecido },
        { name: 'VIP', value: relationshipCounts.vip, color: COLORS.vip },
      ].filter(s => s.value > 0),
      topInterests: sortByCount(interestsCounts),
      topPainPoints: sortByCount(painPointsCounts),
      topBuyingSignals: sortByCount(buyingSignalsCounts),
      allRecommendations: allRecs.slice(0, 10),
      interactionsTrend: Object.entries(interactionsByDay).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date)),
      vipContacts: vipContacts.slice(0, 5),
      atRiskContacts: atRiskContacts.slice(0, 5),
    };
  }, [contacts, allInteractions]);

  const isLoading = loadingContacts || loadingInteractions;
  const profileCoverage = metrics.totalContacts > 0 ? Math.round((metrics.contactsWithProfile / metrics.totalContacts) * 100) : 0;
  const getInitials = (name: string) => name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);

  return { metrics, isLoading, profileCoverage, getInitials, fetchContacts };
}
