import { Users, CheckCircle, Trash2, PhoneMissed, PhoneOff, Voicemail, XCircle, RotateCcw, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DialerQueueItem } from '@/hooks/usePredictiveDialer';

const formatTimer = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const getQueueStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-success/10 text-success';
    case 'dialing': return 'bg-primary/10 text-primary';
    case 'pending': return 'bg-muted text-muted-foreground';
    default: return 'bg-secondary text-secondary-foreground';
  }
};

const getResultIcon = (result: string | null) => {
  switch (result) {
    case 'answered': return <CheckCircle className="h-4 w-4 text-success" />;
    case 'no_answer': return <PhoneMissed className="h-4 w-4 text-warning" />;
    case 'busy': return <PhoneOff className="h-4 w-4 text-warning" />;
    case 'voicemail': return <Voicemail className="h-4 w-4 text-muted-foreground" />;
    case 'wrong_number': return <XCircle className="h-4 w-4 text-destructive" />;
    case 'callback': return <RotateCcw className="h-4 w-4 text-primary" />;
    default: return null;
  }
};

interface DialerQueueProps {
  queue: DialerQueueItem[];
  onRemoveFromQueue: (id: string) => void;
}

export function DialerQueue({ queue, onRemoveFromQueue }: DialerQueueProps) {
  const pendingQueue = queue.filter(q => q.status === 'pending');
  const completedQueue = queue.filter(q => q.status === 'completed');

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2"><List className="h-5 w-5" />Fila de Discagem</CardTitle>
          <Badge variant="secondary">{queue.length} total</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="pending">Pendentes ({pendingQueue.length})</TabsTrigger>
            <TabsTrigger value="completed">Concluídos ({completedQueue.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            <ScrollArea className="h-[350px]">
              {pendingQueue.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mb-4 opacity-50" /><p className="text-sm">Fila vazia</p><p className="text-xs">Adicione contatos para iniciar</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingQueue.map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground w-6 text-center">{index + 1}</span>
                        <div>
                          <p className="font-medium">{item.name || 'Desconhecido'}</p>
                          <p className="text-xs text-muted-foreground font-mono">{item.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.attempts > 0 && <Badge variant="outline" className="text-xs">{item.attempts} tentativa{item.attempts > 1 ? 's' : ''}</Badge>}
                        <Badge className={`text-xs ${getQueueStatusColor(item.status)}`}>
                          {item.status === 'pending' ? 'Pendente' : item.status === 'dialing' ? 'Discando' : item.status}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onRemoveFromQueue(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="completed" className="mt-4">
            <ScrollArea className="h-[350px]">
              {completedQueue.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mb-4 opacity-50" /><p className="text-sm">Nenhuma chamada concluída</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {completedQueue.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        {getResultIcon(item.result)}
                        <div>
                          <p className="font-medium">{item.name || 'Desconhecido'}</p>
                          <p className="text-xs text-muted-foreground font-mono">{item.phone}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {item.result === 'answered' ? 'Atendida' : item.result === 'no_answer' ? 'Não Atendeu' :
                           item.result === 'busy' ? 'Ocupado' : item.result === 'voicemail' ? 'Caixa Postal' :
                           item.result === 'wrong_number' ? 'Número Errado' : item.result === 'callback' ? 'Retornar' : item.result}
                        </Badge>
                        {item.call_duration_seconds && <p className="text-xs text-muted-foreground mt-1">{formatTimer(item.call_duration_seconds)}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
