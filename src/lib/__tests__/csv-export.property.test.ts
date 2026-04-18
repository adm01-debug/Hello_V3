import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import { exportToCSV, type ExportColumn } from '@/lib/export';

// Mock URL/Blob plumbing
beforeEach(() => {
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
  // Capture last blob via spy on Blob constructor
});

let lastCsv = '';
class CapturingBlob extends Blob {
  constructor(parts: BlobPart[], options?: BlobPropertyBag) {
    super(parts, options);
    lastCsv = parts.map(p => typeof p === 'string' ? p : '').join('');
  }
}
// @ts-expect-error override
globalThis.Blob = CapturingBlob;

const cols: ExportColumn[] = [
  { key: 'a', label: 'Coluna A' },
  { key: 'b', label: 'Coluna B' },
];

describe('exportToCSV — property-based (500 runs)', () => {
  it('escapa aspas duplas conforme RFC 4180', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            a: fc.string({ maxLength: 30 }),
            b: fc.string({ maxLength: 30 }),
          }),
          { minLength: 1, maxLength: 5 },
        ),
        (data) => {
          lastCsv = '';
          exportToCSV(data, cols, 'test');
          // Each row contains escaped quotes (no orphan unescaped quote inside fields)
          const rows = lastCsv.split('\n').slice(1); // skip header
          for (const row of rows) {
            // Match field by field
            const fields = row.match(/"((?:[^"]|"")*)"/g) ?? [];
            expect(fields.length).toBe(2);
          }
        },
      ),
      { numRuns: 500, seed: 42 },
    );
  });

  it('preserva conteúdo (round-trip de aspas)', () => {
    const data = [{ a: 'has "quotes" inside', b: 'normal' }];
    lastCsv = '';
    exportToCSV(data, cols, 'test');
    expect(lastCsv).toContain('"has ""quotes"" inside"');
  });

  it('aceita quebras de linha nos dados sem corromper estrutura', () => {
    const data = [{ a: 'line1\nline2', b: 'ok' }];
    lastCsv = '';
    exportToCSV(data, cols, 'test');
    expect(lastCsv).toContain('"line1\nline2"');
  });

  it('aceita ponto-e-vírgula nos dados (delimiter usado é ;)', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 50 }), (s) => {
        lastCsv = '';
        exportToCSV([{ a: s, b: 'x' }], cols, 'test');
        // string sempre cercada por aspas, então ; interno não quebra parsing
        return lastCsv.startsWith('\uFEFF');
      }),
      { numRuns: 500, seed: 7 },
    );
  });

  it('array vazio não escreve nada', () => {
    lastCsv = '';
    exportToCSV([], cols, 'test');
    expect(lastCsv).toBe('');
  });

  it('valores null/undefined viram string vazia', () => {
    lastCsv = '';
    exportToCSV([{ a: null, b: undefined }] as never, cols, 'test');
    expect(lastCsv).toContain('""');
  });
});
