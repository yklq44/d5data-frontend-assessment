import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { cx } from '../../lib/cx';
import { RESUME_EXTENSIONS, RESUME_MAX_SIZE } from '../../lib/fileValidation';
import { mockUpload, type UploadFn } from '../../lib/mockUpload';
import { Button } from '../Button/Button';
import { FileDropzone, type DropzoneStatus } from '../FileDropzone/FileDropzone';
import { Stepper } from '../Stepper/Stepper';
import { Toast, type ToastMessage } from '../Toast/Toast';
import styles from './UploadCard.module.css';

export interface UploadCardProps {
  className?: string;
  /** Injected for tests or a real backend; defaults to a simulated upload. */
  upload?: UploadFn;
  onBack?: () => void;
}

export function UploadCard({ className, upload = mockUpload, onBack }: UploadCardProps) {
  const titleId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<DropzoneStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const uploadRef = useRef<AbortController | null>(null);

  useEffect(() => () => uploadRef.current?.abort(), []);

  const notify = (tone: ToastMessage['tone'], text: string) => setToast({ id: Date.now(), tone, text });
  const dismissToast = useCallback(() => setToast(null), []);

  const cancelUpload = () => {
    uploadRef.current?.abort();
    uploadRef.current = null;
  };

  const handleSelect = (next: File) => {
    cancelUpload();
    setFile(next);
    setStatus('selected');
    setProgress(0);
    setError(null);
  };

  const handleRemove = () => {
    cancelUpload();
    setFile(null);
    setStatus('idle');
    setProgress(0);
    setError(null);
  };

  const handleBack = () => {
    if (onBack) onBack();
    else notify('info', 'The previous step is not part of this demo.');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'uploading') return;
    if (!file) {
      notify('info', 'Upload skipped. You can add your resume later.');
      return;
    }
    if (status === 'success') {
      notify('success', 'Your resume has already been uploaded.');
      return;
    }

    const controller = new AbortController();
    uploadRef.current = controller;
    setStatus('uploading');
    setProgress(0);
    setError(null);
    try {
      await upload(file, { signal: controller.signal, onProgress: setProgress });
      setStatus('success');
      notify('success', `“${file.name}” has been uploaded.`);
    } catch {
      if (controller.signal.aborted) return;
      setStatus('selected');
      setError('Upload failed. Please try again.');
    } finally {
      if (uploadRef.current === controller) uploadRef.current = null;
    }
  };

  const uploading = status === 'uploading';

  return (
    <section className={cx(styles.card, className)} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.title}>
        Upload file
      </h2>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <FileDropzone
          className={styles.dropzone}
          name="resume"
          accept={RESUME_EXTENSIONS}
          maxSize={RESUME_MAX_SIZE}
          file={file}
          status={status}
          progress={progress}
          error={error}
          hint="Drag your resume file to this area, or click on the area to select the appropriate file to upload"
          onSelect={handleSelect}
          onReject={setError}
          onRemove={handleRemove}
        />

        <div className={styles.actions}>
          <Button variant="secondary" onClick={handleBack} disabled={uploading}>
            Last step
          </Button>
          <Button variant="primary" type="submit" loading={uploading}>
            {uploading ? 'Uploading' : 'Finish'}
          </Button>
        </div>
      </form>

      <Stepper className={styles.stepper} total={3} current={2} complete={status === 'success'} />

      <Toast message={toast} onDismiss={dismissToast} />
    </section>
  );
}
