import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

let listResult: { data: unknown; error: unknown } = { data: [], error: null };
let upsertResult: { data: unknown; error: unknown } = { data: null, error: null };
let deleteResult: { data: unknown; error: unknown } = { data: null, error: null };
const upsertCalls: unknown[][] = [];
const eqCalls: unknown[][] = [];
const orderCalls: unknown[][] = [];

interface Builder {
  [key: string]: unknown;
  then: (resolve: (value: { data: unknown; error: unknown }) => unknown) => Promise<unknown>;
}

function makeBuilder(): Builder {
  const builder: Partial<Builder> = {};
  let result = listResult;
  builder.select = vi.fn(() => builder as Builder);
  builder.order = vi.fn((...args: unknown[]) => {
    orderCalls.push(args);
    return builder as Builder;
  });
  builder.eq = vi.fn((...args: unknown[]) => {
    eqCalls.push(args);
    return builder as Builder;
  });
  builder.single = vi.fn(() => {
    result = upsertResult;
    return builder as Builder;
  });
  builder.upsert = vi.fn((...args: unknown[]) => {
    upsertCalls.push(args);
    result = upsertResult;
    return builder as Builder;
  });
  builder.delete = vi.fn(() => {
    result = deleteResult;
    return builder as Builder;
  });
  builder.then = (resolve) => Promise.resolve(resolve(result));
  return builder as Builder;
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn(() => makeBuilder()) },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    create: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn() }),
  },
}));

import { toast } from 'sonner';
import {
  WEBHOOK_SECRET_MIN_LENGTH,
  WEBHOOK_SECRETS_QUERY_KEY,
  generateWebhookSecret,
  maskSecret,
  normalizeProvider,
  useWebhookSecrets,
  validateProvider,
  validateSecret,
} from '../useWebhookSecrets';

const row = {
  id: 'secret-1',
  provider: 'generic-provider',
  secret_key: 'abcdef0123456789abcdef0123456789',
  created_at: '2026-11-01T10:00:00.000Z',
  updated_at: '2026-11-02T10:00:00.000Z',
};

let queryClient: QueryClient;
let invalidateSpy: ReturnType<typeof vi.spyOn>;

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useWebhookSecrets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listResult = { data: [row], error: null };
    upsertResult = { data: { ...row, provider: 'stripe' }, error: null };
    deleteResult = { data: null, error: null };
    upsertCalls.length = 0;
    eqCalls.length = 0;
    orderCalls.length = 0;
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
  });

  it('lista os segredos ordenados por provedor', async () => {
    const { result } = renderHook(() => useWebhookSecrets(), { wrapper });
    await waitFor(() => expect(result.current.secrets).toHaveLength(1));
    expect(result.current.secrets[0].provider).toBe('generic-provider');
    expect(orderCalls[0]).toEqual(['provider', { ascending: true }]);
  });

  it('cadastra provedor normalizado e invalida o cache', async () => {
    const { result } = renderHook(() => useWebhookSecrets(), { wrapper });
    await waitFor(() => expect(result.current.secrets).toHaveLength(1));

    await act(async () => {
      await result.current.saveSecret({ provider: '  Stripe ', secret: 's'.repeat(40), mode: 'create' });
    });

    const [payload, options] = upsertCalls[0] as [Record<string, unknown>, Record<string, unknown>];
    expect(payload.provider).toBe('stripe');
    expect(payload.secret_key).toBe('s'.repeat(40));
    expect(typeof payload.updated_at).toBe('string');
    expect(options).toEqual({ onConflict: 'provider' });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: WEBHOOK_SECRETS_QUERY_KEY });
    expect(toast.success).toHaveBeenCalledWith('Segredo de stripe cadastrado');
  });

  it('distingue rotação de cadastro na mensagem de sucesso', async () => {
    const { result } = renderHook(() => useWebhookSecrets(), { wrapper });
    await waitFor(() => expect(result.current.secrets).toHaveLength(1));

    await act(async () => {
      await result.current.saveSecret({ provider: 'stripe', secret: 'r'.repeat(40), mode: 'rotate' });
    });

    expect(toast.success).toHaveBeenCalledWith('Segredo de stripe rotacionado');
  });

  it('expoe o erro do banco e nao invalida o cache quando a gravacao falha', async () => {
    upsertResult = { data: null, error: new Error('permission denied for table webhook_secrets') };
    const { result } = renderHook(() => useWebhookSecrets(), { wrapper });
    await waitFor(() => expect(result.current.secrets).toHaveLength(1));

    await act(async () => {
      await expect(
        result.current.saveSecret({ provider: 'stripe', secret: 'e'.repeat(40), mode: 'create' }),
      ).rejects.toThrow('permission denied');
    });

    expect(toast.error).toHaveBeenCalledWith(
      'Não foi possível salvar o segredo',
      expect.objectContaining({ description: 'permission denied for table webhook_secrets' }),
    );
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it('remove o segredo pela chave primaria e invalida o cache', async () => {
    const { result } = renderHook(() => useWebhookSecrets(), { wrapper });
    await waitFor(() => expect(result.current.secrets).toHaveLength(1));

    await act(async () => {
      await result.current.deleteSecret('secret-1');
    });

    expect(eqCalls[0]).toEqual(['id', 'secret-1']);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: WEBHOOK_SECRETS_QUERY_KEY });
    expect(toast.success).toHaveBeenCalledWith('Segredo removido', expect.anything());
  });

  it('expoe erro quando a exclusao falha', async () => {
    deleteResult = { data: null, error: new Error('rls negou a exclusao') };
    const { result } = renderHook(() => useWebhookSecrets(), { wrapper });
    await waitFor(() => expect(result.current.secrets).toHaveLength(1));

    await act(async () => {
      await expect(result.current.deleteSecret('secret-1')).rejects.toThrow('rls negou');
    });

    expect(toast.error).toHaveBeenCalledWith(
      'Não foi possível remover o segredo',
      expect.objectContaining({ description: 'rls negou a exclusao' }),
    );
  });
});

describe('useWebhookSecrets helpers', () => {
  it('mascara tudo menos os 4 ultimos caracteres', () => {
    expect(maskSecret('abcdef0123456789')).toBe('••••••••6789');
    expect(maskSecret('abc')).toBe('••••');
    expect(maskSecret('')).toBe('');
    expect(maskSecret(null)).toBe('');
  });

  it('gera 32 bytes em hex, sem repetir entre chamadas', () => {
    const first = generateWebhookSecret();
    const second = generateWebhookSecret();
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(second).toMatch(/^[0-9a-f]{64}$/);
    expect(first).not.toBe(second);
    expect(generateWebhookSecret(8)).toHaveLength(16);
  });

  it('normaliza e valida o provedor', () => {
    expect(normalizeProvider('  Generic-Provider ')).toBe('generic-provider');
    expect(validateProvider('generic-provider')).toBeNull();
    expect(validateProvider('   ')).toBe('Informe o provedor');
    expect(validateProvider('ab')).toMatch(/3 a 64/);
    expect(validateProvider('Stripe Pagamentos')).toMatch(/3 a 64/);
    expect(validateProvider('a'.repeat(65))).toMatch(/3 a 64/);
  });

  it('exige segredo com pelo menos o minimo de caracteres', () => {
    expect(validateSecret('a'.repeat(WEBHOOK_SECRET_MIN_LENGTH))).toBeNull();
    expect(validateSecret('curto')).toMatch(String(WEBHOOK_SECRET_MIN_LENGTH));
    expect(validateSecret('')).toBe('Informe ou gere um segredo');
  });
});