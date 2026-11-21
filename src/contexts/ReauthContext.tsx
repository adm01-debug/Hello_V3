/* eslint-disable react-refresh/only-export-components -- provider and hook deliberately share this module */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { logger } from "@/lib/logger";

export type ReauthAction =
  | "change_password"
  | "change_email"
  | "configure_mfa"
  | "admin_action"
  | "delete_account"
  | "export_data"
  | "revoke_sessions";

/** Janela em que uma verificacao recente dispensa nova confirmacao. */
export const REAUTH_TIMEOUT_MS = 5 * 60 * 1000;
/** TTL do grant assinado persistido em sessionStorage. */
export const REAUTH_GRANT_TTL_MS = REAUTH_TIMEOUT_MS;

const GRANT_PREFIX = "reauth_grant";
const NONCE_PREFIX = "reauth_nonce";
const UNSIGNED = "unsigned";

export interface VerificationGrant {
  userId: string;
  action: ReauthAction | null;
  verifiedAt: number;
  expiresAt: number;
  nonce: string;
  signature: string;
}

type PendingCallback = () => void | Promise<void>;

interface ReauthContextType {
  isRequired: boolean;
  action: ReauthAction | null;
  isVerifying: boolean;
  lastVerified: Date | null;
  needsReauth: (action: ReauthAction) => boolean;
  requestReauth: (action: ReauthAction) => boolean;
  verifyWithPassword: (password: string) => Promise<boolean>;
  verifyWithMFA: (factorId: string, code: string) => Promise<boolean>;
  cancelReauth: () => void;
  withReauth: <T>(action: ReauthAction, callback: () => Promise<T>) => Promise<T | null>;
}

const ReauthContext = createContext<ReauthContextType | undefined>(undefined);

function safeSession(): Storage | null {
  try {
    if (typeof window === "undefined" || !window.sessionStorage) return null;
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * HMAC-SHA256 do payload com uma chave derivada da sessao do navegador.
 * Serve como prova de integridade local (detecta edicao manual do grant);
 * a barreira de seguranca real continua sendo signInWithPassword / MFA no servidor.
 */
async function signPayload(payload: string, keyMaterial: string): Promise<string> {
  const subtle = typeof crypto !== "undefined" ? crypto.subtle : undefined;
  if (!subtle || typeof subtle.importKey !== "function" || typeof subtle.sign !== "function") {
    return UNSIGNED;
  }
  try {
    const key = await subtle.importKey(
      "raw",
      new TextEncoder().encode(keyMaterial),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signature = await subtle.sign("HMAC", key, new TextEncoder().encode(payload));
    return toHex(new Uint8Array(signature));
  } catch {
    return UNSIGNED;
  }
}

function sessionNonce(userId: string): string {
  const storage = safeSession();
  const key = `${NONCE_PREFIX}:${userId}`;
  const existing = storage?.getItem(key);
  if (existing) return existing;

  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  const nonce = toHex(bytes);
  try {
    storage?.setItem(key, nonce);
  } catch {
    /* sessionStorage indisponivel: grant fica so em memoria */
  }
  return nonce;
}

function grantPayload(userId: string, action: ReauthAction | null, verifiedAt: number, expiresAt: number, nonce: string): string {
  return `${userId}|${action ?? "none"}|${verifiedAt}|${expiresAt}|${nonce}`;
}

async function writeGrant(userId: string, action: ReauthAction | null, verifiedAt: Date): Promise<void> {
  const storage = safeSession();
  if (!storage) return;
  const nonce = sessionNonce(userId);
  const verifiedAtMs = verifiedAt.getTime();
  const expiresAt = verifiedAtMs + REAUTH_GRANT_TTL_MS;
  const signature = await signPayload(grantPayload(userId, action, verifiedAtMs, expiresAt, nonce), `${userId}:${nonce}`);
  const grant: VerificationGrant = { userId, action, verifiedAt: verifiedAtMs, expiresAt, nonce, signature };
  try {
    storage.setItem(`${GRANT_PREFIX}:${userId}`, JSON.stringify(grant));
  } catch {
    /* quota cheia: segue sem persistir */
  }
}

async function readGrant(userId: string): Promise<VerificationGrant | null> {
  const storage = safeSession();
  if (!storage) return null;
  let raw: string | null = null;
  try {
    raw = storage.getItem(`${GRANT_PREFIX}:${userId}`);
  } catch {
    return null;
  }
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as VerificationGrant;
    if (!parsed || parsed.userId !== userId) return null;
    if (typeof parsed.expiresAt !== "number" || parsed.expiresAt <= Date.now()) {
      storage.removeItem(`${GRANT_PREFIX}:${userId}`);
      return null;
    }
    if (parsed.signature !== UNSIGNED) {
      const expected = await signPayload(
        grantPayload(userId, parsed.action ?? null, parsed.verifiedAt, parsed.expiresAt, parsed.nonce),
        `${userId}:${parsed.nonce}`,
      );
      if (expected !== parsed.signature) {
        logger.warn("reauth grant com assinatura invalida — descartado");
        storage.removeItem(`${GRANT_PREFIX}:${userId}`);
        return null;
      }
    }
    return parsed;
  } catch {
    return null;
  }
}

function clearGrant(userId: string): void {
  const storage = safeSession();
  try {
    storage?.removeItem(`${GRANT_PREFIX}:${userId}`);
  } catch {
    /* noop */
  }
}

export function ReauthProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthContext();
  const userId = user?.id ?? null;
  const [lastVerified, setLastVerified] = useState<Date | null>(null);
  const [isRequired, setIsRequired] = useState(false);
  const [action, setAction] = useState<ReauthAction | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const pendingRef = useRef<PendingCallback | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setLastVerified(null);
      setIsRequired(false);
      setAction(null);
      pendingRef.current = null;
      return;
    }
    void readGrant(userId).then((grant) => {
      if (cancelled || !grant) return;
      setLastVerified(new Date(grant.verifiedAt));
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const needsReauth = useCallback(
    (_action: ReauthAction): boolean => {
      if (!lastVerified) return true;
      return Date.now() - lastVerified.getTime() > REAUTH_TIMEOUT_MS;
    },
    [lastVerified],
  );

  const requestReauth = useCallback(
    (next: ReauthAction): boolean => {
      if (needsReauth(next)) {
        setIsRequired(true);
        setAction(next);
        return true;
      }
      return false;
    },
    [needsReauth],
  );

  const settleVerification = useCallback(
    async (verifiedAction: ReauthAction | null) => {
      const now = new Date();
      setLastVerified(now);
      setIsRequired(false);
      setAction(null);
      if (userId) await writeGrant(userId, verifiedAction, now);

      const pending = pendingRef.current;
      pendingRef.current = null;
      if (pending) {
        try {
          await pending();
        } catch (error) {
          logger.error("Falha ao executar acao pendente apos reauth", error);
        }
      }
    },
    [userId],
  );

  const verifyWithPassword = useCallback(
    async (password: string): Promise<boolean> => {
      if (!user?.email) return false;
      setIsVerifying(true);
      try {
        const { error } = await supabase.auth.signInWithPassword({ email: user.email, password });
        if (error) return false;
        await settleVerification(action);
        return true;
      } catch {
        return false;
      } finally {
        setIsVerifying(false);
      }
    },
    [user?.email, action, settleVerification],
  );

  const verifyWithMFA = useCallback(
    async (factorId: string, code: string): Promise<boolean> => {
      setIsVerifying(true);
      try {
        const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
        if (challengeError) return false;

        const { error: verifyError } = await supabase.auth.mfa.verify({
          factorId,
          challengeId: challengeData.id,
          code,
        });
        if (verifyError) return false;

        await settleVerification(action);
        return true;
      } catch {
        return false;
      } finally {
        setIsVerifying(false);
      }
    },
    [action, settleVerification],
  );

  const cancelReauth = useCallback(() => {
    pendingRef.current = null;
    setIsRequired(false);
    setAction(null);
  }, []);

  const withReauth = useCallback(
    <T,>(next: ReauthAction, callback: () => Promise<T>): Promise<T | null> => {
      if (needsReauth(next)) {
        pendingRef.current = async () => {
          await callback();
        };
        setIsRequired(true);
        setAction(next);
        return Promise.resolve(null);
      }
      return callback();
    },
    [needsReauth],
  );

  const value = useMemo<ReauthContextType>(
    () => ({
      isRequired,
      action,
      isVerifying,
      lastVerified,
      needsReauth,
      requestReauth,
      verifyWithPassword,
      verifyWithMFA,
      cancelReauth,
      withReauth,
    }),
    [
      isRequired,
      action,
      isVerifying,
      lastVerified,
      needsReauth,
      requestReauth,
      verifyWithPassword,
      verifyWithMFA,
      cancelReauth,
      withReauth,
    ],
  );

  return <ReauthContext.Provider value={value}>{children}</ReauthContext.Provider>;
}

export function useReauthContext(): ReauthContextType {
  const context = useContext(ReauthContext);
  if (context === undefined) {
    throw new Error("useReauthContext must be used within a ReauthProvider");
  }
  return context;
}

export { clearGrant };