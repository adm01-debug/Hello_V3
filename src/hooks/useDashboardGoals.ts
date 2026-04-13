import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

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

export interface GoalFormData {
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

export const METRIC_TYPES = [
  { value: 'service_level', label: 'Nível de Serviço (%)', unit: '%' },
  { value: 'abandonment_rate', label: 'Taxa de Abandono (%)', unit: '%' },
  { value: 'avg_wait_time', label: 'Tempo Médio de Espera', unit: 's' },
  { value: 'avg_handle_time', label: 'Tempo Médio de Atendimento', unit: 's' },
];

export const COMPARISON_OPERATORS = [
  { value: 'gte', label: 'Maior ou igual a (≥)' },
  { value: 'lte', label: 'Menor ou igual a (≤)' },
];

const defaultFormData: GoalFormData = {
  name: '', metric_type: 'service_level', target_value: '', warning_threshold: '',
  critical_threshold: '', comparison_operator: 'gte', is_active: true, notify_on_warning: true, notify_on_critical: true,
};

export function useDashboardGoals(onGoalsChange?: () => void) {
  const [goals, setGoals] = useState<DashboardGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<DashboardGoal | null>(null);
  const [formData, setFormData] = useState<GoalFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);

  const fetchGoals = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('dashboard_goals').select('*').order('created_at', { ascending: true });
    if (error) { logger.error('Error fetching goals:', error); toast.error('Erro ao carregar metas'); }
    else setGoals(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchGoals(); }, []);

  const handleOpenDialog = (goal?: DashboardGoal) => {
    if (goal) {
      setEditingGoal(goal);
      setFormData({
        name: goal.name, metric_type: goal.metric_type, target_value: goal.target_value.toString(),
        warning_threshold: goal.warning_threshold.toString(), critical_threshold: goal.critical_threshold.toString(),
        comparison_operator: goal.comparison_operator, is_active: goal.is_active,
        notify_on_warning: goal.notify_on_warning, notify_on_critical: goal.notify_on_critical,
      });
    } else { setEditingGoal(null); setFormData(defaultFormData); }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.target_value || !formData.warning_threshold || !formData.critical_threshold) {
      toast.error('Preencha todos os campos obrigatórios'); return;
    }
    setSaving(true);
    const goalData = {
      name: formData.name, metric_type: formData.metric_type,
      target_value: parseFloat(formData.target_value), warning_threshold: parseFloat(formData.warning_threshold),
      critical_threshold: parseFloat(formData.critical_threshold), comparison_operator: formData.comparison_operator,
      is_active: formData.is_active, notify_on_warning: formData.notify_on_warning, notify_on_critical: formData.notify_on_critical,
    };
    let error;
    if (editingGoal) { const { error: e } = await supabase.from('dashboard_goals').update(goalData).eq('id', editingGoal.id); error = e; }
    else { const { error: e } = await supabase.from('dashboard_goals').insert(goalData); error = e; }
    if (error) { logger.error('Error saving goal:', error); toast.error('Erro ao salvar meta'); }
    else { toast.success(editingGoal ? 'Meta atualizada' : 'Meta criada'); setDialogOpen(false); fetchGoals(); onGoalsChange?.(); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('dashboard_goals').delete().eq('id', id);
    if (error) { logger.error('Error deleting goal:', error); toast.error('Erro ao excluir meta'); }
    else { toast.success('Meta excluída'); fetchGoals(); onGoalsChange?.(); }
  };

  const handleToggleActive = async (goal: DashboardGoal) => {
    const { error } = await supabase.from('dashboard_goals').update({ is_active: !goal.is_active }).eq('id', goal.id);
    if (error) toast.error('Erro ao atualizar meta');
    else { fetchGoals(); onGoalsChange?.(); }
  };

  const getMetricLabel = (type: string) => METRIC_TYPES.find(m => m.value === type)?.label || type;
  const getMetricUnit = (type: string) => METRIC_TYPES.find(m => m.value === type)?.unit || '';
  const formatValue = (value: number, type: string) => {
    const unit = getMetricUnit(type);
    if (unit === 's') { if (value < 60) return `${value}s`; return `${Math.floor(value / 60)}m ${value % 60}s`; }
    return `${value}${unit}`;
  };

  return {
    goals, loading, dialogOpen, setDialogOpen, editingGoal, formData, setFormData, saving,
    fetchGoals, handleOpenDialog, handleSave, handleDelete, handleToggleActive,
    getMetricLabel, formatValue,
  };
}
