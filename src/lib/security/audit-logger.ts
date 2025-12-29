import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_SERVICE_KEY!
);

type Severity = 'low' | 'medium' | 'high' | 'critical';

interface AuditLogEntry {
  user_id: string;
  action: string;
  resource: string;
  resource_id?: string;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
  severity: Severity;
  success: boolean;
}

class AuditLogger {
  private queue: AuditLogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 50;
  private readonly FLUSH_INTERVAL = 5000; // 5 seconds

  constructor() {
    this.startBatchProcessor();
  }

  private startBatchProcessor() {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL);
  }

  private async flush() {
    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, this.BATCH_SIZE);
    
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert(batch);

      if (error) {
        console.error('Failed to write audit logs:', error);
        // Re-queue failed logs
        this.queue.unshift(...batch);
      }
    } catch (error) {
      console.error('Audit log flush error:', error);
    }
  }

  private log(entry: Omit<AuditLogEntry, 'timestamp'>) {
    this.queue.push({
      ...entry,
      timestamp: new Date().toISOString(),
    });

    // Flush immediately for critical events
    if (entry.severity === 'critical') {
      this.flush();
    }
  }

  // Public logging methods
  logAccess(
    userId: string,
    resource: string,
    resourceId?: string,
    metadata?: Record<string, any>
  ) {
    this.log({
      user_id: userId,
      action: 'access',
      resource,
      resource_id: resourceId,
      metadata,
      severity: 'low',
      success: true,
    });
  }

  logModification(
    userId: string,
    resource: string,
    resourceId: string,
    changes: Record<string, any>
  ) {
    this.log({
      user_id: userId,
      action: 'modify',
      resource,
      resource_id: resourceId,
      metadata: { changes },
      severity: 'medium',
      success: true,
    });
  }

  logDeletion(
    userId: string,
    resource: string,
    resourceId: string,
    metadata?: Record<string, any>
  ) {
    this.log({
      user_id: userId,
      action: 'delete',
      resource,
      resource_id: resourceId,
      metadata,
      severity: 'high',
      success: true,
    });
  }

  logLogin(userId: string, ipAddress?: string, userAgent?: string, success = true) {
    this.log({
      user_id: userId,
      action: 'login',
      resource: 'auth',
      ip_address: ipAddress,
      user_agent: userAgent,
      severity: success ? 'low' : 'medium',
      success,
    });
  }

  logFailedAccess(
    userId: string,
    resource: string,
    reason: string,
    ipAddress?: string
  ) {
    this.log({
      user_id: userId,
      action: 'access_denied',
      resource,
      metadata: { reason },
      ip_address: ipAddress,
      severity: 'high',
      success: false,
    });
  }

  logSecurityEvent(
    userId: string,
    eventType: string,
    details: Record<string, any>
  ) {
    this.log({
      user_id: userId,
      action: eventType,
      resource: 'security',
      metadata: details,
      severity: 'critical',
      success: true,
    });
  }

  // Query audit trail
  async getAuditTrail(
    userId: string,
    options?: {
      startDate?: string;
      endDate?: string;
      actions?: string[];
      severity?: Severity[];
    }
  ) {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (options?.startDate) {
      query = query.gte('timestamp', options.startDate);
    }

    if (options?.endDate) {
      query = query.lte('timestamp', options.endDate);
    }

    if (options?.actions && options.actions.length > 0) {
      query = query.in('action', options.actions);
    }

    if (options?.severity && options.severity.length > 0) {
      query = query.in('severity', options.severity);
    }

    const { data, error } = await query.limit(1000);

    if (error) {
      throw new Error(`Failed to retrieve audit trail: ${error.message}`);
    }

    return data || [];
  }

  // Cleanup
  stop() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flush(); // Final flush
    }
  }
}

// Singleton instance
export const auditLogger = new AuditLogger();

// Express middleware
export const auditMiddleware = (req: any, res: any, next: any) => {
  const userId = req.user?.id || 'anonymous';
  const resource = req.baseUrl + req.path;
  
  auditLogger.logAccess(userId, resource, req.params.id, {
    method: req.method,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });
  
  next();
};

export default auditLogger;
