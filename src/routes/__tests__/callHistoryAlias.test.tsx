import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { createElement } from 'react';
import type { Location } from 'react-router-dom';
import { protectedRoutes } from '../protectedRoutes';
import { CallHistoryAlias } from '../CallHistoryAlias';

/**
 * Etapa 266: `/history` e `/call-history` apontavam para o mesmo componente,
 * duplicando a rota. `/history` ficou canonica e `/call-history` virou alias
 * com redirect, preservando a query string de `/call-history?session=...`
 * (link usado por CallLibrary.tsx:164).
 */
function entrada(path: string) {
  const rota = protectedRoutes.find((r) => r.path === path);
  if (!rota) throw new Error(`rota ${path} nao registrada`);
  return rota;
}

function montar(entradaInicial: string) {
  const Alias = entrada('/call-history').element;
  let visto: Location | null = null;
  function Espiao() {
    visto = useLocation();
    return createElement('div', { 'data-testid': 'destino' }, 'historico');
  }
  render(
    createElement(
      MemoryRouter,
      { initialEntries: [entradaInicial] },
      createElement(
        Routes,
        null,
        createElement(Route, { path: '/call-history', element: createElement(Alias) }),
        createElement(Route, { path: '/history', element: createElement(Espiao) })
      )
    )
  );
  return () => {
    if (!visto) throw new Error('nenhuma rota /history foi renderizada');
    return visto;
  };
}

describe('alias /call-history -> /history (etapa 266)', () => {
  it('/call-history nao renderiza mais CallHistory, e sim o alias', () => {
    expect(entrada('/call-history').element).toBe(CallHistoryAlias);
    expect(entrada('/call-history').element).not.toBe(entrada('/history').element);
  });

  it('/history continua entregando a pagina real', () => {
    const Canonica = entrada('/history').element;
    expect(typeof Canonica).toBe('object');
    expect(Canonica).not.toBe(CallHistoryAlias);
  });

  it('redireciona /call-history para /history', () => {
    const ler = montar('/call-history');
    expect(ler().pathname).toBe('/history');
    expect(ler().search).toBe('');
  });

  it('preserva a query string do deep link ?session=', () => {
    const ler = montar('/call-history?session=abc-123');
    expect(ler().pathname).toBe('/history');
    expect(ler().search).toBe('?session=abc-123');
  });

  it('preserva query string com varios parametros', () => {
    const ler = montar('/call-history?session=abc-123&tab=gravacoes');
    expect(ler().search).toBe('?session=abc-123&tab=gravacoes');
  });
});
