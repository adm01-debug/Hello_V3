import { useState, useEffect, useMemo } from 'react';
import {
  Users,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Heart,
  AlertCircle,
  Target,
  Lightbulb,
  Brain,
  Phone,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { useContacts, Contact, ContactInteraction } from '@/hooks/useContacts';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

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

interface DashboardMetrics {
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
  positive: '#22c55e',
  neutral: '#f59e0b',
  negative: '#ef4444',
  high: '#22c55e',
  medium: '#f59e0b',
  low: '#ef4444',
  novo: '#3b82f6',
  em_desenvolvimento: '#f59e0b',
  estabelecido: '#22c55e',
  vip: '#a855f7'
};

const ContactInsights = () => {
  const { contacts, isLoading: loadingContacts, fetchContacts } = useContacts();
  const [allInteractions, setAllInteractions] = useState<ContactInteraction[]>([]);
  const [loadingInteractions, setLoadingInteractions] = useState(true);

  // Fetch all interactions
  useEffect(() => {
    const fetchAllInteractions = async () => {
      setLoadingInteractions(true);
      try {
        const { data, error } = await supabase
          .from('contact_interactions')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAllInteractions((data || []) as ContactInteraction[]);
      } catch (err) {
        console.error('Error fetching interactions:', err);
      } finally {
        setLoadingInteractions(false);
      }
    };

    fetchAllInteractions();
  }, []);

  // Calculate metrics
  const metrics: DashboardMetrics = useMemo(() => {
    const contactsWithProfile = contacts.filter(c => 
      c.personality_insights && Object.keys(c.personality_insights).length > 0
    );

    // Sentiment distribution
    const sentimentCounts = { positivo: 0, neutro: 0, negativo: 0, melhorando: 0, piorando: 0 };
    contactsWithProfile.forEach(c => {
      const profile = c.personality_insights as unknown as PersonalityProfile;
      const sentiment = profile.sentiment_trend?.toLowerCase() || 'neutro';
      if (sentiment in sentimentCounts) {
        sentimentCounts[sentiment as keyof typeof sentimentCounts]++;
      }
    });

    // Engagement distribution
    const engagementCounts = { alto: 0, médio: 0, baixo: 0 };
    contactsWithProfile.forEach(c => {
      const profile = c.personality_insights as unknown as PersonalityProfile;
      const engagement = profile.engagement_level?.toLowerCase() || 'médio';
      if (engagement in engagementCounts) {
        engagementCounts[engagement as keyof typeof engagementCounts]++;
      }
    });

    // Relationship distribution
    const relationshipCounts: Record<string, number> = { novo: 0, em_desenvolvimento: 0, estabelecido: 0, vip: 0 };
    contactsWithProfile.forEach(c => {
      const profile = c.personality_insights as unknown as PersonalityProfile;
      const status = profile.relationship_status || 'novo';
      if (status in relationshipCounts) {
        relationshipCounts[status]++;
      }
    });

    // Aggregate interests, pain points, buying signals
    const interestsCounts: Record<string, number> = {};
    const painPointsCounts: Record<string, number> = {};
    const buyingSignalsCounts: Record<string, number> = {};
    const allRecs: { recommendation: string; contactName: string; contactId: string }[] = [];

    contactsWithProfile.forEach(c => {
      const profile = c.personality_insights as unknown as PersonalityProfile;
      
      profile.interests?.forEach(interest => {
        interestsCounts[interest] = (interestsCounts[interest] || 0) + 1;
      });
      
      profile.pain_points?.forEach(pain => {
        painPointsCounts[pain] = (painPointsCounts[pain] || 0) + 1;
      });
      
      profile.buying_signals?.forEach(signal => {
        buyingSignalsCounts[signal] = (buyingSignalsCounts[signal] || 0) + 1;
      });

      profile.recommendations?.forEach(rec => {
        allRecs.push({ recommendation: rec, contactName: c.name, contactId: c.id });
      });
    });

    // Sort and get top items
    const sortByCount = (counts: Record<string, number>) => 
      Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    // Interactions trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const interactionsByDay: Record<string, number> = {};
    allInteractions.forEach(i => {
      const date = new Date(i.created_at);
      if (date >= thirtyDaysAgo) {
        const key = date.toISOString().split('T')[0];
        interactionsByDay[key] = (interactionsByDay[key] || 0) + 1;
      }
    });

    const interactionsTrend = Object.entries(interactionsByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // VIP and at-risk contacts
    const vipContacts = contactsWithProfile.filter(c => {
      const profile = c.personality_insights as unknown as PersonalityProfile;
      return profile.relationship_status === 'vip' || profile.engagement_level?.toLowerCase() === 'alto';
    });

    const atRiskContacts = contactsWithProfile.filter(c => {
      const profile = c.personality_insights as unknown as PersonalityProfile;
      return profile.sentiment_trend?.toLowerCase() === 'negativo' || 
             profile.sentiment_trend?.toLowerCase() === 'piorando' ||
             profile.engagement_level?.toLowerCase() === 'baixo';
    });

    return {
      totalContacts: contacts.length,
      contactsWithProfile: contactsWithProfile.length,
      totalInteractions: allInteractions.length,
      avgInteractionsPerContact: contacts.length > 0 
        ? Math.round((allInteractions.length / contacts.length) * 10) / 10 
        : 0,
      sentimentDistribution: [
        { name: 'Positivo', value: sentimentCounts.positivo + sentimentCounts.melhorando, color: COLORS.positive },
        { name: 'Neutro', value: sentimentCounts.neutro, color: COLORS.neutral },
        { name: 'Negativo', value: sentimentCounts.negativo + sentimentCounts.piorando, color: COLORS.negative },
      ].filter(s => s.value > 0),
      engagementDistribution: [
        { name: 'Alto', value: engagementCounts.alto, color: COLORS.high },
        { name: 'Médio', value: engagementCounts.médio, color: COLORS.medium },
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
      interactionsTrend,
      vipContacts: vipContacts.slice(0, 5),
      atRiskContacts: atRiskContacts.slice(0, 5),
    };
  }, [contacts, allInteractions]);

  const isLoading = loadingContacts || loadingInteractions;

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const profileCoverage = metrics.totalContacts > 0 
    ? Math.round((metrics.contactsWithProfile / metrics.totalContacts) * 100) 
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Insights de Contatos
          </h1>
          <p className="text-muted-foreground">
            Análise de personalidade, preferências e tendências dos seus contatos
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => fetchContacts()}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Atualizar
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Carregando insights...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Contatos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalContacts}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.contactsWithProfile} com perfil IA
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Interações</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalInteractions}</div>
                <p className="text-xs text-muted-foreground">
                  ~{metrics.avgInteractionsPerContact} por contato
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contatos VIP</CardTitle>
                <Target className="h-4 w-4 text-pending" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-pending">{metrics.vipContacts.length}</div>
                <p className="text-xs text-muted-foreground">
                  Alto engajamento ou status VIP
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Atenção Necessária</CardTitle>
                <AlertCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{metrics.atRiskContacts.length}</div>
                <p className="text-xs text-muted-foreground">
                  Sentimento negativo ou baixo engajamento
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Profile Coverage */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Cobertura de Perfis IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Progress value={profileCoverage} className="flex-1" />
                <span className="text-sm font-medium">{profileCoverage}%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {metrics.contactsWithProfile} de {metrics.totalContacts} contatos têm análise de perfil
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Sentiment Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Distribuição de Sentimento
                </CardTitle>
              </CardHeader>
              <CardContent>
                {metrics.sentimentDistribution.length > 0 ? (
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={metrics.sentimentDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }: { name: string; percent?: number }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        >
                          {metrics.sentimentDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    Sem dados suficientes
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Engagement Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Níveis de Engajamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                {metrics.engagementDistribution.length > 0 ? (
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metrics.engagementDistribution} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={60} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {metrics.engagementDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    Sem dados suficientes
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Interactions Trend */}
          {metrics.interactionsTrend.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Tendência de Interações (Últimos 30 dias)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metrics.interactionsTrend}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        fontSize={12}
                      />
                      <YAxis fontSize={12} />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        name="Interações"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Top Interests */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Heart className="h-4 w-4 text-pink-500" />
                  Principais Interesses
                </CardTitle>
              </CardHeader>
              <CardContent>
                {metrics.topInterests.length > 0 ? (
                  <div className="space-y-3">
                    {metrics.topInterests.map((interest, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm truncate flex-1">{interest.name}</span>
                        <Badge variant="secondary">{interest.count}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum interesse identificado</p>
                )}
              </CardContent>
            </Card>

            {/* Top Pain Points */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  Principais Dores
                </CardTitle>
              </CardHeader>
              <CardContent>
                {metrics.topPainPoints.length > 0 ? (
                  <div className="space-y-3">
                    {metrics.topPainPoints.map((pain, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm truncate flex-1">{pain.name}</span>
                        <Badge variant="outline" className="text-destructive">{pain.count}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma dor identificada</p>
                )}
              </CardContent>
            </Card>

            {/* Buying Signals */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4 text-success" />
                  Sinais de Compra
                </CardTitle>
              </CardHeader>
              <CardContent>
                {metrics.topBuyingSignals.length > 0 ? (
                  <div className="space-y-3">
                    {metrics.topBuyingSignals.map((signal, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm truncate flex-1">{signal.name}</span>
                        <Badge className="bg-success/10 text-success">{signal.count}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum sinal identificado</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* VIP Contacts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-500" />
                  Contatos VIP
                </CardTitle>
                <CardDescription>Alto valor e engajamento</CardDescription>
              </CardHeader>
              <CardContent>
                {metrics.vipContacts.length > 0 ? (
                  <div className="space-y-3">
                    {metrics.vipContacts.map((contact) => (
                      <div key={contact.id} className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pending/10 text-pending font-semibold">
                          {getInitials(contact.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{contact.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {contact.company || contact.phone}
                          </p>
                        </div>
                        <Badge className="bg-pending/10 text-pending">VIP</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum contato VIP identificado</p>
                )}
              </CardContent>
            </Card>

            {/* At-Risk Contacts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  Contatos em Risco
                </CardTitle>
                <CardDescription>Requerem atenção imediata</CardDescription>
              </CardHeader>
              <CardContent>
                {metrics.atRiskContacts.length > 0 ? (
                  <div className="space-y-3">
                    {metrics.atRiskContacts.map((contact) => {
                      const profile = contact.personality_insights as unknown as PersonalityProfile;
                      return (
                        <div key={contact.id} className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive font-semibold">
                            {getInitials(contact.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{contact.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {profile?.sentiment_trend || 'Baixo engajamento'}
                            </p>
                          </div>
                          <Badge variant="destructive">Atenção</Badge>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum contato em risco</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          {metrics.allRecommendations.length > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  Recomendações da IA
                </CardTitle>
                <CardDescription>Ações sugeridas baseadas nos perfis analisados</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    {metrics.allRecommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-background">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{rec.recommendation}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Para: {rec.contactName}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default ContactInsights;
