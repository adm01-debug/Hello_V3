import type { BrowserContext, Page } from '@playwright/test';

/**
 * Semeia uma sessão Supabase autenticada no localStorage do contexto Playwright.
 *
 * Estratégia:
 * 1. Se `E2E_SUPABASE_SESSION_JSON` estiver presente no ambiente, usa a sessão pré-mintada
 *    (formato oficial do supabase-js: `{ access_token, refresh_token, user, expires_at, ... }`).
 * 2. Caso contrário, tenta autenticar via `E2E_ADMIN_EMAIL` + `E2E_ADMIN_PASSWORD` chamando
 *    diretamente o endpoint `/auth/v1/token?grant_type=password` da instância configurada.
 * 3. Sem credenciais utilizáveis, retorna `false` — o teste chamador deve `test.skip()`.
 *
 * A chave de storage segue o padrão `sb-<project-ref>-auth-token` que o supabase-js lê no boot.
 */
export interface SeedAdminSessionOptions {
  supabaseUrl?: string;
  publishableKey?: string;
  projectRef?: string;
  origin?: string;
}

export async function seedAdminSession(
  context: BrowserContext,
  page: Page,
  opts: SeedAdminSessionOptions = {},
): Promise<boolean> {
  const supabaseUrl = opts.supabaseUrl ?? process.env.VITE_SUPABASE_URL ?? process.env.E2E_SUPABASE_URL;
  const publishableKey =
    opts.publishableKey ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.E2E_SUPABASE_ANON_KEY;
  const projectRef =
    opts.projectRef ?? process.env.VITE_SUPABASE_PROJECT_ID ?? extractRef(supabaseUrl);

  if (!supabaseUrl || !publishableKey || !projectRef) return false;

  const storageKey = `sb-${projectRef}-auth-token`;
  let sessionJson: string | undefined;

  // Prefere o login vivo por email/senha: a sessao pre-mintada
  // (E2E_SUPABASE_SESSION_JSON) expira em ~1h e, expirada, faz o app
  // redirecionar para /login. O login por credenciais devolve sempre um
  // access_token novo, mantendo o CI estavel sem re-mintar secret.
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  // Sessao pre-mintada como fallback (expira ~1h, nao usar como base).
  const preMintedSession = process.env.E2E_SUPABASE_SESSION_JSON;
  if (email && password) {
    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          apikey: publishableKey,
          Authorization: `Bearer ${publishableKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) sessionJson = await res.text();
    } catch {
      /* tenta a sessao pre-mintada abaixo */
    }
  }
  if (!sessionJson) sessionJson = preMintedSession;
  if (!sessionJson) return false;

  const origin = opts.origin ?? 'http://localhost:5173';
  // Precisa estabelecer o origin antes de escrever no localStorage.
  await page.goto(origin);
  await page.evaluate(
    ([key, value]) => {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        /* ignore */
      }
    },
    [storageKey, sessionJson] as const,
  );
  return true;
}

function extractRef(url?: string): string | undefined {
  if (!url) return undefined;
  const m = url.match(/https?:\/\/([a-z0-9]+)\.supabase\.co/i);
  return m?.[1];
}
