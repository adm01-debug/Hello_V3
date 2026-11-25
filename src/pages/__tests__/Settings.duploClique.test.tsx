import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const state = vi.hoisted(() => ({ isSaving: false, savePreferences: vi.fn() }));

vi.mock('@/hooks/useNotificationPreferences', () => ({
  useNotificationPreferences: () => ({
    preferences: null,
    savePreferences: state.savePreferences,
    isSaving: state.isSaving,
  }),
}));
vi.mock('@/hooks/usePageTitle', () => ({ usePageTitle: () => {} }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }) }));
vi.mock('@/components/settings/ProfileSettings', () => ({ ProfileSettings: () => null }));
vi.mock('@/components/settings/BitrixIntegration', () => ({ BitrixIntegration: () => null }));
vi.mock('@/components/settings/VoipSettings', () => ({ VoipSettings: () => null }));
vi.mock('@/components/settings/SystemMaintenancePanel', () => ({ SystemMaintenancePanel: () => null }));

import Settings from '../Settings';

const abrirAba = (nome: RegExp) => {
  const tab = screen.getByRole('tab', { name: nome });
  fireEvent.mouseDown(tab, { button: 0 });
  fireEvent.click(tab);
};

describe('Settings — protecao contra duplo clique ao salvar', () => {
  it('desabilita os dois botoes de salvar enquanto a gravacao esta em voo', () => {
    state.isSaving = false;
    const { rerender } = render(<Settings />);

    abrirAba(/Notifica/);
    const notificacoes = screen.getByRole('button', { name: /Salvar preferências/ });
    expect(notificacoes).toBeEnabled();

    state.isSaving = true;
    rerender(<Settings />);

    const salvando = screen.getByRole('button', { name: /Salvando/ });
    expect(salvando).toBeDisabled();
  });

  it('protege tambem o botao da aba de audio', () => {
    state.isSaving = false;
    const { rerender } = render(<Settings />);

    abrirAba(/Áudio/);
    expect(screen.getByRole('button', { name: /Salvar configurações/ })).toBeEnabled();

    state.isSaving = true;
    rerender(<Settings />);

    const salvando = screen.getByRole('button', { name: /Salvando/ });
    expect(salvando).toBeDisabled();
  });
});