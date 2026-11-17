import { useEffect } from 'react';
import { CloseIcon, InfoIcon, SuccessIcon } from '../icons';
import styles from './Toast.module.css';

export interface ToastMessage {
  id: number;
  tone: 'info' | 'success';
  text: string;
}

export interface ToastProps {
  message: ToastMessage | null;
  onDismiss: () => void;
  duration?: number;
}

/** The live region stays mounted so screen readers announce every new message. */
export function Toast({ message, onDismiss, duration = 3500 }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onDismiss, duration);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss, duration]);

  return (
    <output className={styles.region} aria-live="polite">
      {message && (
        <div key={message.id} className={styles.toast} data-tone={message.tone}>
          {message.tone === 'success' ? (
            <SuccessIcon className={styles.icon} />
          ) : (
            <InfoIcon className={styles.icon} />
          )}
          <span className={styles.text}>{message.text}</span>
          <button type="button" className={styles.close} onClick={onDismiss} aria-label="Dismiss notification">
            <CloseIcon className={styles.closeIcon} />
          </button>
        </div>
      )}
    </output>
  );
}
