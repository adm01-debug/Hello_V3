import { supabase } from '@/integrations/supabase/client';

export type NotificationCategory = 'system' | 'call' | 'security' | 'coaching' | 'gamification';
export type NotificationSeverity = 'info' | 'warning' | 'critical';

export interface SendNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: string;
  category?: NotificationCategory;
  severity?: NotificationSeverity;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
  sourceType?: string;
  sourceId?: string;
  expiresAt?: string;
}

/**
 * Send a notification to a user via the edge function
 */
export async function sendNotification(params: SendNotificationParams): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: {
        user_id: params.userId,
        title: params.title,
        message: params.message,
        type: params.type || 'info',
        category: params.category || 'system',
        severity: params.severity || 'info',
        action_url: params.actionUrl,
        action_label: params.actionLabel,
        metadata: params.metadata,
        source_type: params.sourceType,
        source_id: params.sourceId,
        expires_at: params.expiresAt,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, ...data };
  } catch {
    return { success: false, error: 'Falha ao enviar notificação' };
  }
}

/**
 * Send a notification directly via database insert (for local/quick notifications)
 */
export async function sendLocalNotification(params: SendNotificationParams): Promise<boolean> {
  const payload = {
    user_id: params.userId,
    title: params.title,
    message: params.message,
    type: params.type || 'info',
    category: params.category || 'system',
    severity: params.severity || 'info',
    action_url: params.actionUrl,
    action_label: params.actionLabel,
    metadata: params.metadata || {},
    source_type: params.sourceType,
    source_id: params.sourceId,
    expires_at: params.expiresAt,
  };
  const { error } = await (supabase.from as any)('notifications').insert(payload);

  return !error;
}

/**
 * Validate notification payload
 */
export function validateNotification(params: Partial<SendNotificationParams>): string[] {
  const errors: string[] = [];
  
  if (!params.userId) errors.push('userId é obrigatório');
  if (!params.title || params.title.trim().length === 0) errors.push('title é obrigatório');
  if (!params.message || params.message.trim().length === 0) errors.push('message é obrigatório');
  if (params.title && params.title.length > 200) errors.push('title deve ter no máximo 200 caracteres');
  if (params.message && params.message.length > 2000) errors.push('message deve ter no máximo 2000 caracteres');
  
  const validCategories = ['system', 'call', 'security', 'coaching', 'gamification'];
  if (params.category && !validCategories.includes(params.category)) {
    errors.push(`category deve ser: ${validCategories.join(', ')}`);
  }
  
  const validSeverities = ['info', 'warning', 'critical'];
  if (params.severity && !validSeverities.includes(params.severity)) {
    errors.push(`severity deve ser: ${validSeverities.join(', ')}`);
  }

  return errors;
}
