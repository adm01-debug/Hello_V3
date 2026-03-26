import { AICallAnalysis } from '@/components/ai/AICallAnalysis';
import { CallSimulation } from '@/components/ai/CallSimulation';
import { Bot, Sparkles, Zap, Shield, PlayCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AIAssistant = () => {
  return (
    <div className="space-y-6 relative">
      <div className="fixed inset-0 pointer-events-none gradient-mesh-intense opacity-30" />
      
      <div className="relative space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-2xl sm:text-3xl font-bold tracking-tight text-gradient">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Bot className="h-5 w-5 text-primary" />
              </span>
              Assistente IA
            </h1>
            <p className="text-muted-foreground">Análise inteligente de chamadas com IA</p>
          </div>
        </div>

        {/* Features Banner */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-start gap-3 rounded-xl border border-border/30 bg-card/60 backdrop-blur-xl p-4 hover:border-primary/20 hover:shadow-[0_0_20px_hsl(var(--primary)/0.1)] transition-all duration-300">
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

          <div className="flex items-start gap-3 rounded-xl border border-border/30 bg-card/60 backdrop-blur-xl p-4 hover:border-success/20 hover:shadow-[0_0_20px_hsl(var(--success)/0.1)] transition-all duration-300">
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

          <div className="flex items-start gap-3 rounded-xl border border-border/30 bg-card/60 backdrop-blur-xl p-4 hover:border-warning/20 hover:shadow-[0_0_20px_hsl(var(--warning)/0.1)] transition-all duration-300">
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
          <TabsList className="bg-card/60 backdrop-blur-sm border border-border/30">
            <TabsTrigger value="simulation" className="gap-2 data-[state=active]:shadow-[0_0_10px_hsl(var(--primary)/0.2)]">
              <PlayCircle className="h-4 w-4" />
              Simulação ao Vivo
            </TabsTrigger>
            <TabsTrigger value="analysis" className="gap-2 data-[state=active]:shadow-[0_0_10px_hsl(var(--primary)/0.2)]">
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
    </div>
  );
};

export default AIAssistant;
