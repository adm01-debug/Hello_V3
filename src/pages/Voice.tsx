import { VoiceCommandPanel } from '@/components/VoiceCommandPanel';

const Voice = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Comando de Voz</h1>
        <p className="text-muted-foreground">Controle chamadas usando sua voz</p>
      </div>

      <VoiceCommandPanel />
    </div>
  );
};

export default Voice;
