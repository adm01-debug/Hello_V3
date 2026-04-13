import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AgentGoals } from '@/hooks/useAgentRanking';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingGoals: AgentGoals | null;
  setEditingGoals: (goals: AgentGoals | null) => void;
  onSave: () => void;
}

export function GoalsConfigDialog({ open, onOpenChange, editingGoals, setEditingGoals, onSave }: Props) {
  if (!editingGoals) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurar Metas - {editingGoals.agent_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="calls_target">Meta de Chamadas</Label>
            <Input id="calls_target" type="number" min={1} max={500} value={editingGoals.calls_target}
              onChange={(e) => setEditingGoals({ ...editingGoals, calls_target: Math.max(1, Math.min(500, parseInt(e.target.value) || 1)) })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="satisfaction_target">Meta de Satisfação (1-10)</Label>
            <Input id="satisfaction_target" type="number" min={1} max={10} step={0.1} value={editingGoals.satisfaction_target}
              onChange={(e) => setEditingGoals({ ...editingGoals, satisfaction_target: Math.max(1, Math.min(10, parseFloat(e.target.value) || 1)) })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="performance_target">Meta de Performance (1-10)</Label>
            <Input id="performance_target" type="number" min={1} max={10} step={0.1} value={editingGoals.performance_target}
              onChange={(e) => setEditingGoals({ ...editingGoals, performance_target: Math.max(1, Math.min(10, parseFloat(e.target.value) || 1)) })} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={onSave}>Salvar Metas</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
