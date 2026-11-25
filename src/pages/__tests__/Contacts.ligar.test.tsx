import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  toastInfo: vi.fn(),
  contacts: [
    {
      id: 'c1', external_id: null, name: 'Ana', phone: '+5511988887777', email: null,
      company: null, position: null, notes: null, tags: null, preferences: {},
      personality_insights: {}, source: 'manual', version: 1,
      created_at: '2026-11-25T10:00:00.000Z', updated_at: '2026-11-25T10:00:00.000Z',
    },
    {
      id: 'c2', external_id: null, name: 'SemTelefone', phone: null, email: null,
      company: null, position: null, notes: null, tags: null, preferences: {},
      personality_insights: {}, source: 'manual', version: 1,
      created_at: '2026-11-25T10:00:00.000Z', updated_at: '2026-11-25T10:00:00.000Z',
    },
  ],
}));

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), info: mocks.toastInfo, warning: vi.fn() }),
}));
vi.mock('@/hooks/usePageTitle', () => ({ usePageTitle: () => {} }));
vi.mock('@/hooks/useDebouncedSearchParam', () => ({
  useDebouncedSearchParam: () => ({ inputValue: '', debouncedValue: '', setValue: vi.fn() }),
}));
vi.mock('@/hooks/useContacts', () => ({
  useContacts: () => ({
    contacts: mocks.contacts,
    isLoading: false,
    totalCount: mocks.contacts.length,
    hasMore: false,
    loadingMore: false,
    loadMore: vi.fn(),
    fetchContacts: vi.fn(),
    deleteContact: vi.fn(),
    createContact: vi.fn(),
  }),
}));
vi.mock('@/components/contacts/useBitrixSync', () => ({
  useBitrixSync: () => ({ syncWithBitrix: vi.fn(), isSyncing: false, bitrixLoading: false }),
}));
vi.mock('@/components/contacts/ContactFilters', () => ({ ContactFilters: () => null }));
vi.mock('@/components/contacts/ContactDetailSheet', () => ({ ContactDetailSheet: () => null }));
vi.mock('@/components/contacts/CreateContactDialog', () => ({ CreateContactDialog: () => null }));
vi.mock('@/components/contacts/ContactGrid', () => ({
  ContactGrid: ({ contacts, onCall }: { contacts: typeof mocks.contacts; onCall: (c: unknown) => void }) => (
    <div>
      {contacts.map((c) => (
        <button key={c.id} onClick={() => onCall(c)}>{`Ligar ${c.name}`}</button>
      ))}
    </div>
  ),
}));

import Contacts from '../Contacts';

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="rota">{location.pathname + location.search}</div>;
};

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/contatos']}>
      <Contacts />
      <LocationProbe />
    </MemoryRouter>,
  );

const rotaAtual = () => decodeURIComponent(screen.getByTestId('rota').textContent ?? '');

describe('Contacts - Ligar', () => {
  beforeEach(() => vi.clearAllMocks());

  it('leva o numero e o nome para o discador, ja mandando discar', async () => {
    renderPage();
    fireEvent.click(await screen.findByText('Ligar Ana'));

    await waitFor(() => expect(rotaAtual()).toContain('number=+5511988887777'));
    expect(rotaAtual()).toContain('nome=Ana');
    expect(rotaAtual()).toContain('auto=1');
    expect(rotaAtual().startsWith('/?')).toBe(true);
  });

  it('avisa quando o contato nao tem telefone em vez de abrir o discador', async () => {
    renderPage();
    fireEvent.click(await screen.findByText('Ligar SemTelefone'));

    await waitFor(() => expect(mocks.toastInfo).toHaveBeenCalled());
    expect(rotaAtual()).toBe('/contatos');
  });
});