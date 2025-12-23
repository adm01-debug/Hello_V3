import { useState, useEffect } from 'react';
import { Phone, User, Users, Search, Loader2 } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';

export type TransferType = 'blind' | 'attended';

export interface TransferTarget {
  type: 'agent' | 'external';
  name?: string;
  phoneNumber: string;
}

interface Agent {
  id: string;
  name: string;
  extension: string;
  email: string | null;
  status: string;
  department: string | null;
}

interface TransferCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  callId: string;
  callerName?: string;
  onTransfer: (callId: string, target: TransferTarget, transferType: TransferType) => void;
}

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
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch agents from database
  useEffect(() => {
    if (open) {
      fetchAgents();
    }
  }, [open]);

  const fetchAgents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('id, name, extension, email, status, department')
        .order('name');

      if (error) {
        console.error('Error fetching agents:', error);
        return;
      }

      setAgents(data || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.extension.includes(searchQuery) ||
    (agent.department?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const handleTransfer = () => {
    if (activeTab === 'agents' && selectedAgent) {
      const agent = agents.find(a => a.id === selectedAgent);
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

  const isAgentAvailable = (status: string) => status === 'available';

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
                  placeholder="Buscar por nome, ramal ou departamento..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <ScrollArea className="h-48">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredAgents.map((agent) => {
                      const available = isAgentAvailable(agent.status);
                      return (
                        <div
                          key={agent.id}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                            selectedAgent === agent.id 
                              ? "bg-primary/10 border-primary/30" 
                              : "hover:bg-muted",
                            !available && "opacity-50 cursor-not-allowed"
                          )}
                          onClick={() => available && setSelectedAgent(agent.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium",
                              available ? "bg-success" : "bg-muted-foreground"
                            )}>
                              {agent.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{agent.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Ramal {agent.extension}
                                {agent.department && ` • ${agent.department}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-xs capitalize",
                              available ? "text-success" : "text-muted-foreground"
                            )}>
                              {agent.status === 'available' ? 'Disponível' : 
                               agent.status === 'busy' ? 'Ocupado' : 
                               agent.status === 'away' ? 'Ausente' : agent.status}
                            </span>
                            <div className={cn(
                              "h-2 w-2 rounded-full",
                              available ? "bg-success" : "bg-muted-foreground"
                            )} />
                          </div>
                        </div>
                      );
                    })}
                    {filteredAgents.length === 0 && !isLoading && (
                      <p className="text-center text-sm text-muted-foreground py-4">
                        Nenhum agente encontrado
                      </p>
                    )}
                  </div>
                )}
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