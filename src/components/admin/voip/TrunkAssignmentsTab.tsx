import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Star, Loader2 } from 'lucide-react';
import { useTrunkAssignments, useVoipTrunks, useSaveAssignment, useDeleteAssignment } from '@/hooks/useVoipTrunks';

export function TrunkAssignmentsTab() {
  const { data: assignments = [], isLoading } = useTrunkAssignments();
  const { data: trunks = [] } = useVoipTrunks();
  const { data: agents = [] } = useQuery({
    queryKey: ['agents-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('agents').select('id, name, extension').order('name');
      if (error) throw error;
      return data;
    },
  });
  const save = useSaveAssignment();
  const del = useDeleteAssignment();

  const [agentId, setAgentId] = useState('');
  const [trunkId, setTrunkId] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  const handleAdd = () => {
    if (!agentId || !trunkId) return;
    save.mutate({ agent_id: agentId, trunk_id: trunkId, is_primary: isPrimary }, {
      onSuccess: () => { setAgentId(''); setTrunkId(''); setIsPrimary(false); },
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Nova Atribuição</CardTitle>
          <CardDescription>Vincule um agente a uma linha VoIP</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Agente</Label>
              <Select value={agentId} onValueChange={setAgentId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {agents.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name} (Ramal {a.extension})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Linha VoIP</Label>
              <Select value={trunkId} onValueChange={setTrunkId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {trunks.filter(t => t.is_active).map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name} ({t.provider})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label>Definir como linha primária</Label>
            <Switch checked={isPrimary} onCheckedChange={setIsPrimary} />
          </div>
          <Button onClick={handleAdd} disabled={!agentId || !trunkId || save.isPending} className="gap-2">
            <Plus className="h-4 w-4" /> Adicionar Atribuição
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Atribuições Atuais ({assignments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma atribuição cadastrada</p>
          ) : (
            <div className="space-y-2">
              {assignments.map(a => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    {a.is_primary && <Star className="h-4 w-4 text-warning fill-warning" />}
                    <div>
                      <p className="font-medium text-sm">{a.agents?.name ?? a.agent_id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">
                        Ramal {a.agents?.extension} → {a.voip_trunks?.name} ({a.voip_trunks?.provider})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {a.is_primary && <Badge variant="secondary">Primária</Badge>}
                    <Button variant="ghost" size="icon" onClick={() => del.mutate(a.id)} disabled={del.isPending}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
