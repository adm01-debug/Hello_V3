import { Users, MessageSquare, TrendingUp, Heart, AlertCircle, Target, Lightbulb, Brain, Activity, BarChart3, Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PieChart as RechartsPie, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useContactInsights, DashboardMetrics } from '@/hooks/useContactInsights';
import { usePageTitle } from '@/hooks/usePageTitle';

const ContactInsights = () => {
  usePageTitle('Insights de Contatos');
  const { metrics, isLoading, profileCoverage, getInitials, fetchContacts } = useContactInsights();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Brain className="h-6 w-6 text-primary" />Insights de Contatos</h1>
          <p className="text-muted-foreground">Análise de personalidade, preferências e tendências dos seus contatos</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => fetchContacts()} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Atualizar
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" /><p className="text-muted-foreground">Carregando insights...</p></div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total de Contatos</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{metrics.totalContacts}</div><p className="text-xs text-muted-foreground">{metrics.contactsWithProfile} com perfil IA</p></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total de Interações</CardTitle><MessageSquare className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{metrics.totalInteractions}</div><p className="text-xs text-muted-foreground">~{metrics.avgInteractionsPerContact} por contato</p></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Contatos VIP</CardTitle><Target className="h-4 w-4 text-pending" /></CardHeader><CardContent><div className="text-2xl font-bold text-pending">{metrics.vipContacts.length}</div><p className="text-xs text-muted-foreground">Alto engajamento ou status VIP</p></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Atenção Necessária</CardTitle><AlertCircle className="h-4 w-4 text-destructive" /></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{metrics.atRiskContacts.length}</div><p className="text-xs text-muted-foreground">Sentimento negativo ou baixo engajamento</p></CardContent></Card>
          </div>

          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />Cobertura de Perfis IA</CardTitle></CardHeader><CardContent><div className="flex items-center gap-4"><Progress value={profileCoverage} className="flex-1" /><span className="text-sm font-medium">{profileCoverage}%</span></div><p className="text-xs text-muted-foreground mt-2">{metrics.contactsWithProfile} de {metrics.totalContacts} contatos têm análise de perfil</p></CardContent></Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card><CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><Activity className="h-4 w-4" />Distribuição de Sentimento</CardTitle></CardHeader><CardContent>{metrics.sentimentDistribution.length > 0 ? (<div className="h-[200px]"><ResponsiveContainer width="100%" height="100%"><RechartsPie><Pie data={metrics.sentimentDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" label={((props: { name?: string; percent?: number }) => `${props.name ?? ''} ${((props.percent ?? 0) * 100).toFixed(0)}%`) as unknown as boolean}>{metrics.sentimentDistribution.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie><Tooltip /></RechartsPie></ResponsiveContainer></div>) : (<div className="h-[200px] flex items-center justify-center text-muted-foreground">Sem dados suficientes</div>)}</CardContent></Card>
            <Card><CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><BarChart3 className="h-4 w-4" />Níveis de Engajamento</CardTitle></CardHeader><CardContent>{metrics.engagementDistribution.length > 0 ? (<div className="h-[200px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={metrics.engagementDistribution} layout="vertical"><CartesianGrid strokeDasharray="3 3" opacity={0.1} /><XAxis type="number" /><YAxis dataKey="name" type="category" width={60} /><Tooltip /><Bar dataKey="value" radius={[0, 4, 4, 0]}>{metrics.engagementDistribution.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Bar></BarChart></ResponsiveContainer></div>) : (<div className="h-[200px] flex items-center justify-center text-muted-foreground">Sem dados suficientes</div>)}</CardContent></Card>
          </div>

          {metrics.interactionsTrend.length > 0 && (
            <Card><CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><TrendingUp className="h-4 w-4" />Tendência de Interações (Últimos 30 dias)</CardTitle></CardHeader><CardContent><div className="h-[200px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={metrics.interactionsTrend}><CartesianGrid strokeDasharray="3 3" opacity={0.1} /><XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} fontSize={12} /><YAxis fontSize={12} /><Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')} /><Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="Interações" /></LineChart></ResponsiveContainer></div></CardContent></Card>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <Card><CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><Heart className="h-4 w-4 text-pink-500" />Principais Interesses</CardTitle></CardHeader><CardContent>{metrics.topInterests.length > 0 ? (<div className="space-y-3">{metrics.topInterests.map((i, idx) => (<div key={idx} className="flex items-center justify-between"><span className="text-sm truncate flex-1">{i.name}</span><Badge variant="secondary">{i.count}</Badge></div>))}</div>) : (<p className="text-sm text-muted-foreground">Nenhum interesse identificado</p>)}</CardContent></Card>
            <Card><CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><AlertCircle className="h-4 w-4 text-destructive" />Principais Dores</CardTitle></CardHeader><CardContent>{metrics.topPainPoints.length > 0 ? (<div className="space-y-3">{metrics.topPainPoints.map((p, idx) => (<div key={idx} className="flex items-center justify-between"><span className="text-sm truncate flex-1">{p.name}</span><Badge variant="outline" className="text-destructive">{p.count}</Badge></div>))}</div>) : (<p className="text-sm text-muted-foreground">Nenhuma dor identificada</p>)}</CardContent></Card>
            <Card><CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><Target className="h-4 w-4 text-success" />Sinais de Compra</CardTitle></CardHeader><CardContent>{metrics.topBuyingSignals.length > 0 ? (<div className="space-y-3">{metrics.topBuyingSignals.map((s, idx) => (<div key={idx} className="flex items-center justify-between"><span className="text-sm truncate flex-1">{s.name}</span><Badge className="bg-success/10 text-success">{s.count}</Badge></div>))}</div>) : (<p className="text-sm text-muted-foreground">Nenhum sinal identificado</p>)}</CardContent></Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card><CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><Target className="h-4 w-4 text-purple-500" />Contatos VIP</CardTitle><CardDescription>Alto valor e engajamento</CardDescription></CardHeader><CardContent>{metrics.vipContacts.length > 0 ? (<div className="space-y-3">{metrics.vipContacts.map(c => (<div key={c.id} className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-pending/10 text-pending font-semibold">{getInitials(c.name)}</div><div className="flex-1 min-w-0"><p className="font-medium truncate">{c.name}</p><p className="text-xs text-muted-foreground truncate">{c.company || c.phone}</p></div><Badge className="bg-pending/10 text-pending">VIP</Badge></div>))}</div>) : (<p className="text-sm text-muted-foreground">Nenhum contato VIP identificado</p>)}</CardContent></Card>
            <Card><CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><AlertCircle className="h-4 w-4 text-destructive" />Contatos em Risco</CardTitle><CardDescription>Requerem atenção imediata</CardDescription></CardHeader><CardContent>{metrics.atRiskContacts.length > 0 ? (<div className="space-y-3">{metrics.atRiskContacts.map(c => (<div key={c.id} className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive font-semibold">{getInitials(c.name)}</div><div className="flex-1 min-w-0"><p className="font-medium truncate">{c.name}</p><p className="text-xs text-muted-foreground truncate">{(c.personality_insights as any)?.sentiment_trend || 'Baixo engajamento'}</p></div><Badge variant="destructive">Atenção</Badge></div>))}</div>) : (<p className="text-sm text-muted-foreground">Nenhum contato em risco</p>)}</CardContent></Card>
          </div>

          {metrics.allRecommendations.length > 0 && (
            <Card className="border-primary/20 bg-primary/5"><CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><Lightbulb className="h-4 w-4 text-primary" />Recomendações da IA</CardTitle><CardDescription>Ações sugeridas baseadas nos perfis analisados</CardDescription></CardHeader><CardContent><ScrollArea className="h-[300px]"><div className="space-y-4">{metrics.allRecommendations.map((rec, i) => (<div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-background"><div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">{i + 1}</div><div className="flex-1 min-w-0"><p className="text-sm">{rec.recommendation}</p><p className="text-xs text-muted-foreground mt-1">Para: {rec.contactName}</p></div></div>))}</div></ScrollArea></CardContent></Card>
          )}
        </>
      )}
    </div>
  );
};

export default ContactInsights;
