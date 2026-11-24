import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import fs from 'fs';
import path from 'path';

/**
 * Etapa 253 (A-105 / A-134): painel so consulta com a aba visivel, e o
 * monitoramento de VoIP nao roda nas rotas publicas.
 *
 * O mock de `useQuery` captura as opcoes entregues pelo hook — e o que prova o
 * `refetchInterval`. Testar o intervalo de verdade nao serve: o React Query ja
 * pausa o intervalo quando a janela perde o foco (`refetchIntervalInBackground`
 * falso por padrao), entao o teste passaria com e sem a correcao.
 */
const opcoesDeQuery = vi.hoisted(() => [] as Array<Record<string, unknown>>);

vi.mock('@tanstack/react-query', async () => {
  const real = await vi.importActual<Record<string, unknown>>('@tanstack/react-query');
  return {
    ...real,
    useQuery: (opcoes: Record<string, unknown>) => {
      opcoesDeQuery.push(opcoes);
      return { data: undefined, isLoading: false, isSuccess: false, isError: false };
    },
  };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({ select: vi.fn(), order: vi.fn(), limit: vi.fn() })),
    functions: { invoke: vi.fn() },
    rpc: vi.fn(),
  },
}));

function read(file: string): string {
  return fs.readFileSync(path.resolve(__dirname, '../../..', file), 'utf-8');
}

function ultimoRefetchInterval(): unknown {
  const opcoes = opcoesDeQuery[opcoesDeQuery.length - 1];
  return opcoes?.refetchInterval;
}

const HOOKS_DE_PAINEL = [
  'src/hooks/useQualityMetrics.ts',
  'src/hooks/useVoipAnomalies.ts',
  'src/hooks/useAdherence.ts',
  'src/hooks/useDashboardData.ts',
];

describe('etapa 253: poll de painel respeita a visibilidade da aba', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    opcoesDeQuery.length = 0;
  });

  HOOKS_DE_PAINEL.forEach((file) => {
    it(`${file} usa usePageVisibility`, () => {
      expect(read(file)).toContain("from '@/hooks/usePageVisibility'");
    });

    it(`${file} nao tem refetchInterval sempre ligado`, () => {
      const semComentarios = read(file).replace(/\/\/.*$/gm, '');
      expect(semComentarios).not.toMatch(/refetchInterval:\s*\d/);
      expect(semComentarios).toContain('refetchInterval: isVisible ?');
    });
  });

  it('useQualityMetrics entrega refetchInterval falso com a aba oculta', async () => {
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    const { useQualityMetrics } = await import('../useQualityMetrics');
    renderHook(() => useQualityMetrics());
    expect(ultimoRefetchInterval()).toBe(false);
  });

  it('useQualityMetrics entrega o intervalo do painel com a aba visivel', async () => {
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    const { useQualityMetrics } = await import('../useQualityMetrics');
    renderHook(() => useQualityMetrics());
    expect(ultimoRefetchInterval()).toBe(5000);
  });

  it('useVoipAnomalies entrega refetchInterval falso com a aba oculta', async () => {
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    const { useVoipAnomalies } = await import('../useVoipAnomalies');
    renderHook(() => useVoipAnomalies(24));
    expect(ultimoRefetchInterval()).toBe(false);
  });

  it('App monta GlobalServices dentro da area autenticada, nao acima do roteador', () => {
    const app = read('src/App.tsx');
    const protegida = app.indexOf('<ProtectedRoute>');
    const global = app.indexOf('<GlobalServices />');
    expect(protegida).toBeGreaterThan(-1);
    expect(global).toBeGreaterThan(protegida);
  });

  it('painel de qualidade nao pede select(*) — metrica operacional tem colunas fixas', () => {
    expect(read('src/hooks/useQualityMetrics.ts')).not.toContain(".select('*')");
  });
});
