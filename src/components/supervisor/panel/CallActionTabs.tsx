import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Headphones, Phone, PhoneCall, PhoneOff, Radio, Send, User, Users, Volume2 } from 'lucide-react';
import type { SupervisorPanelState } from './types';

function CallMeta({ s }: { s: SupervisorPanelState }) {
  if (!s.selectedCall) return null;
  return (
    <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
      <p className="flex items-center justify-center gap-1">
        <Phone className="h-3 w-3" />Chamada: {s.selectedCall.caller_name || s.selectedCall.caller_phone}
      </p>
      <p className="flex items-center justify-center gap-1 mt-1">
        <User className="h-3 w-3" />Agente: {s.selectedCall.agent_name}
      </p>
    </div>
  );
}

export function CallActionTabs({ s }: { s: SupervisorPanelState }) {
  if (!s.selectedCall) return null;

  return (
    <Tabs defaultValue="listen" className="pt-2 border-t">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="listen" className="text-xs"><Headphones className="h-3 w-3 mr-1" />Escuta</TabsTrigger>
        <TabsTrigger value="whisper" className="text-xs"><Volume2 className="h-3 w-3 mr-1" />Whisper</TabsTrigger>
        <TabsTrigger value="bargein" className="text-xs"><Users className="h-3 w-3 mr-1" />Barge-in</TabsTrigger>
      </TabsList>

      <TabsContent value="listen" className="space-y-3 mt-3">
        <div className="p-4 rounded-lg border bg-muted/30 text-center">
          <Headphones className="h-10 w-10 mx-auto mb-3 text-primary opacity-60" />
          <h4 className="font-medium mb-1">Modo Escuta silenciosa</h4>
          <p className="text-xs text-muted-foreground mb-4">
            Ouça a chamada em tempo real sem que agente ou cliente saibam. Ideal para QA e coaching passivo.
          </p>
          <Badge variant="secondary" className="gap-1">
            <Radio className="h-3 w-3" /> Áudio recebido pelo canal SIP do supervisor
          </Badge>
          <CallMeta s={s} />
        </div>
      </TabsContent>

      <TabsContent value="whisper" className="space-y-3 mt-3">
        <div className="flex items-center gap-2 text-sm">
          <Volume2 className="h-4 w-4 text-primary" />
          <span>Sussurrar para:</span>
          <Badge variant="default">{s.selectedCall.agent_name}</Badge>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {s.quickWhispers.map((qw, idx) => (
            <Button key={idx} variant="outline" size="sm" className="text-xs h-7" onClick={() => s.setWhisperMessage(qw)}>
              {qw}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Digite sua mensagem..."
            value={s.whisperMessage}
            onChange={(e) => s.setWhisperMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && s.sendWhisper()}
            className="flex-1"
          />
          <Button onClick={s.sendWhisper} disabled={s.sending || !s.whisperMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {s.whisperHistory.length > 0 && (
          <ScrollArea className="h-[80px]">
            <div className="space-y-1">
              {s.whisperHistory.map((wh) => (
                <div
                  key={wh.id}
                  className={`p-2 rounded text-xs border ${wh.is_read ? 'bg-muted/50' : 'bg-primary/5 border-primary/20'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-muted-foreground">{s.formatTime(wh.created_at)}</span>
                    {wh.is_read && <Check className="h-3 w-3 text-success" />}
                  </div>
                  <p>{wh.message}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </TabsContent>

      <TabsContent value="bargein" className="space-y-3 mt-3">
        <div className="p-4 rounded-lg border bg-muted/30 text-center">
          <Users className="h-10 w-10 mx-auto mb-3 text-primary opacity-60" />
          <h4 className="font-medium mb-1">Modo Barge-in</h4>
          <p className="text-xs text-muted-foreground mb-4">Entre na chamada como conferência tripartite.</p>
          {s.isCallInBargeIn(s.selectedCall.id) ? (
            <Button variant="destructive" onClick={s.endBargeIn} className="w-full">
              <PhoneOff className="h-4 w-4 mr-2" />Sair da Conferência
            </Button>
          ) : s.activeBargeIn ? (
            <Button disabled className="w-full">Você já está em outra conferência</Button>
          ) : (
            <Button onClick={s.startBargeIn} className="w-full">
              <PhoneCall className="h-4 w-4 mr-2" />Entrar na Chamada
            </Button>
          )}
          <CallMeta s={s} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
