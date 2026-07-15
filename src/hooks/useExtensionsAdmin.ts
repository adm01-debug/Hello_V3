import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { exportToCSV } from '@/lib/export';
import { useExtensionsOverview, type ExtensionOverview } from '@/hooks/useExtensionsOverview';
import { useExtensionAudit } from '@/hooks/useExtensionAudit';
import type { HealthFilter } from '@/components/admin/extensions/ExtensionsFilters';

export function useExtensionsAdmin() {
  const qc = useQueryClient();
  const { data: extensions = [], isLoading } = useExtensionsOverview();
  const { logBulk } = useExtensionAudit();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [trunkFilter, setTrunkFilter] = useState<string>('all');
  const [healthFilter, setHealthFilter] = useState<HealthFilter>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkOffline, setBulkOffline] = useState(false);

  const filtered = useMemo(() => {
    return extensions.filter(e => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !e.name.toLowerCase().includes(q) &&
          !e.extension.includes(q) &&
          !(e.email ?? '').toLowerCase().includes(q)
        ) return false;
      }
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (trunkFilter === 'with' && !e.primary_trunk_id) return false;
      if (trunkFilter === 'without' && e.primary_trunk_id) return false;
      if (healthFilter === 'healthy' && e.health_score < 80) return false;
      if (healthFilter === 'warning' && (e.health_score < 50 || e.health_score >= 80)) return false;
      if (healthFilter === 'critical' && e.health_score >= 50) return false;
      return true;
    });
  }, [extensions, search, statusFilter, trunkFilter, healthFilter]);

  const stats = useMemo(() => {
    const total = extensions.length;
    const sumScore = extensions.reduce((s, e) => s + e.health_score, 0);
    return {
      total,
      online: extensions.filter(e => e.status === 'available' || e.status === 'busy').length,
      noTrunk: extensions.filter(e => !e.primary_trunk_id).length,
      avgScore: total > 0 ? Math.round(sumScore / total) : 0,
    };
  }, [extensions]);

  const allFilteredSelected = filtered.length > 0 && filtered.every(e => selectedIds.has(e.agent_id));
  const someFilteredSelected = filtered.some(e => selectedIds.has(e.agent_id));

  const toggleAll = () => {
    const next = new Set(selectedIds);
    if (allFilteredSelected) filtered.forEach(e => next.delete(e.agent_id));
    else filtered.forEach(e => next.add(e.agent_id));
    setSelectedIds(next);
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkOffline = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkOffline(true);
    try {
      const { error } = await supabase.from('agents').update({ status: 'offline' }).in('id', ids);
      if (error) throw error;
      toast.success(`${ids.length} ${ids.length === 1 ? 'ramal' : 'ramais'} marcados como offline`);
      logBulk({ action: 'bulk_force_offline', agentIds: ids });
      qc.invalidateQueries({ queryKey: ['extensions-overview'] });
      clearSelection();
    } catch (e) {
      const err = e as Error;
      logger.error('bulk-offline', err);
      toast.error('Falha ao atualizar status', { description: err.message });
    } finally {
      setBulkOffline(false);
    }
  };

  const handleExportCsv = () => {
    const rows = selectedIds.size > 0 ? filtered.filter(e => selectedIds.has(e.agent_id)) : filtered;
    if (rows.length === 0) {
      toast.warning('Nada para exportar');
      return;
    }
    exportToCSV(
      rows.map(e => ({
        ramal: e.extension,
        nome: e.name,
        email: e.email ?? '',
        status: e.status,
        dispositivos: e.device_count,
        trunk: e.primary_trunk_name ?? '',
        provedor: e.primary_trunk_provider ?? '',
        saude_trunk: e.primary_trunk_health ?? '',
        score: e.health_score,
        chamadas_7d: e.call_count_7d,
        ultima_chamada: e.last_call_at ?? '',
        problemas: e.health_issues.join(' | '),
      })),
      [
        { key: 'ramal', label: 'Ramal' },
        { key: 'nome', label: 'Nome' },
        { key: 'email', label: 'E-mail' },
        { key: 'status', label: 'Status' },
        { key: 'dispositivos', label: 'Dispositivos' },
        { key: 'trunk', label: 'Trunk Primário' },
        { key: 'provedor', label: 'Provedor' },
        { key: 'saude_trunk', label: 'Saúde Trunk' },
        { key: 'score', label: 'Score' },
        { key: 'chamadas_7d', label: 'Chamadas 7d' },
        { key: 'ultima_chamada', label: 'Última Chamada' },
        { key: 'problemas', label: 'Problemas' },
      ],
      `ramais-${new Date().toISOString().slice(0, 10)}`,
    );
    logBulk({
      action: 'bulk_export_csv',
      agentIds: rows.map(r => r.agent_id),
      details: { source: selectedIds.size > 0 ? 'selection' : 'filtered' },
    });
    toast.success(`Exportados ${rows.length} ramais`);
  };

  return {
    extensions,
    filtered,
    stats,
    isLoading,
    search, setSearch,
    statusFilter, setStatusFilter,
    trunkFilter, setTrunkFilter,
    healthFilter, setHealthFilter,
    selectedIds,
    allFilteredSelected,
    someFilteredSelected,
    toggleAll,
    toggleOne,
    clearSelection,
    bulkOffline,
    handleBulkOffline,
    handleExportCsv,
  };
}

export type { ExtensionOverview };
