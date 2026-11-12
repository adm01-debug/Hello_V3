import type { Page } from '@playwright/test';

/**
 * Decide se o spec deve ser pulado por falta de sessão admin real.
 *
 * O guard antigo checava `page.url()` sincronamente logo após `page.goto()`,
 * mas a SPA usa React Router: o redirect para /login acontece client-side, um
 * tick depois do goto. Nesse instante a URL ainda é o destino original e o
 * `test.skip` não disparava, deixando os testes rodarem deslogados no CI.
 *
 * Aqui aguardamos o redirect resolver (ou a rota protegida confirmar) antes
 * de decidir o skip, eliminando a race.
 */
export async function shouldSkipNoSession(page: Page, seeded: boolean): Promise<boolean> {
  if (seeded) return false;

  const redirectedToLogin = await page
    .waitForURL(/(\/login|\/auth)/, { timeout: 5000 })
    .then(() => true)
    .catch(() => false);

  return redirectedToLogin || /^\/(login|auth)/.test(new URL(page.url()).pathname);
}

/** True quando há credenciais/credenciais+sessão suficientes para rodar de verdade. */
export function hasAdminCredentials(): boolean {
  return Boolean(
    process.env.E2E_SUPABASE_SESSION_JSON ||
      (process.env.E2E_ADMIN_EMAIL && process.env.E2E_ADMIN_PASSWORD),
  );
}
