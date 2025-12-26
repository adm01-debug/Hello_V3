import { createClient } from '@supabase/supabase-js';

export interface AuditLog {
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  ip: string;
  userAgent: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class AuditLogger {
  private supabase: any;

  constructor() {
    this.supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_SERVICE_KEY!
    );
  }

  async log(entry: AuditLog): Promise<void> {
    try {
      // Log to database
      await this.supabase.from('audit_logs').insert({
        timestamp: entry.timestamp.toISOString(),
        user_id: entry.userId,
        action: entry.action,
        resource: entry.resource,
        resource_id: entry.resourceId,
        ip_address: entry.ip,
        user_agent: entry.userAgent,
        success: entry.success,
        error_message: entry.errorMessage,
        metadata: entry.metadata,
        severity: entry.severity,
      });

      // Log critical events to external service
      if (entry.severity === 'critical') {
        console.error('[CRITICAL AUDIT]', JSON.stringify(entry));
        // Send to external service (e.g., Datadog, Splunk)
      }
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }
  }

  async logAccess(userId: string, resource: string, ip: string) {
    await this.log({
      timestamp: new Date(),
      userId,
      action: 'ACCESS',
      resource,
      ip,
      userAgent: 'N/A',
      success: true,
      severity: 'low',
    });
  }

  async logModification(
    userId: string,
    resource: string,
    resourceId: string,
    changes: any
  ) {
    await this.log({
      timestamp: new Date(),
      userId,
      action: 'MODIFY',
      resource,
      resourceId,
      ip: 'N/A',
      userAgent: 'N/A',
      success: true,
      metadata: { changes },
      severity: 'medium',
    });
  }

  async logDeletion(
    userId: string,
    resource: string,
    resourceId: string
  ) {
    await this.log({
      timestamp: new Date(),
      userId,
      action: 'DELETE',
      resource,
      resourceId,
      ip: 'N/A',
      userAgent: 'N/A',
      success: true,
      severity: 'high',
    });
  }

  async logLogin(userId: string, ip: string, userAgent: string, success: boolean) {
    await this.log({
      timestamp: new Date(),
      userId,
      action: 'LOGIN',
      resource: 'auth',
      ip,
      userAgent,
      success,
      severity: success ? 'low' : 'high',
    });
  }

  async logFailedAccess(
    userId: string,
    resource: string,
    reason: string,
    ip: string
  ) {
    await this.log({
      timestamp: new Date(),
      userId,
      action: 'ACCESS_DENIED',
      resource,
      ip,
      userAgent: 'N/A',
      success: false,
      errorMessage: reason,
      severity: 'critical',
    });
  }

  async getAuditTrail(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AuditLog[]> {
    const { data, error } = await this.supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data;
  }
}

export const auditLogger = new AuditLogger();
