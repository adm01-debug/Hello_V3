import { VoiceCommandPanel } from '@/components/VoiceCommandPanel';

const Index = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Painel VoIP</h1>
          <p className="text-muted-foreground">
            Controle chamadas usando comandos de voz
          </p>
        </header>

        <VoiceCommandPanel />
      </div>
    </div>
  );
};

export default Index;
