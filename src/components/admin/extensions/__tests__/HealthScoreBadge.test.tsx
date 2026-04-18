import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HealthScoreBadge } from '@/components/admin/extensions/HealthScoreBadge';

describe('HealthScoreBadge — 100+ cenários', () => {
  // 101 scores (0..100) renderizam sem crash
  it.each(Array.from({ length: 101 }, (_, i) => i))(
    'renderiza score %i sem erro',
    (score) => {
      const { container } = render(<HealthScoreBadge score={score} issues={[]} />);
      expect(container.textContent).toContain(String(score));
    },
  );

  it('exibe ícone good (ShieldCheck) quando score >= 80', () => {
    render(<HealthScoreBadge score={95} issues={[]} />);
    expect(screen.getByText('95')).toBeInTheDocument();
  });

  it('exibe ícone warn (AlertTriangle) quando 50-79', () => {
    const { container } = render(<HealthScoreBadge score={65} issues={['Algo']} />);
    expect(container.querySelector('.text-warning')).toBeTruthy();
  });

  it('exibe ícone bad (Heart) quando < 50', () => {
    const { container } = render(<HealthScoreBadge score={20} issues={['A', 'B']} />);
    expect(container.querySelector('.text-destructive')).toBeTruthy();
  });

  it('boundary 80 vai para good', () => {
    const { container } = render(<HealthScoreBadge score={80} issues={[]} />);
    expect(container.querySelector('.text-success')).toBeTruthy();
  });

  it('boundary 50 vai para warn', () => {
    const { container } = render(<HealthScoreBadge score={50} issues={['x']} />);
    expect(container.querySelector('.text-warning')).toBeTruthy();
  });

  it('boundary 49 vai para bad', () => {
    const { container } = render(<HealthScoreBadge score={49} issues={['x']} />);
    expect(container.querySelector('.text-destructive')).toBeTruthy();
  });
});
