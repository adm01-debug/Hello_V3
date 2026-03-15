import { useState } from 'react';
import { 
  Bot, 
  MessageSquare, 
  TrendingUp, 
  TrendingDown,
  Minus,
  Sparkles,
  ListChecks,
  Tags,
  Send,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  User,
  Headphones
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AnalysisResult {
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number;
  keyTopics: string[];
  actionItems: string[];
  customerSatisfaction: number;
  agentPerformance: {
    clarity: number;
    empathy: number;
    resolution: number;
  };
}

// Example transcripts for demo
const exampleTranscripts = [
  {
    title: 'Atendimento positivo',
    transcript: `Agente: Bom dia! Meu nome é Lucas, como posso ajudar?
Cliente: Oi Lucas, preciso de ajuda com minha fatura.
Agente: Claro! Posso verificar sua conta. Qual seu CPF?
Cliente: 123.456.789-00
Agente: Perfeito, encontrei sua conta. Vejo que há uma fatura de R$150 vencida.
Cliente: Sim, tive um problema e não consegui pagar. Posso parcelar?
Agente: Com certeza! Posso parcelar em até 3x sem juros. Fica R$50 por mês.
Cliente: Isso seria ótimo! Pode fazer assim.
Agente: Pronto, já parcelei. Você receberá os boletos por email.
Cliente: Muito obrigado Lucas, você foi muito prestativo!
Agente: Por nada! Posso ajudar em algo mais?
Cliente: Não, era só isso. Obrigado!
Agente: Tenha um ótimo dia!`,
  },
  {
    title: 'Reclamação técnica',
    transcript: `Agente: Central de atendimento, Ana falando.
Cliente: Minha internet não funciona há 3 dias! Isso é absurdo!
Agente: Entendo sua frustração. Deixe-me verificar o que está acontecendo.
Cliente: Já liguei várias vezes e ninguém resolve nada.
Agente: Peço desculpas pelos inconvenientes. Vou abrir uma ordem de serviço urgente.
Cliente: Espero que resolvam dessa vez.
Agente: Vou escalar para o time técnico. Um técnico irá até sua residência amanhã entre 8h e 12h.
Cliente: Amanhã? Não pode ser hoje?
Agente: Infelizmente a agenda de hoje está cheia, mas garanto que amanhã será resolvido.
Cliente: Tá bom então. Mas se não resolver, vou cancelar.
Agente: Compreendo. O técnico entrará em contato antes de ir. Posso ajudar em mais algo?
Cliente: Não.
Agente: Obrigada pela ligação.`,
  },
];

export function AICallAnalysis() {
  const [transcript, setTranscript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!transcript.trim()) {
      toast.error('Transcrição vazia', { description: 'Cole ou digite a transcrição da chamada para analisar.' });
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-call`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            transcript,
            callInfo: {
              contactName: 'Cliente',
              duration: '5:30',
              type: 'incoming'
            }
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Falha na análise');
      }

      const result: AnalysisResult = await response.json();
      setAnalysis(result);

      toast.success('✨ Análise concluída', { description: 'A chamada foi analisada com sucesso.' });
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Erro na análise', { description: error instanceof Error ? error.message : 'Erro desconhecido' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadExample = (index: number) => {
    setTranscript(exampleTranscripts[index].transcript);
    setAnalysis(null);
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="h-5 w-5 text-success" />;
      case 'negative': return <TrendingDown className="h-5 w-5 text-destructive" />;
      default: return <Minus className="h-5 w-5 text-warning" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-success/10 text-success border-success/20';
      case 'negative': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-warning/10 text-warning border-warning/20';
    }
  };

  const getSentimentLabel = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'Positivo';
      case 'negative': return 'Negativo';
      default: return 'Neutro';
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Transcrição da Chamada
          </CardTitle>
          <CardDescription>
            Cole a transcrição ou use um exemplo para analisar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            {exampleTranscripts.map((example, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => loadExample(index)}
                disabled={isAnalyzing}
              >
                {example.title}
              </Button>
            ))}
          </div>

          <Textarea
            placeholder="Cole aqui a transcrição da chamada...

Exemplo:
Agente: Bom dia, como posso ajudar?
Cliente: Preciso de suporte técnico..."
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
            disabled={isAnalyzing}
          />

          <Button
            className="w-full gap-2"
            onClick={handleAnalyze}
            disabled={isAnalyzing || !transcript.trim()}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Analisar com IA
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Análise da IA
          </CardTitle>
          <CardDescription>
            Insights automáticos sobre a chamada
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!analysis && !isAnalyzing && (
            <div className="flex h-[400px] flex-col items-center justify-center text-center text-muted-foreground">
              <Bot className="mb-4 h-12 w-12 opacity-50" />
              <p>Cole uma transcrição e clique em "Analisar" para ver os insights</p>
            </div>
          )}

          {isAnalyzing && (
            <div className="flex h-[400px] flex-col items-center justify-center text-center">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-8 w-8 text-primary animate-pulse" />
                </div>
              </div>
              <p className="mt-4 font-medium">Analisando chamada...</p>
              <p className="text-sm text-muted-foreground">Isso pode levar alguns segundos</p>
            </div>
          )}

          {analysis && (
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="details">Detalhes</TabsTrigger>
                <TabsTrigger value="actions">Ações</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {/* Sentiment Badge */}
                <div className={cn(
                  'flex items-center gap-3 rounded-lg border p-4',
                  getSentimentColor(analysis.sentiment)
                )}>
                  {getSentimentIcon(analysis.sentiment)}
                  <div>
                    <p className="font-semibold">{getSentimentLabel(analysis.sentiment)}</p>
                    <p className="text-sm opacity-80">Score: {analysis.sentimentScore}/100</p>
                  </div>
                </div>

                {/* Summary */}
                <div className="rounded-lg border border-border bg-accent/30 p-4">
                  <h4 className="mb-2 flex items-center gap-2 font-medium">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Resumo
                  </h4>
                  <p className="text-sm text-muted-foreground">{analysis.summary}</p>
                </div>

                {/* Customer Satisfaction */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Satisfação do Cliente
                    </span>
                    <span className="font-semibold">{analysis.customerSatisfaction}%</span>
                  </div>
                  <Progress value={analysis.customerSatisfaction} className="h-2" />
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                {/* Key Topics */}
                <div className="space-y-2">
                  <h4 className="flex items-center gap-2 font-medium">
                    <Tags className="h-4 w-4 text-primary" />
                    Tópicos Principais
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.keyTopics.map((topic, index) => (
                      <Badge key={index} variant="secondary">{topic}</Badge>
                    ))}
                  </div>
                </div>

                {/* Agent Performance */}
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 font-medium">
                    <Headphones className="h-4 w-4 text-primary" />
                    Performance do Agente
                  </h4>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Clareza</span>
                      <span className="font-semibold">{analysis.agentPerformance.clarity}%</span>
                    </div>
                    <Progress value={analysis.agentPerformance.clarity} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Empatia</span>
                      <span className="font-semibold">{analysis.agentPerformance.empathy}%</span>
                    </div>
                    <Progress value={analysis.agentPerformance.empathy} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Resolução</span>
                      <span className="font-semibold">{analysis.agentPerformance.resolution}%</span>
                    </div>
                    <Progress value={analysis.agentPerformance.resolution} className="h-2" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="actions" className="space-y-4">
                {/* Action Items */}
                <div className="space-y-2">
                  <h4 className="flex items-center gap-2 font-medium">
                    <ListChecks className="h-4 w-4 text-primary" />
                    Ações Necessárias
                  </h4>
                  
                  {analysis.actionItems.length > 0 ? (
                    <ul className="space-y-2">
                      {analysis.actionItems.map((item, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-3 rounded-lg border border-border bg-accent/30 p-3 text-sm"
                        >
                          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                            {index + 1}
                          </div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nenhuma ação pendente identificada.
                    </p>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" size="sm" className="gap-2">
                    <ThumbsUp className="h-4 w-4" />
                    Marcar como resolvido
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <ThumbsDown className="h-4 w-4" />
                    Requer follow-up
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
