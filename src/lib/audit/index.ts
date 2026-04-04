/**
 * Audit logging utility for structured audit events.
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from '@/lib/logger';

export type AuditAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "login"
  | "logout"
  | "export"
  | "import"
  | "view"
  | "search"
  | "transfer"
  | "hold"
  | "unhold";

export interface AuditEvent {
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
}

export async function logAuditEvent(event: AuditEvent): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc("log_audit_event", {
      p_action: event.action,
      p_resource_type: event.resourceType,
      p_resource_id: event.resourceId ?? undefined,
      p_details: (event.details || {}) as unknown as import("@/integrations/supabase/types").Json,
    });

    if (error) {
      logger.error("Audit log error:", error);
      return null;
    }

    return data as string;
  } catch (err) {
    logger.error("Failed to log audit event:", err);
    return null;
  }
}

export function createAuditLogger(resourceType: string) {
  return {
    create: (resourceId: string, details?: Record<string, unknown>) =>
      logAuditEvent({ action: "create", resourceType, resourceId, details }),
    read: (resourceId: string) =>
      logAuditEvent({ action: "read", resourceType, resourceId }),
    update: (resourceId: string, details?: Record<string, unknown>) =>
      logAuditEvent({ action: "update", resourceType, resourceId, details }),
    delete: (resourceId: string) =>
      logAuditEvent({ action: "delete", resourceType, resourceId }),
    export: (details?: Record<string, unknown>) =>
      logAuditEvent({ action: "export", resourceType, details }),
  };
}
