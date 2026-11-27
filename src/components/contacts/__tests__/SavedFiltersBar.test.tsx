import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const hookState: {
  savedFilters: Array<Record<string, unknown>>;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  saveFilter: ReturnType<typeof vi.fn>;
  deleteFilter: ReturnType<typeof vi.fn>;
  setDefaultFilter: ReturnType<typeof vi.fn>;
  fetchSavedFilters: ReturnType<typeof vi.fn>;
} = {
  savedFilters: [],
  isLoading: false,
  isSaving: false,
  error: null,
  saveFilter: vi.fn(() => Promise.resolve({ ok: true })),
  deleteFilter: vi.fn(() => Promise.resolve({ ok: true })),
  setDefaultFilter: vi.fn(() => Promise.resolve({ ok: true })),
  fetchSavedFilters: vi.fn(),
};

vi.mock('@/hooks/useSavedFilters', () => ({
  useSavedFilters: () => hookState,
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

import { SavedFiltersBar } from '../SavedFiltersBar';

const preset = (over: Record<string, unknown> = {}) => ({
  id: 'f1',
  user_id: 'user-1',
  entity_type: 'contacts',
  name: 'Bitrix',
  filters: { search: 'ana' },
  is_default: false,
  created_at: '2026-11-27T10:00:00.000Z',
  updated_at: '2026-11-27T10:00:00.000Z',
  ...over,
});

describe('SavedFiltersBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hookState.savedFilters = [];
    hookState.isLoading = false;
    hookState.error = null;
  });

  it('avisa quando o usuário ainda não salvou nenhum filtro', () => {
    render(<SavedFiltersBar entityType="contacts" current={{ search: '' }} onApply={vi.fn()} />);
    expect(screen.getByText('Nenhum filtro salvo ainda.')).toBeTruthy();
  });

  it('aplica o preset clicado', () => {
    const onApply = vi.fn();
    hookState.savedFilters = [preset()];
    render(<SavedFiltersBar entityType="contacts" current={{ search: '' }} onApply={onApply} />);

    fireEvent.click(screen.getByRole('button', { name: 'Bitrix' }));
    expect(onApply).toHaveBeenCalledWith({ search: 'ana' });
  });

  it('aplica o filtro padrão uma única vez, mesmo com onApply trocando de identidade', () => {
    hookState.savedFilters = [preset({ is_default: true })];
    const first = vi.fn();
    const { rerender } = render(
      <SavedFiltersBar entityType="contacts" current={{ search: '' }} onApply={first} />,
    );

    expect(first).toHaveBeenCalledTimes(1);
    expect(first).toHaveBeenCalledWith({ search: 'ana' });

    const second = vi.fn();
    rerender(<SavedFiltersBar entityType="contacts" current={{ search: '' }} onApply={second} />);
    expect(second).not.toHaveBeenCalled();
  });

  it('remove e promove um preset a padrão pelos botões da linha', () => {
    hookState.savedFilters = [preset()];
    render(<SavedFiltersBar entityType="contacts" current={{ search: '' }} onApply={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Definir Bitrix como padrão' }));
    expect(hookState.setDefaultFilter).toHaveBeenCalledWith('f1');

    fireEvent.click(screen.getByRole('button', { name: 'Remover filtro Bitrix' }));
    expect(hookState.deleteFilter).toHaveBeenCalledWith('f1');
  });

  it('mostra o erro do hook em role=alert', () => {
    hookState.error = 'Não foi possível salvar o filtro.';
    render(<SavedFiltersBar entityType="contacts" current={{ search: '' }} onApply={vi.fn()} />);
    expect(screen.getByRole('alert').textContent).toContain('Não foi possível salvar o filtro.');
  });
});
