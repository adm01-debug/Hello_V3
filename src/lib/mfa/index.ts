/**
 * MFA utilities for multi-factor authentication management.
 */

import { supabase } from "@/integrations/supabase/client";

export interface MFAStatus {
  enabled: boolean;
  method: string | null;
  lastVerified: string | null;
  hasBackupCodes: boolean;
}

export async function getMFAStatus(userId: string): Promise<MFAStatus> {
  const { data } = await supabase
    .from("user_mfa_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) {
    return { enabled: false, method: null, lastVerified: null, hasBackupCodes: false };
  }

  return {
    enabled: data.mfa_enabled || false,
    method: data.mfa_method,
    lastVerified: data.last_verified_at,
    hasBackupCodes: (data.backup_codes?.length || 0) > 0,
  };
}

export function generateBackupCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const array = new Uint8Array(4);
    crypto.getRandomValues(array);
    const code = Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

export function formatBackupCode(code: string): string {
  return code.replace(/(.{4})/g, "$1-").slice(0, -1);
}
