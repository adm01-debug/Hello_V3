import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { 
  Plus, Phone, Voicemail, Users, Clock, ArrowRight, 
  MessageSquare, GitBranch, Trash2, Save, Play, Pause,
  PhoneForwarded, PhoneOff, Music, MoveRight, GripVertical
} from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';

interface FlowNode {
  id: string;
  type: 'start' | 'menu' | 'queue' | 'voicemail' | 'transfer' | 'hangup' | 'time_check' | 'announcement' | 'ring_group';
  label: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
}

interface FlowEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  condition?: string;
}

interface CallFlow {
  id: string;
  name: string;
  description: string | null;
  flow_data: { nodes: FlowNode[]; edges: FlowEdge[] };
  is_active: boolean;
  is_default: boolean;
  created_at: string;
}

const NODE_TYPES = [
  { type: 'start', label: 'Início', icon: Play, color: 'bg-success/20 text-success border-success/30' },
  { type: 'menu', label: 'Menu IVR', icon: GitBranch, color: 'bg-primary/20 text-primary border-primary/30' },
  { type: 'queue', label: 'Fila', icon: Users, color: 'bg-info/20 text-info border-info/30' },
  { type: 'voicemail', label: 'Correio de Voz', icon: Voicemail, color: 'bg-warning/20 text-warning border-warning/30' },
  { type: 'transfer', label: 'Transferir', icon: PhoneForwarded, color: 'bg-pending/20 text-pending border-pending/30' },
  { type: 'ring_group', label: 'Grupo de Toque', icon: Phone, color: 'bg-primary/20 text-primary border-primary/30' },
  { type: 'time_check', label: 'Horário', icon: Clock, color: 'bg-call-hold/20 text-call-hold border-call-hold/30' },
  { type: 'announcement', label: 'Anúncio', icon: Music, color: 'bg-accent text-accent-foreground border-accent' },
  { type: 'hangup', label: 'Desligar', icon: PhoneOff, color: 'bg-destructive/20 text-destructive border-destructive/30' },
] as const;

function FlowNodeCard({ node, onDelete, onConnect }: { 
  node: FlowNode; 
  onDelete: (id: string) => void;
  onConnect: (fromId: string) => void;
}) {
  const nodeType = NODE_TYPES.find(t => t.type === node.type);
  if (!nodeType) return null;
  const Icon = nodeType.icon;

  return (
    <div className={`relative flex items-center gap-3 rounded-xl border-2 px-4 py-3 ${nodeType.color} transition-all hover:shadow-md cursor-grab active:cursor-grabbing`}>
      <GripVertical className="h-4 w-4 opacity-40" />
      <Icon className="h-5 w-5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{node.label}</p>
        <p className="text-xs opacity-60">{nodeType.label}</p>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onConnect(node.id)}>
          <MoveRight className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(node.id)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function FlowCanvas({ flow, onUpdate }: { flow: CallFlow; onUpdate: (data: { nodes: FlowNode[]; edges: FlowEdge[] }) => void }) {
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const flowData = flow.flow_data;
  const nodes = flowData?.nodes || [];
  const edges = flowData?.edges || [];

  const addNode = (type: string) => {
  usePageTitle('Call Flow Designer');

    const nodeType = NODE_TYPES.find(t => t.type === type);
    const newNode: FlowNode = {
      id: `node-${Date.now()}`,
      type: type as FlowNode['type'],
      label: nodeType?.label || type,
      config: {},
      position: { x: 0, y: nodes.length * 80 },
    };
    onUpdate({ nodes: [...nodes, newNode], edges });
  };

  const deleteNode = (id: string) => {
    onUpdate({
      nodes: nodes.filter(n => n.id !== id),
      edges: edges.filter(e => e.from !== id && e.to !== id),
    });
  };

  const handleConnect = (nodeId: string) => {
    if (!connectingFrom) {
      setConnectingFrom(nodeId);
      toast('Selecione o nó destino', { description: 'Clique em outro nó para conectar' });
    } else if (connectingFrom !== nodeId) {
      const newEdge: FlowEdge = {
        id: `edge-${Date.now()}`,
        from: connectingFrom,
        to: nodeId,
      };
      onUpdate({ nodes, edges: [...edges, newEdge] });
      setConnectingFrom(null);
      toast.success('Conexão criada!');
    } else {
      setConnectingFrom(null);
    }
  };

  const deleteEdge = (id: string) => {
    onUpdate({ nodes, edges: edges.filter(e => e.id !== id) });
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2">
        {NODE_TYPES.map(({ type, label, icon: Icon }) => (
          <Button key={type} variant="outline" size="sm" onClick={() => addNode(type)} className="gap-2">
            <Icon className="h-4 w-4" />
            {label}
          </Button>
        ))}
      </div>

      {/* Flow visualization */}
      <div className="grid gap-3">
        {nodes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <GitBranch className="h-12 w-12 mb-4 opacity-40" />
            <p className="text-lg font-medium">Fluxo vazio</p>
            <p className="text-sm">Adicione nós usando os botões acima para construir seu fluxo de chamada</p>
          </div>
        )}
        {nodes.map((node) => (
          <div key={node.id}>
            <FlowNodeCard node={node} onDelete={deleteNode} onConnect={handleConnect} />
            {/* Show connections from this node */}
            {edges.filter(e => e.from === node.id).map(edge => {
              const targetNode = nodes.find(n => n.id === edge.to);
              return (
                <div key={edge.id} className="flex items-center gap-2 ml-8 my-1">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">→ {targetNode?.label || 'Desconhecido'}</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => deleteEdge(edge.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CallFlowDesigner() {
  const queryClient = useQueryClient();
  const [selectedFlow, setSelectedFlow] = useState<string | null>(null);
  const [newFlowName, setNewFlowName] = useState('');
  const [newFlowDesc, setNewFlowDesc] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: flows = [], isLoading } = useQuery({
    queryKey: ['call-flows'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('call_flows')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as CallFlow[];
    },
  });

  const createFlow = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('call_flows').insert({
        name: newFlowName,
        description: newFlowDesc || null,
        flow_data: { nodes: [], edges: [] },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-flows'] });
      setNewFlowName('');
      setNewFlowDesc('');
      setDialogOpen(false);
      toast.success('Fluxo criado com sucesso!');
    },
  });

  const updateFlow = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CallFlow> }) => {
      const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (data.flow_data) updatePayload.flow_data = data.flow_data;
      if (data.is_active !== undefined) updatePayload.is_active = data.is_active;
      
      const { error } = await supabase.from('call_flows').update(updatePayload).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-flows'] });
      toast.success('Fluxo salvo!');
    },
  });

  const deleteFlow = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('call_flows').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-flows'] });
      setSelectedFlow(null);
      toast.success('Fluxo removido');
    },
  });

  const activeFlow = flows.find(f => f.id === selectedFlow);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Call Flow Designer</h1>
          <p className="text-muted-foreground">Editor visual de fluxos de chamada e URA</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Fluxo</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Fluxo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input value={newFlowName} onChange={e => setNewFlowName(e.target.value)} placeholder="Ex: Atendimento Principal" />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea value={newFlowDesc} onChange={e => setNewFlowDesc(e.target.value)} placeholder="Descrição do fluxo..." />
              </div>
              <Button onClick={() => createFlow.mutate()} disabled={!newFlowName.trim()}>Criar Fluxo</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Flow list */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase">Fluxos</h3>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : flows.length === 0 ? (
            <Card className="p-6 text-center">
              <GitBranch className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Nenhum fluxo criado</p>
            </Card>
          ) : flows.map(flow => (
            <Card 
              key={flow.id}
              className={`cursor-pointer transition-all hover:shadow-md ${selectedFlow === flow.id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedFlow(flow.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{flow.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(flow.flow_data?.nodes || []).length} nós
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {flow.is_active && <Badge variant="default" className="text-xs">Ativo</Badge>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Canvas */}
        <div className="lg:col-span-3">
          {activeFlow ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{activeFlow.name}</CardTitle>
                  {activeFlow.description && <p className="text-sm text-muted-foreground mt-1">{activeFlow.description}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={activeFlow.is_active}
                      onCheckedChange={(checked) => updateFlow.mutate({ id: activeFlow.id, data: { is_active: checked } })}
                    />
                    <span className="text-sm">{activeFlow.is_active ? 'Ativo' : 'Inativo'}</span>
                  </div>
                  <Button 
                    variant="destructive" size="sm"
                    onClick={() => deleteFlow.mutate(activeFlow.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <FlowCanvas
                  flow={activeFlow}
                  onUpdate={(data) => updateFlow.mutate({ id: activeFlow.id, data: { flow_data: data } })}
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <GitBranch className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-lg font-medium text-muted-foreground">Selecione ou crie um fluxo</p>
                <p className="text-sm text-muted-foreground/60">Use o painel à esquerda para gerenciar seus fluxos de chamada</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
