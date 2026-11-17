import type { CSSProperties } from 'react';
import { cx } from '../../lib/cx';
import { CheckIcon } from '../icons';
import styles from './Stepper.module.css';

export interface StepperProps {
  /** Total number of steps. */
  total: number;
  /** Zero-based index of the current step; earlier steps render as completed. */
  current: number;
  /** Marks every step, including the current one, as completed. */
  complete?: boolean;
  label?: string;
  className?: string;
}

type StepState = 'complete' | 'current' | 'upcoming';

const STATE_TEXT: Record<StepState, string> = {
  complete: 'completed',
  current: 'current step',
  upcoming: 'not started',
};

export function Stepper({ total, current, complete = false, label = 'Progress', className }: StepperProps) {
  const progress = total > 1 ? Math.min(Math.max(current, 0), total - 1) / (total - 1) : 1;

  return (
    <ol
      className={cx(styles.stepper, className)}
      aria-label={label}
      data-complete={complete || undefined}
      style={{ '--progress': progress } as CSSProperties}
    >
      {Array.from({ length: total }, (_, index) => {
        const state: StepState =
          complete || index < current ? 'complete' : index === current ? 'current' : 'upcoming';
        return (
          <li
            key={index}
            className={styles.step}
            data-state={state}
            aria-current={state === 'current' ? 'step' : undefined}
          >
            <span className={styles.dot} aria-hidden="true">
              {state === 'complete' ? (
                <CheckIcon className={styles.check} />
              ) : (
                <span className={styles.number}>{index + 1}</span>
              )}
            </span>
            <span className="visually-hidden">{`Step ${index + 1} of ${total}, ${STATE_TEXT[state]}`}</span>
          </li>
        );
      })}
    </ol>
  );
}
