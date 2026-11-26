import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DNCTable } from '../DNCTable';

const baseItem = {
  id: 'dnc-1',
  phone: '(11) 99999-0001',
  phone_normalized: '11999990001',
  reason: 'complaint',
  source: 'manual',
  added_by: 'supervisor@empresa.com',
  notes: 'cliente pediu',
  is_active: true,
  expires_at: null,
  removed_by: null,
  removed_at: null,
  removal_reason: null,
  created_at: '2026-01-10T12:00:00.000Z',
};

describe('DNCTable — rastreabilidade e edicao (etapa 175)', () => {
  it('tem rotulo acessivel para editar e para remover, com o telefone', () => {
    render(<DNCTable items={[baseItem]} isLoading={false} onRemove={vi.fn()} onUpdate={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Editar \(11\) 99999-0001 na lista DNC/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Remover \(11\) 99999-0001 da lista DNC/i })).toBeInTheDocument();
  });

  it('pede confirmacao mostrando o numero antes de remover', () => {
    const onRemove = vi.fn();
    render(<DNCTable items={[baseItem]} isLoading={false} onRemove={onRemove} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Remover \(11\) 99999-0001/i }));
    expect(screen.getByText(/Remover da Lista DNC\?/i)).toBeInTheDocument();
    expect(screen.getByText(/\(11\) 99999-0001 poderá ser contatado novamente/i)).toBeInTheDocument();
    expect(onRemove).not.toHaveBeenCalled();
  });

  it('mostra autor e data quando a entrada foi removida', () => {
    render(
      <DNCTable
        items={[{ ...baseItem, is_active: false, removed_by: 'ana@empresa.com', removed_at: '2026-02-01T12:00:00.000Z' }]}
        isLoading={false}
        onRemove={vi.fn()}
        onUpdate={vi.fn()}
      />,
    );
    expect(screen.getByText(/por ana@empresa\.com em 01\/02\/2026/)).toBeInTheDocument();
  });

  it('mostra a validade e um traco quando nao ha prazo', () => {
    render(
      <DNCTable
        items={[baseItem, { ...baseItem, id: 'dnc-2', phone: '(11) 99999-0002', expires_at: '2026-03-05T12:00:00.000Z' }]}
        isLoading={false}
        onRemove={vi.fn()}
        onUpdate={vi.fn()}
      />,
    );
    expect(screen.getByText('05/03/2026')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
  });

  it('esconde a edicao quando nao ha tratador', () => {
    render(<DNCTable items={[baseItem]} isLoading={false} onRemove={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /Editar/i })).not.toBeInTheDocument();
  });
});