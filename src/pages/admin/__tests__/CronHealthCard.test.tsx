// Etapa 231 - card de saude dos crons agendados na pagina de saude do banco.
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CronHealthCard } from '@/pages/admin/database-health/CronHealthCard';
import type { CronHealthRow } from '@/pages/admin/database-health/types';

function row(partial: Partial<CronHealthRow>): CronHealthRow {
  return {
    jobname: 'job-teste',
    schedule: '0 * * * *',
    active: true,
    last_status: 'succeeded',
    last_start: '2026-11-26T12:00:00.000Z',
    last_end: '2026-11-26T12:00:02.000Z',
    last_duration_seconds: 2,
    runs_24h: 24,
    failures_24h: 0,
    hours_since_last: 1,
    expected_every_minutes: 60,
    state: 'ok',
    ...partial,
  };
}

describe('CronHealthCard', () => {
  it('mostra esqueleto enquanto carrega', () => {
    const { container } = render(<CronHealthCard isLoading rows={undefined} />);
    expect(container.querySelector('[data-slot="skeleton"], .animate-pulse')).not.toBeNull();
    expect(screen.queryByText('Nenhum cron agendado encontrado.')).toBeNull();
  });

  it('avisa quando nao ha cron agendado', () => {
    render(<CronHealthCard isLoading={false} rows={[]} />);
    expect(screen.getByText('Nenhum cron agendado encontrado.')).toBeTruthy();
  });

  it('exibe job saudavel com cadencia e execucoes', () => {
    render(<CronHealthCard isLoading={false} rows={[row({})]} />);
    expect(screen.getByText('job-teste')).toBeTruthy();
    expect(screen.getByText('ok')).toBeTruthy();
    expect(screen.getByText(/a cada ~60 min/)).toBeTruthy();
    expect(screen.getByText((_, el) => el?.textContent === '24 execuções · 0 falhas (0%)')).toBeTruthy();
  });

  it('marca job falhando e conta as falhas de 24h', () => {
    render(
      <CronHealthCard
        isLoading={false}
        rows={[row({ jobname: 'notify-spike', state: 'falhando', last_status: 'failed', runs_24h: 10, failures_24h: 3 })]}
      />,
    );
    expect(screen.getAllByText('falhando').length).toBeGreaterThan(0);
    const falhas = screen.getByText(/3 falhas/);
    expect(falhas.textContent).toContain('(30%)');
    expect(falhas.className).toContain('text-destructive');
  });

  it('marca job parado pelo tempo desde a ultima execucao', () => {
    render(<CronHealthCard isLoading={false} rows={[row({ jobname: 'sla-watch', state: 'parado', hours_since_last: 9 })]} />);
    expect(screen.getAllByText('parado').length).toBeGreaterThan(0);
    expect(screen.getByText(/última execução há 9 h/)).toBeTruthy();
  });

  it('trata job inativo e job que nunca executou', () => {
    render(
      <CronHealthCard
        isLoading={false}
        rows={[
          row({ jobname: 'cron-antigo', active: false, state: 'inativo', runs_24h: 0, hours_since_last: null }),
          row({ jobname: 'cron-novo', state: 'nunca_executou', last_status: null, hours_since_last: null, runs_24h: 0 }),
        ]}
      />,
    );
    expect(screen.getByText('inativo')).toBeTruthy();
    expect(screen.getByText('nunca executou')).toBeTruthy();
    expect(screen.getAllByText(/0 falhas \(—\)/)).toHaveLength(2);
  });

  it('explica o criterio de falhando e parado', () => {
    render(<CronHealthCard isLoading={false} rows={[row({})]} />);
    expect(screen.getByText(/três vezes a cadência observada/)).toBeTruthy();
  });
});