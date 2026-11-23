import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { requireUser, requireRole, requireCronToken, roleAllowed } from "../auth.ts";

const URL_ = "https://cfmlmcdyjuotqobjapng.supabase.co/functions/v1/exemplo";

function req(headers: Record<string, string> = {}): Request {
  return new Request(URL_, { method: "POST", headers });
}

async function corpo(res: Response): Promise<{ code: string; message: string }> {
  return await res.json();
}

Deno.test("auth: requireUser sem header Authorization devolve 401", async () => {
  const res = await requireUser(req());
  assert(res instanceof Response);
  assertEquals(res.status, 401);
  assertEquals((await corpo(res)).code, "UNAUTHORIZED");
});

Deno.test("auth: requireUser com header que nao e Bearer devolve 401", async () => {
  const res = await requireUser(req({ Authorization: "Basic Zm9vOmJhcg==" }));
  assert(res instanceof Response);
  assertEquals(res.status, 401);
  assertEquals((await corpo(res)).code, "UNAUTHORIZED");
});

Deno.test("auth: header Bearer vazio devolve 401", async () => {
  const res = await requireUser(req({ Authorization: "Bearer " }));
  assert(res instanceof Response);
  assertEquals(res.status, 401);
});

Deno.test("auth: erro de credencial devolve o envelope com CORS da origem do chamador", async () => {
  const res = await requireUser(new Request(URL_, {
    method: "POST",
    headers: { Origin: "https://hello-v3.vercel.app" },
  }));
  assert(res instanceof Response);
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), "https://hello-v3.vercel.app");
  assertEquals(res.headers.get("Content-Type"), "application/json");
});

Deno.test("auth: sem SUPABASE_URL/SUPABASE_ANON_KEY no ambiente devolve 500 e nao chama a rede", async () => {
  const urlAntes = Deno.env.get("SUPABASE_URL");
  const keyAntes = Deno.env.get("SUPABASE_ANON_KEY");
  Deno.env.delete("SUPABASE_URL");
  Deno.env.delete("SUPABASE_ANON_KEY");
  try {
    const res = await requireUser(req({ Authorization: "Bearer token-qualquer" }));
    assert(res instanceof Response);
    assertEquals(res.status, 500);
    assertEquals((await corpo(res)).code, "AUTH_UNAVAILABLE");
  } finally {
    if (urlAntes) Deno.env.set("SUPABASE_URL", urlAntes);
    if (keyAntes) Deno.env.set("SUPABASE_ANON_KEY", keyAntes);
  }
});

Deno.test("auth: requireRole delega a autenticacao e recusa sem credencial", async () => {
  const res = await requireRole(req(), ["admin"]);
  assert(res instanceof Response);
  assertEquals(res.status, 401);
});

Deno.test("auth: roleAllowed so aceita papel presente na lista", () => {
  assertEquals(roleAllowed("admin", ["admin", "supervisor"]), true);
  assertEquals(roleAllowed("supervisor", ["admin", "supervisor"]), true);
  assertEquals(roleAllowed("agent", ["admin", "supervisor"]), false);
  assertEquals(roleAllowed("Admin", ["admin"]), false);
  assertEquals(roleAllowed(null, ["admin"]), false);
  assertEquals(roleAllowed(undefined, ["admin"]), false);
  assertEquals(roleAllowed("", ["admin"]), false);
  assertEquals(roleAllowed("admin", []), false);
});

Deno.test("auth: requireCronToken aceita apenas o bearer exato do env", async () => {
  const antes = Deno.env.get("TESTE_CRON_TOKEN");
  Deno.env.set("TESTE_CRON_TOKEN", "segredo-do-cron-123456");
  try {
    const ok = await requireCronToken(req({ Authorization: "Bearer segredo-do-cron-123456" }), "TESTE_CRON_TOKEN");
    assertEquals(ok, true);

    const semPrefixo = await requireCronToken(req({ Authorization: "segredo-do-cron-123456" }), "TESTE_CRON_TOKEN");
    assert(semPrefixo instanceof Response);
    assertEquals(semPrefixo.status, 401);

    const errado = await requireCronToken(req({ Authorization: "Bearer segredo-do-cron-123457" }), "TESTE_CRON_TOKEN");
    assert(errado instanceof Response);
    assertEquals(errado.status, 401);

    const truncado = await requireCronToken(req({ Authorization: "Bearer segredo" }), "TESTE_CRON_TOKEN");
    assert(truncado instanceof Response);
    assertEquals(truncado.status, 401);

    const semHeader = await requireCronToken(req(), "TESTE_CRON_TOKEN");
    assert(semHeader instanceof Response);
    assertEquals(semHeader.status, 401);
  } finally {
    if (antes) Deno.env.set("TESTE_CRON_TOKEN", antes);
    else Deno.env.delete("TESTE_CRON_TOKEN");
  }
});

Deno.test("auth: requireCronToken sem a env configurada recusa tudo", async () => {
  const antes = Deno.env.get("TESTE_CRON_AUSENTE");
  Deno.env.delete("TESTE_CRON_AUSENTE");
  try {
    const res = await requireCronToken(req({ Authorization: "Bearer qualquer-coisa" }), "TESTE_CRON_AUSENTE");
    assert(res instanceof Response);
    assertEquals(res.status, 401);
  } finally {
    if (antes) Deno.env.set("TESTE_CRON_AUSENTE", antes);
  }
});
