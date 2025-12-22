import { AICallAnalysis } from '@/components/ai/AICallAnalysis';
import { CallSimulation } from '@/components/ai/CallSimulation';
import { Bot, Sparkles, Zap, Shield, PlayCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AIAssistant = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Bot className="h-7 w-7 text-primary" />
            Assistente IA
          </h1>
          <p className="text-muted-foreground">Análise inteligente de chamadas com IA</p>
        </div>
      </div>

      {/* Features Banner */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Análise de Sentimento</h3>
            <p className="text-sm text-muted-foreground">
              Detecta tom emocional e satisfação do cliente
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10">
            <Zap className="h-5 w-5 text-success" />
          </div>
          <div>
            <h3 className="font-semibold">Extração de Insights</h3>
            <p className="text-sm text-muted-foreground">
              Identifica tópicos-chave e ações necessárias
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning/10">
            <Shield className="h-5 w-5 text-warning" />
          </div>
          <div>
            <h3 className="font-semibold">Avaliação de Agentes</h3>
            <p className="text-sm text-muted-foreground">
              Mede clareza, empatia e taxa de resolução
            </p>
          </div>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="simulation" className="space-y-4">
        <TabsList>
          <TabsTrigger value="simulation" className="gap-2">
            <PlayCircle className="h-4 w-4" />
            Simulação ao Vivo
          </TabsTrigger>
          <TabsTrigger value="analysis" className="gap-2">
            <Bot className="h-4 w-4" />
            Análise de Chamadas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="simulation">
          <CallSimulation />
        </TabsContent>

        <TabsContent value="analysis">
          <AICallAnalysis />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIAssistant;
