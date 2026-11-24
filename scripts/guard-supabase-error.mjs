#!/usr/bin/env node
/**
 * Guard: impede a volta das gravacoes cegas no cliente Supabase.
 *
 * Contexto (achados A-052/A-053): o cliente do Supabase NAO lanca excecao em erro
 * — `await supabase.from(...).insert(...)` sem desestruturar `error` sempre parece
 * ter funcionado, e o `try/catch` em volta tem `catch` inalcancavel. Depois de
 * corrigir 35 gravacoes cegas e 52 `catch` inuteis, nada impedia a proxima PR de
 * reintroduzir o padrao; este guard e esse freio.
 *
 * Regras em `src/**` (fora de testes):
 *   R1  `await supabase…insert|update|upsert|delete|rpc` cujo retorno nao expoe
 *       `error` (nem por desestruturacao, nem por `.error` no resultado guardado).
 *   R2  bloco `catch` que chama `toast.success` — afirma sucesso depois de falhar.
 *   R3  escrita embutida (sem `await`) dentro de `await Promise.all([...])` cujo
 *       resultado nao expoe `error`. Desestruturacao em array (`const [a, b] =`)
 *       e ignorada: ali cada elemento e conferido separadamente.
 *
 * Dispensa explicita: comentario `supabase-error-ok` na linha do achado ou nas
 * duas linhas anteriores, para os casos em que ignorar o erro e intencional.
 *
 * Uso:
 *   node scripts/guard-supabase-error.mjs          # relatorio
 *   node scripts/guard-supabase-error.mjs --check  # exit 1 se houver achado
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = "src";
const CHECK = process.argv.includes("--check");
const DISMISS = "supabase-error-ok";
const ESCRITAS = /\.\s*(insert|update|upsert|delete|rpc)\s*\(/;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "node_modules" || entry === "__tests__" || entry === "dist") continue;
      walk(full, out);
    } else if (/\.(ts|tsx)$/.test(entry) && !/\.(test|spec)\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

const blank = (s) => s.replace(/[^\n]/g, " ");

function stripCommentsAndStrings(src) {
  let out = "";
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    const c2 = src[i + 1];
    if (c === "/" && c2 === "*") {
      const end = src.indexOf("*/", i + 2);
      const stop = end === -1 ? n : end + 2;
      out += blank(src.slice(i, stop));
      i = stop;
    } else if (c === "/" && c2 === "/") {
      const end = src.indexOf("\n", i);
      const stop = end === -1 ? n : end;
      out += blank(src.slice(i, stop));
      i = stop;
    } else if (c === '"' || c === "'" || c === "`") {
      const quote = c;
      let j = i + 1;
      while (j < n) {
        if (src[j] === "\\") { j += 2; continue; }
        if (src[j] === quote) break;
        j += 1;
      }
      const stop = Math.min(j + 1, n);
      out += blank(src.slice(i, stop));
      i = stop;
    } else {
      out += c;
      i += 1;
    }
  }
  return out;
}

const compacta = (s) => s.replace(/\s+/g, " ").trim().slice(0, 70);
const linhaDe = (src, offset) => src.slice(0, offset).split("\n").length;

function antesNaoEspaco(texto, de) {
  let i = de;
  while (i >= 0 && /\s/.test(texto[i])) i--;
  return i;
}

/** Analisa um `await supabase.…` e devolve o motivo do achado, ou null. */
function analisa(s, idx) {
  const fim = s.indexOf(";", idx);
  const expressao = s.slice(idx, fim === -1 ? Math.min(s.length, idx + 500) : fim + 1);
  if (!ESCRITAS.test(expressao)) return null;

  const j = antesNaoEspaco(s, idx - 1);
  if (j < 0) return null;
  const prev = s[j];

  if (prev === "=") {
    const k = antesNaoEspaco(s, j - 1);
    if (k < 0) return null;
    if (s[k] === "}") {
      let depth = 0;
      let i = k;
      for (; i >= 0; i--) {
        if (s[i] === "}") depth++;
        else if (s[i] === "{") {
          depth--;
          if (depth === 0) break;
        }
      }
      const padrao = s.slice(i, k + 1);
      if (!/\berror\b/.test(padrao)) return "desestrutura sem `error`: " + compacta(padrao);
      return null;
    }
    if (/[A-Za-z0-9_$]/.test(s[k])) {
      let i = k;
      while (i >= 0 && /[A-Za-z0-9_$]/.test(s[i])) i--;
      const nome = s.slice(i + 1, k + 1);
      if (s[i] === ".") return null; // atribuicao a propriedade
      if (!new RegExp("\\b" + nome + "\\s*\\.\\s*error\\b").test(s)) {
        return "resultado em `" + nome + "` sem checar `error`";
      }
      return null;
    }
    return null;
  }

  if (prev === "]" || prev === ")" || prev === "," || prev === "(" || prev === "[") return null;
  if (/\bvoid$/.test(s.slice(0, j + 1))) return "retorno descartado (`void await`)";
  if (/\breturn$/.test(s.slice(0, j + 1))) return null;
  if (/=>$/.test(s.slice(0, j + 1))) return null;
  if (prev === "{" || prev === "}" || prev === ";") return "retorno do supabase descartado (sem error)";
  return null;
}

/** R3: escrita embutida dentro de `await Promise.all([...])`. */
function checaPromiseAll(s, arquivo, linhasOrig, achados) {
  const re = /await\s+Promise\.all\s*\(\s*\[/g;
  let m;
  while ((m = re.exec(s))) {
    const fim = s.indexOf(";", m.index);
    const bloco = s.slice(m.index, fim === -1 ? Math.min(s.length, m.index + 1500) : fim + 1);
    if (/\.then\s*\(/.test(bloco)) continue; // erro tratado em `.then(({ error }) => ...)`
    const internos = bloco.match(/supabase\s*\.\s*from\s*\(/g) ?? [];
    if (internos.length === 0) continue;

    // escrita embutida = cadeia com insert/update/upsert/delete que nao vem de `await supabase`
    const escreve = /\.\s*(insert|update|upsert|delete)\s*\(/.test(bloco);
    if (!escreve) continue;
    const comAwait = (bloco.match(/await\s+supabase/g) ?? []).length;
    if (comAwait === internos.length) continue; // todas as cadeias sao aguardadas: R1 cuida

    const j = antesNaoEspaco(s, m.index - 1);
    if (j >= 0 && s[j] === "=") {
      const k = antesNaoEspaco(s, j - 1);
      if (k >= 0 && s[k] === "]") continue; // const [a, b] = ... -> cada item e conferido depois
      if (s[k] === "}") {
        let depth = 0;
        let i = k;
        for (; i >= 0; i--) {
          if (s[i] === "}") depth++;
          else if (s[i] === "{") {
            depth--;
            if (depth === 0) break;
          }
        }
        const padrao = s.slice(i, k + 1);
        if (/\berror\b/.test(padrao)) continue;
        const linha = linhaDe(s, m.index);
        if (dispensado(linhasOrig, linha)) continue;
        achados.push({ arquivo, linha, regra: "R3", motivo: "Promise.all com escrita e desestruturacao sem `error`: " + compacta(padrao) });
        continue;
      }
    }
    const linha = linhaDe(s, m.index);
    if (dispensado(linhasOrig, linha)) continue;
    achados.push({ arquivo, linha, regra: "R3", motivo: "Promise.all com escrita embutida sem checar `error`" });
  }
}

function checaCatch(s, arquivo, linhasOrig, achados) {
  const re = /catch\s*(\([^)]*\))?\s*\{/g;
  let m;
  while ((m = re.exec(s))) {
    let depth = 1;
    let i = m.index + m[0].length;
    while (i < s.length && depth > 0) {
      if (s[i] === "{") depth++;
      else if (s[i] === "}") depth--;
      i++;
    }
    const corpo = s.slice(m.index + m[0].length, i - 1);
    if (!/\btoast\s*\.\s*success\s*\(/.test(corpo)) continue;
    const linha = linhaDe(s, m.index);
    if (dispensado(linhasOrig, linha)) continue;
    achados.push({ arquivo, linha, regra: "R2", motivo: "catch com toast.success (afirma sucesso depois de falhar)" });
  }
}

function dispensado(linhasOrig, linha) {
  for (const n of [linha, linha - 1, linha - 2]) {
    if (n >= 1 && linhasOrig[n - 1]?.includes(DISMISS)) return true;
  }
  return false;
}

const achados = [];
const arquivos = walk(ROOT);
for (const arquivo of arquivos) {
  const original = readFileSync(arquivo, "utf8");
  const s = stripCommentsAndStrings(original);
  const linhasOrig = original.split("\n");
  const re = /await\s+supabase\s*\./g;
  let m;
  while ((m = re.exec(s))) {
    const motivo = analisa(s, m.index);
    if (!motivo) continue;
    const linha = linhaDe(s, m.index);
    if (dispensado(linhasOrig, linha)) continue;
    achados.push({ arquivo, linha, regra: "R1", motivo });
  }
  checaCatch(s, arquivo, linhasOrig, achados);
  checaPromiseAll(s, arquivo, linhasOrig, achados);
}

console.log(`Guard supabase-error: ${arquivos.length} arquivo(s) analisado(s) em src/.`);
if (achados.length === 0) {
  console.log("Nenhuma gravacao cega encontrada.");
  process.exit(0);
}
for (const a of achados) {
  console.log(`${relative(".", a.arquivo)}:${a.linha} [${a.regra}] ${a.motivo}`);
}
console.log(`\nTotal: ${achados.length} achado(s).`);
process.exit(CHECK ? 1 : 0);