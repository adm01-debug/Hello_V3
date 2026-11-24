import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Client } from "https://esm.sh/ldapts@9.3.1";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { GENERIC_INTERNAL_MESSAGE, getCorrelationId, internalErrorResponse } from '../_shared/errors.ts';

const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "fallback-key";
const SETTINGS_KEY = "ldap_config";
const MAX_ENTRIES = 5000;
const LDAP_TIMEOUT_MS = 15000;

interface LdapConfig {
  serverUrl: string;
  port: string;
  baseDn: string;
  bindDn: string;
  passwordEncrypted: string;
  useTLS: boolean;
  searchFilter: string;
  syncInterval: string;
  fieldMapping: {
    name: string;
    email: string;
    phone: string;
    company: string;
    position: string;
  };
}

const DEFAULT_CONFIG: LdapConfig = {
  serverUrl: "",
  port: "389",
  baseDn: "",
  bindDn: "",
  passwordEncrypted: "",
  useTLS: false,
  searchFilter: "(objectClass=person)",
  syncInterval: "60",
  fieldMapping: {
    name: "cn",
    email: "mail",
    phone: "telephoneNumber",
    company: "company",
    position: "title",
  },
};

// Credencial do bind protegida com o mesmo esquema já usado em voip_trunks.sip_password_encrypted.
function xorCipher(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const key = new TextEncoder().encode(SERVICE_KEY);
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) out[i] = bytes[i] ^ key[i % key.length];
  return btoa(String.fromCharCode(...out));
}

function xorDecipher(cipher: string): string {
  const bytes = Uint8Array.from(atob(cipher), (c) => c.charCodeAt(0));
  const key = new TextEncoder().encode(SERVICE_KEY);
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) out[i] = bytes[i] ^ key[i % key.length];
  return new TextDecoder().decode(out);
}

function normalize(value: unknown): string {
  if (value == null) return "";
  if (Array.isArray(value)) return value.length ? String(value[0]) : "";
  return String(value);
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  // Valor vem de audit_logs interno, nunca do corpo da requisicao.
  const parsed = typeof value === "number" ? value : parseInt(String(value ?? ""), 10); // safe-numeric-ok
  return isFinite(parsed) ? parsed : fallback;
}

function ldapUrl(config: LdapConfig): string {
  const scheme = config.useTLS ? "ldaps" : "ldap";
  const host = config.serverUrl.replace(/^ldaps?:\/\//i, "").replace(/\/.*$/, "");
  const port = config.port || (config.useTLS ? "636" : "389");
  return `${scheme}://${host}:${port}`;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} excedeu ${ms}ms`)), ms)),
  ]);
}

function json(body: unknown, cors: Record<string, string>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// deno-lint-ignore no-explicit-any
async function loadConfig(admin: any): Promise<LdapConfig> {
  const { data } = await admin.from("system_settings").select("value").eq("key", SETTINGS_KEY).maybeSingle();
  if (!data?.value) return { ...DEFAULT_CONFIG };
  const stored = data.value as Partial<LdapConfig>;
  return {
    ...DEFAULT_CONFIG,
    ...stored,
    fieldMapping: { ...DEFAULT_CONFIG.fieldMapping, ...(stored.fieldMapping ?? {}) },
  };
}

async function connect(config: LdapConfig): Promise<Client> {
  if (!config.serverUrl || !config.baseDn) {
    throw new Error("Servidor LDAP e Base DN são obrigatórios");
  }
  const client = new Client({
    url: ldapUrl(config),
    timeout: LDAP_TIMEOUT_MS,
    connectTimeout: LDAP_TIMEOUT_MS,
    tlsOptions: config.useTLS ? { rejectUnauthorized: !Deno.env.get("LDAP_ALLOW_SELF_SIGNED") } : undefined,
  });
  const password = config.passwordEncrypted ? xorDecipher(config.passwordEncrypted) : "";
  if (config.bindDn) {
    await withTimeout(client.bind(config.bindDn, password), LDAP_TIMEOUT_MS, "Bind LDAP");
  } else {
    await withTimeout(client.bind("", ""), LDAP_TIMEOUT_MS, "Conexão anônima LDAP");
  }
  return client;
}

interface SyncCounters {
  synced: number;
  created: number;
  updated: number;
  failed: number;
}

async function recordAudit(
  // deno-lint-ignore no-explicit-any
  admin: any,
  userId: string,
  userEmail: string | null,
  status: "success" | "partial" | "error",
  counters: SyncCounters,
  durationMs: number,
  error?: string,
): Promise<void> {
  await admin.from("audit_logs").insert({
    user_id: userId,
    user_email: userEmail,
    action: "LDAP_SYNC",
    resource_type: "integration",
    resource_id: "ldap",
    details: { status, ...counters, durationMs, error: error ?? null },
  });
}

serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Não autorizado" }, cors, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return json({ error: "Não autorizado" }, cors, 401);

    const admin = createClient(supabaseUrl, SERVICE_KEY);

    const { data: isAdminRpc, error: rpcError } = await supabase.rpc("is_admin_user", { _user_id: user.id });
    let isAdmin = !rpcError && isAdminRpc === true;
    if (!isAdmin) {
      const { data: roleRow } = await admin
        .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").eq("is_active", true).maybeSingle();
      isAdmin = !!roleRow;
    }
    if (!isAdmin) return json({ error: "Acesso restrito a administradores" }, cors, 403);

    const body = await req.json().catch(() => ({}));
    const action = (body.action as string) ?? "get-config";

    if (action === "get-config") {
      const config = await loadConfig(admin);
      const { passwordEncrypted: _pw, ...safe } = config;
      return json({ config: { ...safe, hasPassword: !!_pw } }, cors);
    }

    if (action === "save-config") {
      const incoming = body.config as Partial<LdapConfig> | undefined;
      if (!incoming) return json({ error: "config é obrigatório" }, cors, 400);
      const current = await loadConfig(admin);
      const next: LdapConfig = {
        ...current,
        ...incoming,
        passwordEncrypted: incoming.passwordEncrypted ?? current.passwordEncrypted,
        fieldMapping: { ...current.fieldMapping, ...(incoming.fieldMapping ?? {}) },
      };
      const { error } = await admin
        .from("system_settings")
        .upsert(
          {
            key: SETTINGS_KEY,
            value: next,
            description: "Configuração de sincronização LDAP",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" },
        );
      if (error) throw error;
      const { passwordEncrypted: _pw, ...safe } = next;
      return json({ saved: true, config: { ...safe, hasPassword: !!_pw } }, cors);
    }

    if (action === "test-connection") {
      const config = await loadConfig(admin);
      const started = Date.now();
      let client: Client | null = null;
      try {
        client = await connect(config);
        const { searchEntries } = await withTimeout(
          client.search(config.baseDn, { scope: "sub", filter: config.searchFilter, sizeLimit: 1 }),
          LDAP_TIMEOUT_MS,
          "Busca LDAP",
        );
        return json({ ok: true, entriesVisible: searchEntries.length, latencyMs: Date.now() - started }, cors);
      } catch (error) {
        return json({ ok: false, code: 'internal_error', message: GENERIC_INTERNAL_MESSAGE, correlation_id: getCorrelationId(req) }, cors);
      } finally {
        if (client) await client.unbind().catch(() => {});
      }
    }

    if (action === "list-logs") {
      const { data, error } = await admin
        .from("audit_logs")
        .select("id, created_at, details")
        .eq("action", "LDAP_SYNC")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      const logs = (data ?? []).map((row) => {
        const details = (row.details ?? {}) as Record<string, unknown>;
        return {
          id: row.id as string,
          timestamp: row.created_at as string,
          status: (details.status as string) ?? "error",
          contactsSynced: toFiniteNumber(details.synced),
          contactsCreated: toFiniteNumber(details.created),
          contactsUpdated: toFiniteNumber(details.updated),
          contactsFailed: toFiniteNumber(details.failed),
          duration: `${(toFiniteNumber(details.durationMs) / 1000).toFixed(1)}s`,
          error: (details.error as string) ?? undefined,
        };
      });
      return json({ logs }, cors);
    }

    if (action === "sync") {
      const config = await loadConfig(admin);
      const started = Date.now();
      const counters: SyncCounters = { synced: 0, created: 0, updated: 0, failed: 0 };
      let client: Client | null = null;

      try {
        client = await connect(config);
        const attributes = [
          config.fieldMapping.name,
          config.fieldMapping.email,
          config.fieldMapping.phone,
          config.fieldMapping.company,
          config.fieldMapping.position,
        ].filter((a, i, arr) => a && arr.indexOf(a) === i);

        const { searchEntries } = await withTimeout(
          client.search(config.baseDn, {
            scope: "sub",
            filter: config.searchFilter,
            attributes,
            sizeLimit: MAX_ENTRIES,
          }),
          LDAP_TIMEOUT_MS,
          "Busca LDAP",
        );

        if (searchEntries.length >= MAX_ENTRIES) {
          await recordAudit(admin, user.id, user.email ?? null, "partial", counters, Date.now() - started,
            `Limite de ${MAX_ENTRIES} entradas atingido; refine o filtro de busca`);
        }

        const parsed = searchEntries
          .map((entry) => ({
            externalId: normalize(entry.dn),
            name: normalize(entry[config.fieldMapping.name]),
            email: normalize(entry[config.fieldMapping.email]),
            phone: normalize(entry[config.fieldMapping.phone]),
            company: normalize(entry[config.fieldMapping.company]),
            position: normalize(entry[config.fieldMapping.position]),
          }))
          .filter((c) => c.externalId && c.name);

        if (parsed.length) {
          const externalIds = parsed.map((c) => c.externalId);
          const existing = new Map<string, string>();
          for (let i = 0; i < externalIds.length; i += 500) {
            const chunk = externalIds.slice(i, i + 500);
            const { data: rows } = await admin
              .from("contacts").select("id, external_id").eq("source", "ldap").in("external_id", chunk);
            for (const row of rows ?? []) existing.set(row.external_id as string, row.id as string);
          }

          const toInsert: Record<string, unknown>[] = [];
          const now = new Date().toISOString();
          for (const contact of parsed) {
            const payload = {
              name: contact.name,
              email: contact.email || null,
              phone: contact.phone || null,
              company: contact.company || null,
              position: contact.position || null,
              source: "ldap",
              external_id: contact.externalId,
              updated_at: now,
            };
            const existingId = existing.get(contact.externalId);
            if (existingId) {
              const { error } = await admin.from("contacts").update(payload).eq("id", existingId);
              if (error) counters.failed++; else counters.updated++;
            } else {
              toInsert.push({ ...payload, created_at: now, version: 1 });
            }
          }

          for (let i = 0; i < toInsert.length; i += 200) {
            const chunk = toInsert.slice(i, i + 200);
            const { error } = await admin.from("contacts").insert(chunk);
            if (error) counters.failed += chunk.length; else counters.created += chunk.length;
          }
          counters.synced = counters.created + counters.updated;
        }

        const status = counters.failed > 0 ? "partial" : "success";
        await recordAudit(admin, user.id, user.email ?? null, status, counters, Date.now() - started);
        return json({ ok: true, status, ...counters, durationMs: Date.now() - started }, cors);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await recordAudit(admin, user.id, user.email ?? null, "error", counters, Date.now() - started, message);
        return json({ ok: false, code: 'internal_error', message: GENERIC_INTERNAL_MESSAGE, correlation_id: getCorrelationId(req), ...counters }, cors, 502);
      } finally {
        if (client) await client.unbind().catch(() => {});
      }
    }

    if (action === "encrypt-password") {
      const password = (body.password as string) ?? "";
      return json({ passwordEncrypted: password ? xorCipher(password) : "" }, cors);
    }

    return json({ error: `Ação desconhecida: ${action}` }, cors, 400);
  } catch (error) {
    console.error("ldap-sync error:", error);
    return internalErrorResponse(error, getCorrelationId(req), cors, { fn: 'ldap-sync' });
  }
});
