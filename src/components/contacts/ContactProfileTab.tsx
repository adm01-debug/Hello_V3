import { Brain, Sparkles, User, MessageSquare, Clock, Heart, AlertCircle, Target, Lightbulb, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

interface ContactProfileTabProps {
  profile: PersonalityProfile | null;
  isAnalyzing: boolean;
  interactionsCount: number;
  onAnalyze: () => void;
}

const getSentimentColor = (sentiment: string | null) => {
  switch (sentiment?.toLowerCase()) {
    case 'positivo': case 'positive': case 'melhorando': return 'bg-success/10 text-success';
    case 'negativo': case 'negative': case 'piorando': return 'bg-destructive/10 text-destructive';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getEngagementColor = (level: string) => {
  switch (level?.toLowerCase()) {
    case 'alto': return 'bg-success/10 text-success';
    case 'médio': return 'bg-warning/10 text-warning';
    case 'baixo': return 'bg-destructive/10 text-destructive';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getRelationshipLabel = (status: string) => {
  const labels: Record<string, string> = { novo: 'Novo', em_desenvolvimento: 'Em Desenvolvimento', estabelecido: 'Estabelecido', vip: 'VIP' };
  return labels[status] || status;
};

export function ContactProfileTab({ profile, isAnalyzing, interactionsCount, onAnalyze }: ContactProfileTabProps) {
  return (
    <ScrollArea className="h-[450px] pr-4">
      {!profile ? (
        <div className="py-8 text-center">
          <Brain className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="font-semibold mb-2">Análise de Perfil IA</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Gere insights sobre personalidade, preferências e padrões de comunicação baseados no histórico de interações.
          </p>
          <Button onClick={onAnalyze} disabled={isAnalyzing || interactionsCount === 0} className="gap-2">
            {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isAnalyzing ? 'Analisando...' : 'Gerar Análise'}
          </Button>
          {interactionsCount === 0 && <p className="text-xs text-muted-foreground mt-2">Registre interações para habilitar a análise</p>}
        </div>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />Resumo do Perfil</CardTitle>
            </CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">{profile.summary}</p></CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border p-2 text-center">
              <p className="text-xs text-muted-foreground">Relacionamento</p>
              <Badge variant="outline" className="mt-1 text-xs">{getRelationshipLabel(profile.relationship_status)}</Badge>
            </div>
            <div className="rounded-lg border p-2 text-center">
              <p className="text-xs text-muted-foreground">Engajamento</p>
              <Badge className={`mt-1 text-xs ${getEngagementColor(profile.engagement_level)}`}>{profile.engagement_level}</Badge>
            </div>
            <div className="rounded-lg border p-2 text-center">
              <p className="text-xs text-muted-foreground">Tendência</p>
              <Badge className={`mt-1 text-xs ${getSentimentColor(profile.sentiment_trend)}`}>{profile.sentiment_trend}</Badge>
            </div>
          </div>

          {profile.personality_traits.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4 text-primary" />Traços de Personalidade</CardTitle></CardHeader>
              <CardContent><div className="flex flex-wrap gap-2">{profile.personality_traits.map((t, i) => <Badge key={i} variant="secondary">{t}</Badge>)}</div></CardContent>
            </Card>
          )}

          {profile.communication_style && profile.communication_style !== 'não identificado' && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" />Estilo de Comunicação</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm">{profile.communication_style}</p>
                {profile.preferred_contact_time && profile.preferred_contact_time !== 'não identificado' && (
                  <p className="text-xs text-muted-foreground mt-2"><Clock className="inline h-3 w-3 mr-1" />Melhor horário: {profile.preferred_contact_time}</p>
                )}
              </CardContent>
            </Card>
          )}

          {profile.interests.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Heart className="h-4 w-4 text-primary" />Interesses</CardTitle></CardHeader>
              <CardContent><div className="flex flex-wrap gap-2">{profile.interests.map((i, idx) => <Badge key={idx} variant="outline">{i}</Badge>)}</div></CardContent>
            </Card>
          )}

          {profile.pain_points.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertCircle className="h-4 w-4 text-destructive" />Pontos de Dor</CardTitle></CardHeader>
              <CardContent><ul className="text-sm space-y-1">{profile.pain_points.map((p, i) => <li key={i} className="flex items-start gap-2"><span className="text-destructive">•</span>{p}</li>)}</ul></CardContent>
            </Card>
          )}

          {profile.buying_signals.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4 text-success" />Sinais de Compra</CardTitle></CardHeader>
              <CardContent><ul className="text-sm space-y-1">{profile.buying_signals.map((s, i) => <li key={i} className="flex items-start gap-2"><span className="text-success">✓</span>{s}</li>)}</ul></CardContent>
            </Card>
          )}

          {profile.recommendations.length > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Lightbulb className="h-4 w-4 text-primary" />Recomendações</CardTitle></CardHeader>
              <CardContent><ul className="text-sm space-y-2">{profile.recommendations.map((r, i) => <li key={i} className="flex items-start gap-2"><span className="text-primary font-bold">{i + 1}.</span>{r}</li>)}</ul></CardContent>
            </Card>
          )}

          <Button variant="outline" className="w-full gap-2" onClick={onAnalyze} disabled={isAnalyzing}>
            {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Atualizar Análise
          </Button>
        </div>
      )}
    </ScrollArea>
  );
}
