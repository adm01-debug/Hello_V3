import { useState } from 'react';
import { Phone, User, Users, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export type TransferType = 'blind' | 'attended';

export interface TransferTarget {
  type: 'agent' | 'external';
  name?: string;
  phoneNumber: string;
}

interface TransferCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  callId: string;
  callerName?: string;
  onTransfer: (callId: string, target: TransferTarget, transferType: TransferType) => void;
}

// Mock agents list - in a real app this would come from the database
const mockAgents = [
  { id: '1', name: 'Maria Santos', extension: '101', available: true },
  { id: '2', name: 'Carlos Oliveira', extension: '102', available: true },
  { id: '3', name: 'Ana Costa', extension: '103', available: false },
  { id: '4', name: 'Pedro Lima', extension: '104', available: true },
  { id: '5', name: 'Julia Mendes', extension: '105', available: true },
];

export function TransferCallDialog({
  open,
  onOpenChange,
  callId,
  callerName,
  onTransfer
}: TransferCallDialogProps) {
  const [transferType, setTransferType] = useState<TransferType>('blind');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [externalNumber, setExternalNumber] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'agents' | 'external'>('agents');

  const filteredAgents = mockAgents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.extension.includes(searchQuery)
  );

  const handleTransfer = () => {
    if (activeTab === 'agents' && selectedAgent) {
      const agent = mockAgents.find(a => a.id === selectedAgent);
      if (agent) {
        onTransfer(callId, {
          type: 'agent',
          name: agent.name,
          phoneNumber: agent.extension
        }, transferType);
      }
    } else if (activeTab === 'external' && externalNumber) {
      onTransfer(callId, {
        type: 'external',
        phoneNumber: externalNumber
      }, transferType);
    }
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedAgent(null);
    setExternalNumber('');
    setSearchQuery('');
    setTransferType('blind');
  };

  const canTransfer = 
    (activeTab === 'agents' && selectedAgent) || 
    (activeTab === 'external' && externalNumber.length >= 8);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Transferir Chamada
          </DialogTitle>
          <DialogDescription>
            {callerName ? `Transferir chamada de ${callerName}` : 'Transferir chamada ativa'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Transfer Type */}
          <div className="space-y-2">
            <Label>Tipo de Transferência</Label>
            <RadioGroup
              value={transferType}
              onValueChange={(value) => setTransferType(value as TransferType)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="blind" id="blind" />
                <Label htmlFor="blind" className="font-normal cursor-pointer">
                  Direta (Blind)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="attended" id="attended" />
                <Label htmlFor="attended" className="font-normal cursor-pointer">
                  Assistida (Attended)
                </Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-muted-foreground">
              {transferType === 'blind' 
                ? 'A chamada será transferida imediatamente' 
                : 'Você poderá falar com o destino antes de transferir'}
            </p>
          </div>

          {/* Destination Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'agents' | 'external')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="agents" className="gap-2">
                <Users className="h-4 w-4" />
                Agentes
              </TabsTrigger>
              <TabsTrigger value="external" className="gap-2">
                <Phone className="h-4 w-4" />
                Externo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="agents" className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar agente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <ScrollArea className="h-48">
                <div className="space-y-1">
                  {filteredAgents.map((agent) => (
                    <div
                      key={agent.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                        selectedAgent === agent.id 
                          ? "bg-primary/10 border-primary/30" 
                          : "hover:bg-muted",
                        !agent.available && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={() => agent.available && setSelectedAgent(agent.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium",
                          agent.available ? "bg-success" : "bg-muted-foreground"
                        )}>
                          {agent.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{agent.name}</p>
                          <p className="text-xs text-muted-foreground">Ramal {agent.extension}</p>
                        </div>
                      </div>
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        agent.available ? "bg-success" : "bg-muted-foreground"
                      )} />
                    </div>
                  ))}
                  {filteredAgents.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      Nenhum agente encontrado
                    </p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="external" className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="external-number">Número de Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="external-number"
                    placeholder="+55 11 99999-9999"
                    value={externalNumber}
                    onChange={(e) => setExternalNumber(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Digite o número completo com DDD
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleTransfer} disabled={!canTransfer}>
            {transferType === 'blind' ? 'Transferir' : 'Iniciar Transferência'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
