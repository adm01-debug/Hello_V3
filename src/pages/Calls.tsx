import { useState } from 'react';
import { 
  Phone, 
  Radio,
  MessageCircle,
  Headphones,
  Info,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UnifiedSoftphone } from '@/components/calls/UnifiedSoftphone';
import { toast } from '@/hooks/use-toast';

const Calls = () => {
  const [callStats] = useState({
    today: 12,
    answered: 10,
    missed: 2,
    avgDuration: '3:45'
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Central de Chamadas</h1>
        <p className="text-muted-foreground">Softphone multi-canal unificado</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Softphone Principal */}
        <div>
          <UnifiedSoftphone 
            onCallStart={(call) => {
              toast({
                title: '📞 Chamada iniciada',
                description: `Canal: ${call.channel.toUpperCase()}`,
              });
            }}
            onCallEnd={(call) => {
              toast({
                title: '📴 Chamada encerrada',
                description: `Duração: ${Math.floor(call.duration / 60)}:${String(call.duration % 60).padStart(2, '0')}`,
              });
            }}
          />
        </div>

        {/* Painel de Informações */}
        <div className="space-y-6">
          {/* Stats rápidas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Estatísticas de Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{callStats.today}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-success">{callStats.answered}</p>
                  <p className="text-xs text-muted-foreground">Atendidas</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-destructive">{callStats.missed}</p>
                  <p className="text-xs text-muted-foreground">Perdidas</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{callStats.avgDuration}</p>
                  <p className="text-xs text-muted-foreground">Duração Média</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Canais disponíveis */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Canais Disponíveis</CardTitle>
              <CardDescription>Configure integrações para mais canais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* WebRTC */}
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-success/5 border-success/20">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Radio className="h-5 w-5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">WebRTC</p>
                    <Badge variant="default" className="text-xs">Ativo</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Chamadas via navegador com IA conversacional
                  </p>
                </div>
              </div>

              {/* Wavoip */}
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <MessageCircle className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Wavoip</p>
                    <Badge variant="outline" className="text-xs">Pendente</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Chamadas de voz via WhatsApp
                  </p>
                </div>
                <Button variant="outline" size="sm" className="gap-1">
                  <ExternalLink className="h-3 w-3" />
                  Configurar
                </Button>
              </div>

              {/* Twilio */}
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <Phone className="h-5 w-5 text-red-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Twilio</p>
                    <Badge variant="outline" className="text-xs">Pendente</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Chamadas telefônicas SIP/PSTN
                  </p>
                </div>
                <Button variant="outline" size="sm" className="gap-1">
                  <ExternalLink className="h-3 w-3" />
                  Configurar
                </Button>
              </div>

              {/* SIP */}
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Headphones className="h-5 w-5 text-purple-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">SIP Genérico</p>
                    <Badge variant="outline" className="text-xs">Pendente</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Servidor SIP próprio ou operadora
                  </p>
                </div>
                <Button variant="outline" size="sm" className="gap-1">
                  <ExternalLink className="h-3 w-3" />
                  Configurar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-4 w-4" />
                Como funciona
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="space-y-2">
                <p className="font-medium text-foreground">Softphone Multi-Canal</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Use o seletor de canal no topo do softphone</li>
                  <li>WebRTC está pronto para uso imediato</li>
                  <li>Configure outros canais nas integrações</li>
                  <li>Histórico unificado de todas as chamadas</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <p className="font-medium text-foreground">Recursos Disponíveis</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Transcrição em tempo real (WebRTC)</li>
                  <li>Gravação de chamadas</li>
                  <li>Mudo, espera e transferência</li>
                  <li>Contatos rápidos favoritos</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Calls;
