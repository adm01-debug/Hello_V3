import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

type AuditAction = 
  | 'view' 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'export' 
  | 'download'
  | 'login'
  | 'logout';

type ResourceType = 
  | 'contact'
  | 'contact_interaction'
  | 'call_session'
  | 'call_transcription'
  | 'call_recording'
  | 'call_analysis'
  | 'call_summary'
  | 'agent'
  | 'user_profile'
  | 'coaching_recommendation'
  | 'scheduled_callback'
  | 'dialer_campaign'
  | 'dialer_queue';

export function useAuditLog() {
  const logEvent = useCallback(async (
    action: AuditAction,
    resourceType: ResourceType,
    resourceId?: string,
    details?: Record<string, Json>
  ) => {
    try {
      const { error } = await supabase.rpc('log_audit_event', {
        p_action: action,
        p_resource_type: resourceType,
        p_resource_id: resourceId ?? undefined,
        p_details: (details || {}) as Json
      });

      if (error) {
        console.error('Failed to log audit event:', error);
      }
    } catch (err) {
      console.error('Error logging audit event:', err);
    }
  }, []);

  const logContactAccess = useCallback((contactId: string, contactName?: string) => {
    return logEvent('view', 'contact', contactId, { contact_name: contactName || null });
  }, [logEvent]);

  const logCallTranscriptionAccess = useCallback((sessionId: string) => {
    return logEvent('view', 'call_transcription', sessionId);
  }, [logEvent]);

  const logCallRecordingDownload = useCallback((recordingId: string, filePath?: string) => {
    return logEvent('download', 'call_recording', recordingId, { file_path: filePath || null });
  }, [logEvent]);

  const logAgentProfileAccess = useCallback((agentId: string, agentName?: string) => {
    return logEvent('view', 'agent', agentId, { agent_name: agentName || null });
  }, [logEvent]);

  const logUserProfileAccess = useCallback((profileId: string) => {
    return logEvent('view', 'user_profile', profileId);
  }, [logEvent]);

  const logCallAnalysisAccess = useCallback((sessionId: string) => {
    return logEvent('view', 'call_analysis', sessionId);
  }, [logEvent]);

  const logCoachingAccess = useCallback((recommendationId: string, agentName?: string) => {
    return logEvent('view', 'coaching_recommendation', recommendationId, { agent_name: agentName || null });
  }, [logEvent]);

  const logDataExport = useCallback((resourceType: ResourceType, count: number) => {
    return logEvent('export', resourceType, undefined, { record_count: count });
  }, [logEvent]);

  return {
    logEvent,
    logContactAccess,
    logCallTranscriptionAccess,
    logCallRecordingDownload,
    logAgentProfileAccess,
    logUserProfileAccess,
    logCallAnalysisAccess,
    logCoachingAccess,
    logDataExport
  };
}
