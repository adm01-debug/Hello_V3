import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SurveysPanel } from '../SurveysPanel';
import { toast } from 'sonner';

const sendSurvey = vi.fn();
const createSurvey = vi.fn();
const deactivateSurvey = vi.fn();
const refresh = vi.fn();

type Def = {
  id: string;
  name: string;
  survey_type: string;
  description: string | null;
  questions: unknown[];
  is_active: boolean;
};

let definitions: Def[] = [];

vi.mock('@/hooks/useSurveys', () => ({
  useSurveys: () => ({ responses: [], loading: false, npsScore: null, refresh, sendSurvey }),
  useSurveyDefinitions: () => ({
    surveys: definitions,
    loading: false,
    refresh,
    createSurvey,
    deactivateSurvey,
  }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

const nps: Def = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'NPS pos-chamada',
  survey_type: 'nps',
  description: null,
  questions: [],
  is_active: true,
};
const csat: Def = {
  id: '22222222-2222-2222-2222-222222222222',
  name: 'CSAT suporte',
  survey_type: 'csat',
  description: null,
  questions: [],
  is_active: true,
};

describe('SurveysPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    definitions = [nps, csat];
    sendSurvey.mockResolvedValue(undefined);
    createSurvey.mockResolvedValue({ id: 'novo-id', name: 'Nova', survey_type: 'nps' });
    deactivateSurvey.mockResolvedValue(undefined);
  });

  it('envia a pesquisa escolhida pelo id real (nao um valor fixo)', async () => {
    render(<SurveysPanel />);
    const select = screen.getByLabelText('Pesquisa a enviar');
    await waitFor(() => expect(select).toHaveValue(nps.id));

    fireEvent.change(select, { target: { value: csat.id } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    await waitFor(() =>
      expect(sendSurvey).toHaveBeenCalledWith({
        survey_id: csat.id,
        contact_id: undefined,
        channel: 'whatsapp',
      })
    );
    expect(sendSurvey).not.toHaveBeenCalledWith(expect.objectContaining({ survey_id: 'nps' }));
  });

  it('sem pesquisa cadastrada bloqueia o envio e explica o motivo', () => {
    definitions = [];
    render(<SurveysPanel />);
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled();
    expect(screen.getByText(/Nenhuma pesquisa ativa\. Crie uma pesquisa/)).toBeInTheDocument();
  });

  it('cria pesquisa com o nome informado', async () => {
    definitions = [];
    render(<SurveysPanel />);
    fireEvent.change(screen.getByLabelText('Nome da nova pesquisa'), {
      target: { value: 'NPS pos-chamada' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Nova pesquisa' }));
    await waitFor(() => expect(createSurvey).toHaveBeenCalledWith('NPS pos-chamada'));
  });

  it('nao cria pesquisa sem nome', () => {
    render(<SurveysPanel />);
    fireEvent.click(screen.getByRole('button', { name: 'Nova pesquisa' }));
    expect(createSurvey).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Informe o nome da pesquisa');
  });

  it('desativa a pesquisa escolhida', async () => {
    render(<SurveysPanel />);
    fireEvent.click(screen.getByLabelText(`Desativar pesquisa ${csat.name}`));
    await waitFor(() => expect(deactivateSurvey).toHaveBeenCalledWith(csat.id));
  });
});