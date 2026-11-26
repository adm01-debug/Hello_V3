import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

interface HookState {
  secrets: Array<Record<string, unknown>>;
  isLoading: boolean;
  error: Error | null;
  saveSecret: ReturnType<typeof vi.fn>;
  deleteSecret: ReturnType<typeof vi.fn>;
  isSaving: boolean;
  isDeleting: boolean;
  refetch: ReturnType<typeof vi.fn>;
}

vi.mock('@/hooks/useWebhookSecrets', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useWebhookSecrets')>();
  return {
    ...actual,
    useWebhookSecrets: () => (globalThis as unknown as { __whUseSecrets: () => HookState }).__whUseSecrets(),
  };
});

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

import { WebhookSecretsCard } from '../WebhookSecretsCard';

const FULL_SECRET = 'abcdef0123456789abcdef0123456789';

const baseRow = {
  id: 'secret-1',
  provider: 'generic-provider',
  secret_key: FULL_SECRET,
  created_at: '2026-11-01T10:00:00.000Z',
  updated_at: '2026-11-02T10:00:00.000Z',
};

let saveSecret: ReturnType<typeof vi.fn>;
let deleteSecret: ReturnType<typeof vi.fn>;
let writeText: ReturnType<typeof vi.fn>;

function setHookState(overrides: Partial<HookState> = {}) {
  const state: HookState = {
    secrets: [baseRow],
    isLoading: false,
    error: null,
    saveSecret,
    deleteSecret,
    isSaving: false,
    isDeleting: false,
    refetch: vi.fn(),
    ...overrides,
  };
  (globalThis as unknown as { __whUseSecrets: () => HookState }).__whUseSecrets = () => state;
  return state;
}

describe('WebhookSecretsCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    saveSecret = vi.fn().mockResolvedValue(baseRow);
    deleteSecret = vi.fn().mockResolvedValue('secret-1');
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    setHookState();
  });

  it('mostra estado vazio com chamada para cadastrar quando nao ha segredo', () => {
    setHookState({ secrets: [] });
    render(<WebhookSecretsCard />);
    expect(screen.getByText(/Nenhum provedor com segredo cadastrado/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cadastrar o primeiro segredo/ })).toBeInTheDocument();
  });

  it('nunca renderiza o segredo completo antes de revelar', () => {
    render(<WebhookSecretsCard />);
    expect(screen.queryByText(FULL_SECRET)).not.toBeInTheDocument();
    expect(screen.getByText('••••••••6789')).toBeInTheDocument();
    expect(screen.getByText('webhook-handler')).toBeInTheDocument();
    expect(screen.getByText('header x-webhook-signature')).toBeInTheDocument();
  });

  it('revela e copia o valor completo quando o admin pede', async () => {
    render(<WebhookSecretsCard />);
    fireEvent.click(screen.getByRole('button', { name: 'Revelar segredo de generic-provider' }));
    expect(screen.getByText(FULL_SECRET)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Copiar segredo de generic-provider' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(FULL_SECRET));
  });

  it('avisa que o provedor nao e lido por nenhuma edge', () => {
    setHookState({ secrets: [{ ...baseRow, id: 'secret-2', provider: 'stripe' }] });
    render(<WebhookSecretsCard />);
    expect(screen.getByText('não lido por nenhuma edge hoje')).toBeInTheDocument();
  });

  it('bloqueia o cadastro sem provedor e nao chama o banco', async () => {
    render(<WebhookSecretsCard />);
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar novo segredo de webhook' }));

    const secretInput = screen.getByLabelText('Segredo compartilhado') as HTMLInputElement;
    expect(secretInput.value).toMatch(/^[0-9a-f]{64}$/);

    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));
    expect(await screen.findByText('Informe o provedor')).toBeInTheDocument();
    expect(saveSecret).not.toHaveBeenCalled();
  });

  it('cadastra com provedor normalizado e segredo gerado', async () => {
    render(<WebhookSecretsCard />);
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar novo segredo de webhook' }));

    fireEvent.change(screen.getByLabelText('Provedor do webhook'), { target: { value: '  Stripe ' } });
    const secret = (screen.getByLabelText('Segredo compartilhado') as HTMLInputElement).value;

    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));
    await waitFor(() => expect(saveSecret).toHaveBeenCalledWith({ provider: 'stripe', secret, mode: 'create' }));
    await waitFor(() => expect(screen.queryByText('Novo segredo de webhook')).not.toBeInTheDocument());
  });

  it('rotaciona mantendo o provedor travado', async () => {
    render(<WebhookSecretsCard />);
    fireEvent.click(screen.getByRole('button', { name: 'Rotacionar segredo de generic-provider' }));

    const providerInput = screen.getByLabelText('Provedor do webhook') as HTMLInputElement;
    expect(providerInput.value).toBe('generic-provider');
    expect(providerInput.disabled).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Rotacionar' }));
    await waitFor(() =>
      expect(saveSecret).toHaveBeenCalledWith({
        provider: 'generic-provider',
        secret: expect.stringMatching(/^[0-9a-f]{64}$/),
        mode: 'rotate',
      }),
    );
  });

  it('exclui somente depois da confirmacao', async () => {
    render(<WebhookSecretsCard />);
    fireEvent.click(screen.getByRole('button', { name: 'Excluir segredo de generic-provider' }));
    expect(screen.getByText(/Excluir segredo de generic-provider\?/)).toBeInTheDocument();
    expect(deleteSecret).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    await waitFor(() => expect(deleteSecret).toHaveBeenCalledWith('secret-1'));
  });

  it('mostra o erro de leitura com opcao de tentar de novo', () => {
    const refetch = vi.fn();
    setHookState({ secrets: [], error: new Error('permission denied'), refetch });
    render(<WebhookSecretsCard />);
    expect(screen.getByText('permission denied')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(refetch).toHaveBeenCalled();
  });
});