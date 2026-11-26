import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditDNCDialog } from '../EditDNCDialog';

const item = {
  id: 'dnc-1',
  phone: '(11) 99999-0001',
  reason: 'manual',
  notes: null as string | null,
  expires_at: null as string | null,
};

describe('EditDNCDialog (etapa 175)', () => {
  it('grava observacao e validade mantendo o motivo atual', () => {
    const onSave = vi.fn();
    render(<EditDNCDialog item={item} onSave={onSave} />);

    fireEvent.click(screen.getByRole('button', { name: /Editar \(11\) 99999-0001 na lista DNC/i }));
    fireEvent.change(screen.getByLabelText('Observações'), { target: { value: 'pedido do titular' } });
    fireEvent.change(screen.getByLabelText('Validade'), { target: { value: '2026-12-31' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(onSave).toHaveBeenCalledWith({
      id: 'dnc-1',
      reason: 'manual',
      notes: 'pedido do titular',
      expires_at: new Date('2026-12-31T23:59:59').toISOString(),
    });
  });

  it('validade em branco remove o prazo e observacao vazia vira nulo', () => {
    const onSave = vi.fn();
    render(<EditDNCDialog item={{ ...item, notes: 'antigo', expires_at: '2026-12-31T23:59:59.000Z' }} onSave={onSave} />);

    fireEvent.click(screen.getByRole('button', { name: /Editar/i }));
    expect((screen.getByLabelText('Validade') as HTMLInputElement).value).toBe('2026-12-31');
    fireEvent.change(screen.getByLabelText('Observações'), { target: { value: '   ' } });
    fireEvent.change(screen.getByLabelText('Validade'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(onSave).toHaveBeenCalledWith({ id: 'dnc-1', reason: 'manual', notes: null, expires_at: null });
  });

  it('explica que o autor da remocao e registrado automaticamente', () => {
    render(<EditDNCDialog item={item} onSave={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Editar/i }));
    expect(screen.getByText(/Quem removeu e quando é registrado automaticamente/i)).toBeInTheDocument();
  });
});