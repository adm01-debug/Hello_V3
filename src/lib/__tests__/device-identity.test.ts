import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  MAX_DEVICE_LABEL_LENGTH,
  FALLBACK_DEVICE_LABEL,
  sanitizeDeviceLabel,
  detectDeviceLabel,
  formatRemoteOrigin,
  formatOriginNotice,
} from '@/lib/device-identity';


describe('device-identity', () => {
  it('sanitize sempre respeita o CHECK do banco (trim + limite)', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = sanitizeDeviceLabel(input);
        if (result === null) return true;
        return (
          result === result.trim() &&
          result.length >= 1 &&
          result.length <= MAX_DEVICE_LABEL_LENGTH
        );
      }),
      { numRuns: 800 },
    );
  });

  it('sanitize é idempotente', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const once = sanitizeDeviceLabel(input);
        return sanitizeDeviceLabel(once) === once;
      }),
      { numRuns: 500 },
    );
  });

  it('sanitize rejeita não-strings', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.integer(), fc.constant(null), fc.constant(undefined), fc.object()),
        (input) => sanitizeDeviceLabel(input) === null,
      ),
      { numRuns: 200 },
    );
  });

  it('detect nunca devolve string vazia', () => {
    fc.assert(
      fc.property(fc.option(fc.string(), { nil: undefined }), (ua) => {
        const label = detectDeviceLabel(ua);
        return typeof label === 'string' && label.trim().length > 0;
      }),
      { numRuns: 500 },
    );
  });

  it('detect reconhece navegadores conhecidos com precedência correta', () => {
    expect(
      detectDeviceLabel(
        'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/120 Safari/537.36 Edg/120',
      ),
    ).toBe('Edge em Windows');
    expect(
      detectDeviceLabel('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) Chrome/120 Safari/537.36'),
    ).toBe('Chrome em macOS');
    expect(detectDeviceLabel('')).toBe(FALLBACK_DEVICE_LABEL);
  });

  it('formatRemoteOrigin degrada com timestamps inválidos', () => {
    fc.assert(
      fc.property(
        fc.option(fc.string(), { nil: null }),
        fc.oneof(fc.constant(null), fc.constant(NaN), fc.constant(Infinity), fc.integer()),
        (device, at) => {
          const text = formatRemoteOrigin(device, at as number | null);
          return typeof text === 'string' && text.startsWith('Toque atualizado em');
        },
      ),
      { numRuns: 500 },
    );
  });
});
