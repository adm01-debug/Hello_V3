import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useSuccessPlans } from '@/hooks/useSuccessPlans';
import SuccessPlans from '../SuccessPlans';

vi.mock('@/hooks/useSuccessPlans', () => ({ useSuccessPlans: vi.fn() }));
vi.mock('@/hooks/usePageTitle', () => ({ usePageTitle: vi.fn() }));

const base = {
  plans: [] as unknown[],
  milestones: {} as Record<string, unknown[]>,
  loading: false,
  error: null as string | null,
  toggleMilestone: vi.fn(),
};

describe('SuccessPlans', () => {
  beforeEach(() => {
    vi.mocked(useSuccessPlans).mockReturnValue({ ...base } as unknown as ReturnType<typeof useSuccessPlans>);
  });

  it('shows the read error instead of "no success plan yet"', () => {
    vi.mocked(useSuccessPlans).mockReturnValue({ ...base, error: 'permission denied' } as unknown as ReturnType<typeof useSuccessPlans>);
    render(<SuccessPlans />);

    expect(screen.getByText(/Não foi possível carregar os planos de sucesso/)).toBeInTheDocument();
    expect(screen.queryByText('Nenhum plano de sucesso ainda')).not.toBeInTheDocument();
  });

  it('shows the genuine empty state when the read succeeded', () => {
    render(<SuccessPlans />);

    expect(screen.getByText('Nenhum plano de sucesso ainda')).toBeInTheDocument();
    expect(screen.queryByText(/Não foi possível carregar os planos de sucesso/)).not.toBeInTheDocument();
  });
});
