import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getTraceId,
  getTraceOperation,
  traceHeaders,
  withTrace,
  startTrace,
  endTrace,
  extractTraceIdFromHeaders,
  TRACE_HEADER_NAME,
  TRACE_OPERATION_HEADER_NAME,
} from '../tracing';

vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

describe('tracing (coverage)', () => {
  beforeEach(() => {
    endTrace();
    vi.clearAllMocks();
  });

  it('exports header name constants', () => {
    expect(TRACE_HEADER_NAME).toBe('x-request-id');
    expect(TRACE_OPERATION_HEADER_NAME).toBe('x-trace-operation');
  });

  it('returns undefined trace id/operation when no scope is active', () => {
    expect(getTraceId()).toBeUndefined();
    expect(getTraceOperation()).toBeUndefined();
    expect(traceHeaders()).toEqual({});
  });

  it('withTrace generates id, sets operation, and clears on success', async () => {
    let idDuring: string | undefined;
    let opDuring: string | undefined;
    const result = await withTrace('checkout', () => {
      idDuring = getTraceId();
      opDuring = getTraceOperation();
      return 42;
    });
    expect(result).toBe(42);
    expect(idDuring).toBeTruthy();
    expect(opDuring).toBe('checkout');
    // cleared after
    expect(getTraceId()).toBeUndefined();
    expect(getTraceOperation()).toBeUndefined();
  });

  it('withTrace populates traceHeaders during execution', async () => {
    await withTrace('op-headers', () => {
      const headers = traceHeaders();
      expect(headers[TRACE_HEADER_NAME]).toBeTruthy();
      expect(headers[TRACE_OPERATION_HEADER_NAME]).toBe('op-headers');
    });
  });

  it('withTrace propagates and logs errors, still clears scope', async () => {
    await expect(
      withTrace('failing', () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    expect(getTraceId()).toBeUndefined();
    expect(getTraceOperation()).toBeUndefined();
  });

  it('withTrace honors a provided parent trace id and restores previous operation', async () => {
    await withTrace('outer', async () => {
      const outerId = getTraceId();
      await withTrace(
        'inner',
        () => {
          expect(getTraceId()).toBe('parent-123');
          expect(getTraceOperation()).toBe('inner');
        },
        'parent-123',
      );
      // operation is restored to outer; trace id is NOT cleared because inner
      // was given an explicit parentTraceId, so it remains 'parent-123'.
      expect(getTraceOperation()).toBe('outer');
      expect(getTraceId()).toBe('parent-123');
    });
  });

  it('startTrace / endTrace manual flow', () => {
    const id = startTrace('manual-op');
    expect(id).toBeTruthy();
    expect(getTraceId()).toBe(id);
    expect(getTraceOperation()).toBe('manual-op');
    endTrace();
    expect(getTraceId()).toBeUndefined();
    expect(getTraceOperation()).toBeUndefined();
  });

  it('endTrace is safe when nothing is active', () => {
    expect(() => endTrace()).not.toThrow();
  });

  it('extractTraceIdFromHeaders supports Headers instance', () => {
    const h = new Headers();
    h.set('x-request-id', 'abc123');
    expect(extractTraceIdFromHeaders(h)).toBe('abc123');
    expect(extractTraceIdFromHeaders(new Headers())).toBeUndefined();
  });

  it('extractTraceIdFromHeaders supports plain object (lowercase and uppercase)', () => {
    expect(extractTraceIdFromHeaders({ 'x-request-id': 'low' })).toBe('low');
    expect(extractTraceIdFromHeaders({ 'X-REQUEST-ID': 'up' })).toBe('up');
    expect(extractTraceIdFromHeaders({})).toBeUndefined();
  });
});
