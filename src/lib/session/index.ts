/**
 * Session management utilities.
 */

import { supabase } from "@/integrations/supabase/client";

export interface SessionInfo {
  id: string;
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceInfo: Record<string, unknown> | null;
  isActive: boolean;
  lastActivity: string | null;
  createdAt: string | null;
}

export async function getActiveSessions(userId: string): Promise<SessionInfo[]> {
  const { data } = await supabase
    .from("active_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("last_activity_at", { ascending: false });

  if (!data) return [];

  return data.map((s) => ({
    id: s.id,
    userId: s.user_id,
    ipAddress: s.ip_address,
    userAgent: s.user_agent,
    deviceInfo: s.device_info as Record<string, unknown> | null,
    isActive: s.is_active || false,
    lastActivity: s.last_activity_at,
    createdAt: s.created_at,
  }));
}

export async function terminateSession(sessionId: string): Promise<boolean> {
  const { error } = await supabase
    .from("active_sessions")
    .update({ is_active: false })
    .eq("id", sessionId);

  return !error;
}

export async function terminateAllOtherSessions(
  userId: string,
  currentSessionId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("active_sessions")
    .update({ is_active: false })
    .eq("user_id", userId)
    .neq("id", currentSessionId);

  return !error;
}

export function getSessionTimeout(): number {
  return 30 * 60 * 1000; // 30 minutes default
}
