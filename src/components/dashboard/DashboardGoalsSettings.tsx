import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Target, Plus, Pencil, Trash2, Save, AlertTriangle, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useDashboardGoals, METRIC_TYPES, COMPARISON_OPERATORS } from '@/hooks/useDashboardGoals';
import type { DashboardGoal } from '@/hooks/useDashboardGoals';

// Re-export for consumers
export type { DashboardGoal };

interface DashboardGoalsSettingsProps {
  onGoalsChange?: () => void;
}

const getMetricUnit = (type: string) => METRIC_TYPES.find(m => m.value === type)?.unit || '';

export const DashboardGoalsSettings = ({ onGoalsChange }: DashboardGoalsSettingsProps) => {
  const {
    goals, loading, dialogOpen, setDialogOpen, editingGoal, formData, setFormData, saving,
    fetchGoals, handleOpenDialog, handleSave, handleDelete, handleToggleActive,
    getMetricLabel, formatValue,
  } = useDashboardGoals(onGoalsChange);

  return (
    <Card className="glass">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" />Metas do Dashboard</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchGoals} disabled={loading}><RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />Atualizar</Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild><Button size="sm" onClick={() => handleOpenDialog()}><Plus className="h-4 w-4 mr-2" />Nova Meta</Button></DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader><DialogTitle>{editingGoal ? 'Editar Meta' : 'Nova Meta'}</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2"><Label>Nome da Meta</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Nível de Serviço Mínimo" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Tipo de Métrica</Label><Select value={formData.metric_type} onValueChange={(v) => setFormData({ ...formData, metric_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{METRIC_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><Label>Operador</Label><Select value={formData.comparison_operator} onValueChange={(v) => setFormData({ ...formData, comparison_operator: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{COMPARISON_OPERATORS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>Meta ({getMetricUnit(formData.metric_type)})</Label><Input type="number" value={formData.target_value} onChange={(e) => setFormData({ ...formData, target_value: e.target.value })} placeholder="80" /></div>
                    <div className="space-y-2"><Label className="text-warning">Aviso</Label><Input type="number" value={formData.warning_threshold} onChange={(e) => setFormData({ ...formData, warning_threshold: e.target.value })} placeholder="75" /></div>
                    <div className="space-y-2"><Label className="text-destructive">Crítico</Label><Input type="number" value={formData.critical_threshold} onChange={(e) => setFormData({ ...formData, critical_threshold: e.target.value })} placeholder="60" /></div>
                  </div>
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center justify-between"><Label>Meta Ativa</Label><Switch checked={formData.is_active} onCheckedChange={(c) => setFormData({ ...formData, is_active: c })} /></div>
                    <div className="flex items-center justify-between"><Label>Notificar em Aviso</Label><Switch checked={formData.notify_on_warning} onCheckedChange={(c) => setFormData({ ...formData, notify_on_warning: c })} /></div>
                    <div className="flex items-center justify-between"><Label>Notificar em Crítico</Label><Switch checked={formData.notify_on_critical} onCheckedChange={(c) => setFormData({ ...formData, notify_on_critical: c })} /></div>
                  </div>
                </div>
                <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button onClick={handleSave} disabled={saving}>{saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}Salvar</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[400px]">
          {loading ? (<div className="flex items-center justify-center py-8"><RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" /></div>)
          : goals.length === 0 ? (<div className="text-center py-8 text-muted-foreground"><Target className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Nenhuma meta configurada</p></div>)
          : (<div className="space-y-3">
              {goals.map(goal => (
                <div key={goal.id} className={`p-4 rounded-lg border transition-all ${goal.is_active ? 'bg-card' : 'bg-muted/30 opacity-60'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2"><span className="font-medium">{goal.name}</span><Badge variant={goal.is_active ? 'default' : 'outline'}>{goal.is_active ? 'Ativa' : 'Inativa'}</Badge></div>
                      <div className="text-sm text-muted-foreground mb-2">{getMetricLabel(goal.metric_type)}</div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-success" /><span>Meta: {formatValue(goal.target_value, goal.metric_type)}</span></div>
                        <div className="flex items-center gap-1"><AlertTriangle className="h-4 w-4 text-warning" /><span>Aviso: {formatValue(goal.warning_threshold, goal.metric_type)}</span></div>
                        <div className="flex items-center gap-1"><AlertCircle className="h-4 w-4 text-destructive" /><span>Crítico: {formatValue(goal.critical_threshold, goal.metric_type)}</span></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={goal.is_active} onCheckedChange={() => handleToggleActive(goal)} />
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(goal)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(goal.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>)}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default DashboardGoalsSettings;
