import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContactCard } from '../ContactCard';
import type { Contact } from '@/hooks/useContacts';

const contact: Contact = {
  id: 'c1',
  external_id: null,
  name: 'Ana Souza',
  phone: '+5511999999999',
  email: 'ana@exemplo.com',
  company: 'Acme',
  position: null,
  notes: null,
  tags: null,
  preferences: {},
  personality_insights: {},
  source: 'manual',
  version: 1,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const setup = (isFavorite = false) => {
  const onSelect = vi.fn();
  const onCall = vi.fn();
  const onToggleFavorite = vi.fn();
  render(
    <ContactCard
      contact={contact}
      isFavorite={isFavorite}
      onSelect={onSelect}
      onCall={onCall}
      onToggleFavorite={onToggleFavorite}
    />,
  );
  return { onSelect, onCall, onToggleFavorite };
};

describe('ContactCard - menu "mais opções" (A-084)', () => {
  // O conteúdo do menu Radix só monta com PointerEvent (jsdom 20 não implementa),
  // então aqui garantimos o acionador e o isolamento do clique no cartão.
  it('expõe o acionador "mais opções" sem selecionar o cartão', () => {
    const { onSelect, onCall, onToggleFavorite } = setup();

    const trigger = screen.getByLabelText('Mais opções');
    expect(trigger).toBeInTheDocument();

    fireEvent.click(trigger);

    expect(onSelect).not.toHaveBeenCalled();
    expect(onCall).not.toHaveBeenCalled();
    expect(onToggleFavorite).not.toHaveBeenCalled();
  });

  it('o botão de e-mail aponta para mailto e não seleciona o cartão', () => {
    const { onSelect } = setup();

    const email = screen.getByLabelText('Enviar e-mail para Ana Souza');
    expect(email.getAttribute('href')).toBe('mailto:ana@exemplo.com');
    expect(email.getAttribute('aria-label')).toBe('Enviar e-mail para Ana Souza');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('clicar no cartão continua selecionando o contato', () => {
    const { onSelect } = setup();

    fireEvent.click(screen.getByText('Ana Souza'));

    expect(onSelect).toHaveBeenCalledWith(contact);
  });
});

describe('ContactCard - favoritar com nome acessível (A-123)', () => {
  it('anuncia a ação e o estado do botão de favoritos', () => {
    const { onToggleFavorite } = setup(false);

    const botao = screen.getByRole('button', { name: 'Adicionar aos favoritos' });
    expect(botao).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(botao);
    expect(onToggleFavorite).toHaveBeenCalledWith('c1');
  });

  it('inverte o rótulo e o aria-pressed quando já é favorito', () => {
    setup(true);

    const botao = screen.getByRole('button', { name: 'Remover dos favoritos' });
    expect(botao).toHaveAttribute('aria-pressed', 'true');
  });
});
