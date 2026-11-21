import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import {
  DEFAULT_LDAP_CONFIG,
  type LDAPConfig,
  type SyncLog,
} from '@/components/admin/ldap/types';

type EdgeConfig = Omit<LDAPConfig, 'bindPassword'> & { hasPassword?: boolean };

interface SyncResult {
  ok: boolean;
  status?: SyncLog['status'];
  synced?: number;
  created?: number;
  updated?: number;
  failed?: number;
  durationMs?: number;
  error?: string;
}

async function invokeLdap<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('ldap-sync', { body });
  if (error) {
    let message = error.message;
    const context = (error as { context?: { json?: () => Promise<{ error?: string }> } }).context;
    if (context?.json) {
      try {
        const parsed = await context.json();
        if (parsed?.error) message = parsed.error;
      } catch { /* mantém a mensagem original */ }
    }
    throw new Error(message);
  }
  return data as T;
}

export function useLDAPSync() {
  const [config, setConfig] = useState<LDAPConfig>(DEFAULT_LDAP_CONFIG);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);

  const loadLogs = useCallback(async () => {
    try {
      const { logs: fetched } = await invokeLdap<{ logs: SyncLog[] }>({ action: 'list-logs' });
      setLogs(fetched ?? []);
    } catch (error) {
      logger.error('Falha ao carregar histórico LDAP:', error);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { config: stored } = await invokeLdap<{ config: EdgeConfig }>({ action: 'get-config' });
      setConfig(prev => ({
        ...prev,
        ...stored,
        bindPassword: '',
      }));
      await loadLogs();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao carregar configuração LDAP');
    } finally {
      setLoading(false);
    }
  }, [loadLogs]);

  useEffect(() => { void load(); }, [load]);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      let passwordEncrypted: string | undefined;
      if (config.bindPassword) {
        const result = await invokeLdap<{ passwordEncrypted: string }>({
          action: 'encrypt-password',
          password: config.bindPassword,
        });
        passwordEncrypted = result.passwordEncrypted;
      }
      const payload = {
        serverUrl: config.serverUrl,
        port: config.port,
        baseDn: config.baseDn,
        bindDn: config.bindDn,
        useTLS: config.useTLS,
        searchFilter: config.searchFilter,
        syncInterval: config.syncInterval,
        fieldMapping: config.fieldMapping,
      };
      await invokeLdap({
        action: 'save-config',
        config: { ...payload, passwordEncrypted },
      });
      setConfig(prev => ({ ...prev, bindPassword: '' }));
      toast.success('Configuração salva');
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao salvar configuração');
      return false;
    } finally {
      setSaving(false);
    }
  }, [config]);

  const testConnection = useCallback(async () => {
    if (!config.serverUrl || !config.baseDn) {
      toast.error('Preencha servidor e Base DN');
      return;
    }
    setTesting(true);
    try {
      const saved = await save();
      if (!saved) return;
      const result = await invokeLdap<{ ok: boolean; entriesVisible?: number; latencyMs?: number; error?: string }>({
        action: 'test-connection',
      });
      if (result.ok) {
        toast.success(`Conexão LDAP OK (${result.latencyMs}ms, ${result.entriesVisible ?? 0} entrada(s) visível(is))`);
      } else {
        toast.error(`Falha na conexão: ${result.error ?? 'erro desconhecido'}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao testar conexão');
    } finally {
      setTesting(false);
    }
  }, [config.serverUrl, config.baseDn, save]);

  const runSync = useCallback(async () => {
    if (!config.serverUrl) {
      toast.error('Configure o servidor LDAP primeiro');
      return;
    }
    setSyncing(true);
    setLastResult(null);
    try {
      const result = await invokeLdap<SyncResult>({ action: 'sync' });
      setLastResult(result);
      if (result.ok) {
        toast.success(
          `Sincronização concluída: ${result.synced ?? 0} contato(s) — ${result.created ?? 0} criado(s), ${result.updated ?? 0} atualizado(s)${result.failed ? `, ${result.failed} falha(s)` : ''}`,
        );
      } else {
        toast.error(`Sincronização falhou: ${result.error ?? 'erro desconhecido'}`);
      }
      await loadLogs();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha na sincronização');
    } finally {
      setSyncing(false);
    }
  }, [config.serverUrl, loadLogs]);

  return {
    config,
    setConfig,
    logs,
    loading,
    saving,
    testing,
    syncing,
    lastResult,
    save,
    testConnection,
    runSync,
    reloadLogs: loadLogs,
  };
}
