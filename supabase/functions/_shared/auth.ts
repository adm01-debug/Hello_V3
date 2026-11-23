/**
 * Autenticacao compartilhada das edge functions.
 *
 * Antes desta etapa cada funcao que verificava o chamador reimplementava a
 * checagem — e seis nao verificavam nada (achados A-013 a A-017). Aqui ficam os
 * tres casos que as funcoes realmente precisam: usuario logado, usuario logado
 * com papel especifico e chamador de cron com token dedicado.
 *
 * O cliente que as funcoes recebem e criado com `SUPABASE_ANON_KEY` + o
 * `Authorization` do chamador, de proposito: e ele que faz a RLS valer.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { SupabaseClient, User } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "./cors.ts";
import { createErrorResponse } from "./validator.ts";
import { mesmaString } from "./constant-time.ts";

export type AuthContext = {
  user: User;
  supabase: SupabaseClient;
};

export type RoleContext = AuthContext & { role: string };

function unauthorized(req: Request, message = 'Não autorizado'): Response {
  return createErrorResponse(message, 'UNAUTHORIZED', undefined, 401, buildCorsHeaders(req));
}

/** Usuario autenticado, ou `Response` 401 pronta para devolver. */
export async function requireUser(req: Request): Promise<AuthContext | Response> {
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) return unauthorized(req);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !anonKey) {
    return createErrorResponse('Autenticação indisponível', 'AUTH_UNAVAILABLE', undefined, 500, buildCorsHeaders(req));
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return unauthorized(req);

  return { user, supabase };
}

/** `true` quando o papel efetivo do usuario esta na lista pedida. */
export function roleAllowed(role: string | null | undefined, roles: string[]): boolean {
  if (!role) return false;
  return roles.includes(role);
}

/**
 * Usuario autenticado E com um dos papeis pedidos, ou `Response` 401/403 pronta.
 *
 * O papel vem da RPC `get_user_role()` e nao de leitura direta de `user_roles`:
 * a RPC ja honra `is_active` e `expires_at` (migration 20261122250000). O claim
 * do JWT tambem nao serve como fonte — ele pode estar velho.
 */
export async function requireRole(req: Request, roles: string[]): Promise<RoleContext | Response> {
  const ctx = await requireUser(req);
  if (ctx instanceof Response) return ctx;

  const { data: role, error } = await ctx.supabase.rpc('get_user_role');
  if (error) {
    return createErrorResponse('Não foi possível verificar o papel do usuário', 'ROLE_LOOKUP_FAILED', undefined, 500, buildCorsHeaders(req));
  }

  const effective = typeof role === 'string' ? role : null;
  if (!roleAllowed(effective, roles)) {
    return createErrorResponse('Acesso negado', 'FORBIDDEN', undefined, 403, buildCorsHeaders(req));
  }

  return { ...ctx, role: effective as string };
}

/**
 * Chamador de cron: o bearer tem que ser exatamente `Bearer <segredo do env>`.
 * Comparacao em tempo constante para nao vazar o prefixo do token por timing.
 */
export async function requireCronToken(req: Request, envName: string): Promise<true | Response> {
  const expected = Deno.env.get(envName);
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!expected || !mesmaString(authHeader, `Bearer ${expected}`)) return unauthorized(req);
  return true;
}
