import {
  Fragment,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from 'react';
import { cx } from '../../lib/cx';
import { describeAccept, formatBytes, getExtension, validateFile } from '../../lib/fileValidation';
import { AlertIcon, CheckIcon, CloseIcon, CloudUploadIcon, FileIcon } from '../icons';
import styles from './FileDropzone.module.css';

export type DropzoneStatus = 'idle' | 'selected' | 'uploading' | 'success';

export interface FileDropzoneProps {
  /** Allowed extensions, e.g. ['.pdf', '.docx']. */
  accept: readonly string[];
  /** Maximum file size in bytes. */
  maxSize: number;
  file: File | null;
  status: DropzoneStatus;
  /** Upload progress (0–100), shown while status is "uploading". */
  progress?: number;
  error?: string | null;
  hint: ReactNode;
  name?: string;
  className?: string;
  onSelect: (file: File) => void;
  onReject: (message: string) => void;
  onRemove: () => void;
}

const carriesFiles = (event: { dataTransfer: DataTransfer | null }) =>
  Array.from(event.dataTransfer?.types ?? []).includes('Files');

export function FileDropzone({
  accept,
  maxSize,
  file,
  status,
  progress = 0,
  error,
  hint,
  name,
  className,
  onSelect,
  onReject,
  onRemove,
}: FileDropzoneProps) {
  const inputId = useId();
  const rulesId = useId();
  const errorId = useId();
  const dragDepth = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const disabled = status === 'uploading';

  // A file dropped next to the zone would otherwise make the browser navigate away to open it.
  useEffect(() => {
    const blockStrayDrop = (event: globalThis.DragEvent) => {
      if (event.defaultPrevented || !carriesFiles(event)) return;
      event.preventDefault();
      if (event.type === 'dragover' && event.dataTransfer) event.dataTransfer.dropEffect = 'none';
    };
    window.addEventListener('dragover', blockStrayDrop);
    window.addEventListener('drop', blockStrayDrop);
    return () => {
      window.removeEventListener('dragover', blockStrayDrop);
      window.removeEventListener('drop', blockStrayDrop);
    };
  }, []);

  const handleFiles = (files: ArrayLike<File> | null) => {
    if (!files || files.length === 0) return;
    if (files.length > 1) {
      onReject('Please choose only one file.');
      return;
    }
    const candidate = files[0];
    const problem = validateFile(candidate, { accept, maxSize });
    if (problem) onReject(problem);
    else onSelect(candidate);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
    // Reset so that choosing the same file again still fires "change".
    event.target.value = '';
  };

  // Counting enter/leave pairs avoids flicker when the pointer crosses child elements.
  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    if (!carriesFiles(event)) return;
    event.preventDefault();
    if (disabled) return;
    dragDepth.current += 1;
    setIsDragging(true);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!carriesFiles(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = disabled ? 'none' : 'copy';
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (!carriesFiles(event)) return;
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    if (!carriesFiles(event)) return;
    event.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);
    if (!disabled) handleFiles(event.dataTransfer.files);
  };

  const describedBy = error ? `${rulesId} ${errorId}` : rulesId;

  return (
    <div
      className={cx(styles.root, className)}
      data-status={status}
      data-dragging={isDragging || undefined}
      data-invalid={error ? true : undefined}
      data-disabled={disabled || undefined}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <svg className={styles.border} aria-hidden="true" focusable="false">
        <rect width="100%" height="100%" rx="15" ry="15" />
      </svg>

      <input
        id={inputId}
        className={cx('visually-hidden', styles.input)}
        type="file"
        name={name}
        accept={accept.join(',')}
        disabled={disabled}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        onChange={handleChange}
      />
      <label htmlFor={inputId} className={styles.trigger}>
        <CloudUploadIcon className={styles.icon} />
        <span className={styles.hint}>{hint}</span>
      </label>
      <p id={rulesId} className="visually-hidden">
        {`Accepted formats: ${describeAccept(accept)}. Maximum size: ${formatBytes(maxSize)}.`}
      </p>

      {(error || file) && (
        <div className={styles.footer}>
          {error && (
            <p id={errorId} className={styles.error} role="alert">
              <AlertIcon className={styles.errorIcon} />
              {error}
            </p>
          )}
          {file && <FileItem file={file} status={status} progress={progress} onRemove={onRemove} />}
        </div>
      )}
    </div>
  );
}

interface FileItemProps {
  file: File;
  status: DropzoneStatus;
  progress: number;
  onRemove: () => void;
}

function FileItem({ file, status, progress, onRemove }: FileItemProps) {
  const uploading = status === 'uploading';
  const stateText =
    status === 'success' ? 'Uploaded' : uploading ? `Uploading… ${progress}%` : 'Ready to upload';
  const details = [getExtension(file.name).slice(1).toUpperCase(), formatBytes(file.size)].filter(Boolean);

  return (
    <div className={styles.file} data-status={status}>
      <FileIcon className={styles.fileIcon} />
      <div className={styles.fileText}>
        <span className={styles.fileName} title={file.name}>
          {file.name}
        </span>
        <span className={styles.fileMeta}>
          {details.map((detail) => (
            <Fragment key={detail}>
              {detail} <span aria-hidden="true">·</span>{' '}
            </Fragment>
          ))}
          <span className={styles.fileState}>
            {status === 'success' && <CheckIcon className={styles.fileStateIcon} />}
            {stateText}
          </span>
        </span>
      </div>
      <button
        type="button"
        className={styles.remove}
        onClick={onRemove}
        aria-label={uploading ? `Cancel uploading ${file.name}` : `Remove ${file.name}`}
        title={uploading ? 'Cancel upload' : 'Remove file'}
      >
        <CloseIcon className={styles.removeIcon} />
      </button>
      {uploading && (
        <progress className={styles.progress} max={100} value={progress} aria-label={`Uploading ${file.name}`} />
      )}
    </div>
  );
}
