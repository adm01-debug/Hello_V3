import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { handler, recordKb } from "../index.ts";

const URL_FN = "http://localhost/embed-kb-article";

Deno.test("embed-kb-article: sem header Authorization devolve 401", async () => {
  const resp = await handler(new Request(URL_FN, { method: "POST", body: "{}" }));
  assertEquals(resp.status, 401);
  const body = await resp.json();
  assertEquals(body.code, "UNAUTHORIZED");
});

Deno.test("embed-kb-article: preflight OPTIONS responde com CORS da origem permitida", async () => {
  const resp = await handler(
    new Request(URL_FN, {
      method: "OPTIONS",
      headers: { Origin: "http://localhost:8080", "Access-Control-Request-Method": "POST" },
    }),
  );
  assertEquals(resp.status, 200);
  assert(resp.headers.get("access-control-allow-origin"));
});

Deno.test("embed-kb-article: recordKb exige record.id em formato UUID", () => {
  const ok = recordKb({ id: "3f9d2b70-2f47-4f0a-9a5e-0f0f0f0f0f0f", title: "Como emitir NF" });
  assert(ok.ok);
  assertEquals(ok.ok ? ok.data.title : null, "Como emitir NF");

  const semId = recordKb({ title: "sem id" });
  assert(!semId.ok);
  const idInvalido = recordKb({ id: "123" });
  assert(!idInvalido.ok);
  assert(!idInvalido.ok && idInvalido.error.startsWith("id:"));
  const naoObjeto = recordKb("texto");
  assert(!naoObjeto.ok);
});
