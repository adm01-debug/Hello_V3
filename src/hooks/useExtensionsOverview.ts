import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export type AgentStatus = 'available' | 'busy' | 'away' | 'offline' | 'inactive';

export interface ExtensionOverview {
  agent_id: string;
  name: string;
  extension: string;
  status: AgentStatus;
  department: string | null;
  email: string | null;
  avatar_url: string | null;
  user_id: string | null;
  user_full_name: string | null;
  user_role: string | null;
  device_count: number;
  primary_trunk_id: string | null;
  primary_trunk_name: string | null;
  primary_trunk_provider: string | null;
  primary_trunk_health: 'healthy' | 'degraded' | 'offline' | null;
  health_score: number;
  health_issues: string[];
}

interface AgentRow {
  id: string;
  name: string;
  extension: string;
  status: AgentStatus;
  department: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface ProfileRow {
  id: string;
  agent_id: string | null;
  full_name: string | null;
  role: string | null;
}

interface AssignmentRow {
  agent_id: string;
  is_primary: boolean;
  trunk_id: string;
  voip_trunks: {
    id: string;
    name: string;
    provider: string;
    last_health_status: string | null;
  } | null;
}

interface DeviceRow {
  agent_name: string;
}

function computeHealth(args: {
  hasTrunk: boolean;
  trunkOnline: boolean;
  hasDevices: boolean;
  online: boolean;
  profileComplete: boolean;
}): { score: number; issues: string[] } {
  let score = 0;
  const issues: string[] = [];
  if (args.hasTrunk) score += 30; else issues.push('Sem trunk VoIP atribuído');
  if (args.trunkOnline) score += 20; else if (args.hasTrunk) issues.push('Trunk degradado/offline');
  if (args.hasDevices) score += 20; else issues.push('Sem dispositivos extras');
  if (args.online) score += 15; else issues.push('Agente offline');
  if (args.profileComplete) score += 15; else issues.push('Perfil incompleto');
  return { score, issues };
}

export function useExtensionsOverview() {
  const qc = useQueryClient();

  useEffect(() => {
    const ch = supabase
      .channel('extensions-overview-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agents' },
        () => qc.invalidateQueries({ queryKey: ['extensions-overview'] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  return useQuery({
    queryKey: ['extensions-overview'],
    staleTime: 60 * 1000,
    queryFn: async (): Promise<ExtensionOverview[]> => {
      const [agentsRes, profilesRes, assignmentsRes, devicesRes] = await Promise.all([
        supabase
          .from('agents')
          .select('id, name, extension, status, department, email, avatar_url')
          .order('extension', { ascending: true }),
        supabase
          .from('user_profiles')
          .select('id, agent_id, full_name, role'),
        supabase
          .from('agent_trunk_assignments')
          .select('agent_id, is_primary, trunk_id, voip_trunks:trunk_id(id, name, provider, last_health_status)'),
        supabase
          .from('agent_devices')
          .select('agent_name')
          .eq('is_enabled', true),
      ]);

      if (agentsRes.error) {
        logger.error('extensions-overview: agents', agentsRes.error);
        throw agentsRes.error;
      }
      if (profilesRes.error) throw profilesRes.error;
      if (assignmentsRes.error) throw assignmentsRes.error;
      if (devicesRes.error) throw devicesRes.error;

      const agents = (agentsRes.data ?? []) as AgentRow[];
      const profiles = (profilesRes.data ?? []) as ProfileRow[];
      const assignments = (assignmentsRes.data ?? []) as unknown as AssignmentRow[];
      const devices = (devicesRes.data ?? []) as DeviceRow[];

      const profileByAgent = new Map<string, ProfileRow>();
      profiles.forEach(p => {
        if (p.agent_id) profileByAgent.set(p.agent_id, p);
      });

      const deviceCountByAgent = new Map<string, number>();
      devices.forEach(d => {
        deviceCountByAgent.set(d.agent_name, (deviceCountByAgent.get(d.agent_name) ?? 0) + 1);
      });

      const primaryByAgent = new Map<string, AssignmentRow>();
      assignments.forEach(a => {
        const existing = primaryByAgent.get(a.agent_id);
        if (!existing || (a.is_primary && !existing.is_primary)) {
          primaryByAgent.set(a.agent_id, a);
        }
      });

      return agents.map<ExtensionOverview>(a => {
        const profile = profileByAgent.get(a.id) ?? null;
        const assignment = primaryByAgent.get(a.id) ?? null;
        const trunk = assignment?.voip_trunks ?? null;
        const health = trunk?.last_health_status as ExtensionOverview['primary_trunk_health'];
        const deviceCount = deviceCountByAgent.get(a.name) ?? 0;
        const profileComplete = !!(profile?.full_name && a.email);
        const { score, issues } = computeHealth({
          hasTrunk: !!trunk,
          trunkOnline: health === 'healthy',
          hasDevices: deviceCount > 0,
          online: a.status !== 'offline' && a.status !== 'inactive',
          profileComplete,
        });
        return {
          agent_id: a.id,
          name: a.name,
          extension: a.extension,
          status: a.status,
          department: a.department,
          email: a.email,
          avatar_url: a.avatar_url,
          user_id: profile?.id ?? null,
          user_full_name: profile?.full_name ?? null,
          user_role: profile?.role ?? null,
          device_count: deviceCount,
          primary_trunk_id: trunk?.id ?? null,
          primary_trunk_name: trunk?.name ?? null,
          primary_trunk_provider: trunk?.provider ?? null,
          primary_trunk_health: health ?? null,
          health_score: score,
          health_issues: issues,
        };
      });
    },
  });
}
