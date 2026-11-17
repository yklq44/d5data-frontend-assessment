import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Stepper } from './Stepper';

describe('Stepper', () => {
  it('marks earlier steps as completed and the current one with aria-current', () => {
    render(<Stepper total={3} current={2} />);
    const items = screen.getAllByRole('listitem');

    expect(screen.getByRole('list', { name: 'Progress' })).toBeInTheDocument();
    expect(items.map((item) => item.textContent)).toEqual([
      'Step 1 of 3, completed',
      'Step 2 of 3, completed',
      '3Step 3 of 3, current step',
    ]);
    expect(items[2]).toHaveAttribute('aria-current', 'step');
  });

  it('renders upcoming steps and a fully completed state', () => {
    const { rerender } = render(<Stepper total={3} current={0} />);
    expect(screen.getByText('Step 3 of 3, not started')).toBeInTheDocument();

    rerender(<Stepper total={3} current={2} complete />);
    expect(screen.getByText('Step 3 of 3, completed')).toBeInTheDocument();
    expect(screen.queryByRole('listitem', { current: 'step' })).not.toBeInTheDocument();
  });
});
