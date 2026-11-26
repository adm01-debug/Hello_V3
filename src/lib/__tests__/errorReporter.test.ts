// Etapa 230 (A-097) - reporter de erros do navegador.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const insertMock = vi.fn();
const getSessionMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getSession: (...args: unknown[]) => getSessionMock(...args) },
    from: () => ({ insert: insertMock }),
  },
}));

vi.mock('@/lib/tracing', () => ({ getTraceId: () => 'trace-abc' }));

import {
  buildClientErrorRow,
  installErrorReporter,
  resetErrorReporterState,
  routeFromUrl,
  shouldCapture,
  truncate,
  CLIENT_ERROR_MESSAGE_MAX,
  DEDUPE_WINDOW_MS,
  RATE_MAX_PER_WINDOW,
} from '@/lib/errorReporter';
import { reportError, type ErrorReport } from '@/lib/error-tracking';

const report: ErrorReport = {
  message: 'TypeError: x is not a function',
  stack: 'at y (app.js:1:1)',
  timestamp: Date.now(),
  url: 'https://app.example.com/calls?token=segredo#hash',
  userAgent: 'vitest',
  type: 'unhandled-rejection',
};

describe('errorReporter', () => {
  beforeEach(() => {
    resetErrorReporterState();
    insertMock.mockReset();
    insertMock.mockResolvedValue({ error: null });
    getSessionMock.mockReset();
    getSessionMock.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } });
  });

  it('nao monta linha sem usuario autenticado', () => {
    expect(buildClientErrorRow(report, null)).toBeNull();
  });

  it('grava so o pathname da rota (query e hash ficam de fora)', () => {
    const row = buildClientErrorRow(report, 'user-1');
    expect(row).not.toBeNull();
    expect(row!.route).toBe('/calls');
    expect(JSON.stringify(row)).not.toContain('segredo');
    expect(row!.correlation_id).toBe('trace-abc');
    expect(row!.user_id).toBe('user-1');
    expect(row!.error_type).toBe('unhandled-rejection');
  });

  it('trunca mensagem e stack nos limites da tabela', () => {
    const row = buildClientErrorRow(
      { ...report, message: 'a'.repeat(CLIENT_ERROR_MESSAGE_MAX + 50), stack: 'b'.repeat(9000) },
      'user-1',
    );
    expect(row!.message).toHaveLength(CLIENT_ERROR_MESSAGE_MAX);
    expect(row!.stack).toHaveLength(4000);
  });

  it('descarta relato com mensagem vazia', () => {
    expect(buildClientErrorRow({ ...report, message: '   ' }, 'user-1')).toBeNull();
    expect(truncate(undefined, 10)).toBeNull();
  });

  it('rota invalida cai para o pathname do texto', () => {
    expect(routeFromUrl('https://x.test/a/b?c=1#d')).toBe('/a/b');
    expect(routeFromUrl('')).toBe('/');
  });

  it('dedupe de 60s e teto de 10 por minuto', () => {
    const now = 1_000_000;
    expect(shouldCapture('error|boom', now)).toBe(true);
    expect(shouldCapture('error|boom', now + 1000)).toBe(false);
    expect(shouldCapture('error|boom', now + DEDUPE_WINDOW_MS + 1)).toBe(true);

    resetErrorReporterState();
    let aceitos = 0;
    for (let i = 0; i < RATE_MAX_PER_WINDOW + 5; i += 1) {
      if (shouldCapture(`error|erro-${i}`, now + i)) aceitos += 1;
    }
    expect(aceitos).toBe(RATE_MAX_PER_WINDOW);
  });

  it('persiste o relato capturado pelo error-tracking', async () => {
    installErrorReporter();
    reportError({ message: 'Unhandled boom', type: 'unhandled-rejection' });
    await vi.waitFor(() => expect(insertMock).toHaveBeenCalledTimes(1));
    const payload = insertMock.mock.calls[0][0];
    expect(payload.message).toBe('Unhandled boom');
    expect(payload.user_id).toBe('user-1');
  });

  it('nao persiste sem sessao (anon nao tem policy de insert)', async () => {
    getSessionMock.mockResolvedValue({ data: { session: null } });
    installErrorReporter();
    reportError({ message: 'sem sessao' });
    await Promise.resolve();
    await Promise.resolve();
    expect(insertMock).not.toHaveBeenCalled();
  });
});