import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportToCSV, exportToJSON, exportToHTML, type ExportColumn } from '../index';

vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('export/index', () => {
  let clickSpy: () => void;
  let createdUrl = false;

  beforeEach(() => {
    clickSpy = vi.fn();
    createdUrl = false;
    vi.spyOn(URL, 'createObjectURL').mockImplementation(() => { createdUrl = true; return 'blob:mock'; });
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { clickSpy(); });
  });

  const columns: ExportColumn[] = [
    { key: 'name', label: 'Nome' },
    { key: 'amount', label: 'Valor', format: (v) => `R$${v}` },
    { key: 'missing', label: 'Opt' },
  ];
  const data = [
    { name: 'Ana "A"', amount: 10, missing: undefined },
    { name: 'Bob', amount: 20, missing: null },
  ];

  it('exportToCSV downloads with BOM and formatting', () => {
    exportToCSV(data, columns, 'report');
    expect(createdUrl).toBe(true);
    expect(clickSpy).toHaveBeenCalled();
  });

  it('exportToCSV no-ops on empty data', () => {
    exportToCSV([], columns, 'report');
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('exportToJSON downloads', () => {
    exportToJSON(data, 'data');
    expect(clickSpy).toHaveBeenCalled();
  });

  it('exportToHTML escapes and downloads', () => {
    exportToHTML(data, columns, 'Title <x> & "y"', 'report');
    expect(clickSpy).toHaveBeenCalled();
  });
});
