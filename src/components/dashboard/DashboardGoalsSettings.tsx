import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { 
  Target, 
  Plus, 
  Pencil, 
  Trash2, 
  Save,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Settings
} from 'lucide-react';

export interface DashboardGoal {
  id: string;
  name: string;
  metric_type: string;
  target_value: number;
  warning_threshold: number;
  critical_threshold: number;
  comparison_operator: string;
  is_active: boolean;
  notify_on_warning: boolean;
  notify_on_critical: boolean;
  created_at: string;
  updated_at: string;
}

const METRIC_TYPES = [
  { value: 'service_level', label: 'Nível de Serviço (%)', unit: '%' },
  { value: 'abandonment_rate', label: 'Taxa de Abandono (%)', unit: '%' },
  { value: 'avg_wait_time', label: 'Tempo Médio de Espera', unit: 's' },
  { value: 'avg_handle_time', label: 'Tempo Médio de Atendimento', unit: 's' },
];

const COMPARISON_OPERATORS = [
  { value: 'gte', label: 'Maior ou igual a (≥)' },
  { value: 'lte', label: 'Menor ou igual a (≤)' },
];

interface GoalFormData {
  name: string;
  metric_type: string;
  target_value: string;
  warning_threshold: string;
  critical_threshold: string;
  comparison_operator: string;
  is_active: boolean;
  notify_on_warning: boolean;
  notify_on_critical: boolean;
}

const defaultFormData: GoalFormData = {
  name: '',
  metric_type: 'service_level',
  target_value: '',
  warning_threshold: '',
  critical_threshold: '',
  comparison_operator: 'gte',
  is_active: true,
  notify_on_warning: true,
  notify_on_critical: true,
};

interface DashboardGoalsSettingsProps {
  onGoalsChange?: () => void;
}

export const DashboardGoalsSettings = ({ onGoalsChange }: DashboardGoalsSettingsProps) => {
  const [goals, setGoals] = useState<DashboardGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<DashboardGoal | null>(null);
  const [formData, setFormData] = useState<GoalFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);

  const fetchGoals = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('dashboard_goals')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Error fetching goals:', error);
      toast.error('Erro ao carregar metas');
    } else {
      setGoals(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleOpenDialog = (goal?: DashboardGoal) => {
    if (goal) {
      setEditingGoal(goal);
      setFormData({
        name: goal.name,
        metric_type: goal.metric_type,
        target_value: goal.target_value.toString(),
        warning_threshold: goal.warning_threshold.toString(),
        critical_threshold: goal.critical_threshold.toString(),
        comparison_operator: goal.comparison_operator,
        is_active: goal.is_active,
        notify_on_warning: goal.notify_on_warning,
        notify_on_critical: goal.notify_on_critical,
      });
    } else {
      setEditingGoal(null);
      setFormData(defaultFormData);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.target_value || !formData.warning_threshold || !formData.critical_threshold) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setSaving(true);

    const goalData = {
      name: formData.name,
      metric_type: formData.metric_type,
      target_value: parseFloat(formData.target_value),
      warning_threshold: parseFloat(formData.warning_threshold),
      critical_threshold: parseFloat(formData.critical_threshold),
      comparison_operator: formData.comparison_operator,
      is_active: formData.is_active,
      notify_on_warning: formData.notify_on_warning,
      notify_on_critical: formData.notify_on_critical,
    };

    let error;

    if (editingGoal) {
      const { error: updateError } = await supabase
        .from('dashboard_goals')
        .update(goalData)
        .eq('id', editingGoal.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('dashboard_goals')
        .insert(goalData);
      error = insertError;
    }

    if (error) {
      logger.error('Error saving goal:', error);
      toast.error('Erro ao salvar meta');
    } else {
      toast.success(editingGoal ? 'Meta atualizada' : 'Meta criada');
      setDialogOpen(false);
      fetchGoals();
      onGoalsChange?.();
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('dashboard_goals')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Error deleting goal:', error);
      toast.error('Erro ao excluir meta');
    } else {
      toast.success('Meta excluída');
      fetchGoals();
      onGoalsChange?.();
    }
  };

  const handleToggleActive = async (goal: DashboardGoal) => {
    const { error } = await supabase
      .from('dashboard_goals')
      .update({ is_active: !goal.is_active })
      .eq('id', goal.id);

    if (error) {
      toast.error('Erro ao atualizar meta');
    } else {
      fetchGoals();
      onGoalsChange?.();
    }
  };

  const getMetricLabel = (type: string) => {
    return METRIC_TYPES.find(m => m.value === type)?.label || type;
  };

  const getMetricUnit = (type: string) => {
    return METRIC_TYPES.find(m => m.value === type)?.unit || '';
  };

  const formatValue = (value: number, type: string) => {
    const unit = getMetricUnit(type);
    if (unit === 's') {
      if (value < 60) return `${value}s`;
      return `${Math.floor(value / 60)}m ${value % 60}s`;
    }
    return `${value}${unit}`;
  };

  return (
    <Card className="glass">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Metas do Dashboard
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchGoals} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Meta
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingGoal ? 'Editar Meta' : 'Nova Meta'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome da Meta</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Nível de Serviço Mínimo"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo de Métrica</Label>
                      <Select
                        value={formData.metric_type}
                        onValueChange={(value) => setFormData({ ...formData, metric_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {METRIC_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Operador</Label>
                      <Select
                        value={formData.comparison_operator}
                        onValueChange={(value) => setFormData({ ...formData, comparison_operator: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COMPARISON_OPERATORS.map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Meta ({getMetricUnit(formData.metric_type)})</Label>
                      <Input
                        type="number"
                        value={formData.target_value}
                        onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                        placeholder="80"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-warning">Aviso</Label>
                      <Input
                        type="number"
                        value={formData.warning_threshold}
                        onChange={(e) => setFormData({ ...formData, warning_threshold: e.target.value })}
                        placeholder="75"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-destructive">Crítico</Label>
                      <Input
                        type="number"
                        value={formData.critical_threshold}
                        onChange={(e) => setFormData({ ...formData, critical_threshold: e.target.value })}
                        placeholder="60"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <Label>Meta Ativa</Label>
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Notificar em Aviso</Label>
                      <Switch
                        checked={formData.notify_on_warning}
                        onCheckedChange={(checked) => setFormData({ ...formData, notify_on_warning: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Notificar em Crítico</Label>
                      <Switch
                        checked={formData.notify_on_critical}
                        onCheckedChange={(checked) => setFormData({ ...formData, notify_on_critical: checked })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Salvar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : goals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma meta configurada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  className={`p-4 rounded-lg border transition-all ${
                    goal.is_active ? 'bg-card' : 'bg-muted/30 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{goal.name}</span>
                        <Badge variant={goal.is_active ? 'default' : 'outline'}>
                          {goal.is_active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {getMetricLabel(goal.metric_type)}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-success" />
                          <span>Meta: {formatValue(goal.target_value, goal.metric_type)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4 text-warning" />
                          <span>Aviso: {formatValue(goal.warning_threshold, goal.metric_type)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-4 w-4 text-destructive" />
                          <span>Crítico: {formatValue(goal.critical_threshold, goal.metric_type)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={goal.is_active}
                        onCheckedChange={() => handleToggleActive(goal)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(goal)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(goal.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default DashboardGoalsSettings;
