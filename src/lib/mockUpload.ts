export interface UploadOptions {
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

export type UploadFn = (file: File, options?: UploadOptions) => Promise<void>;

/**
 * Simulates a network upload with progress events.
 * Swap it for a real implementation (e.g. XMLHttpRequest + FormData) with the same signature.
 */
export function mockUpload(
  _file: File,
  { onProgress, signal }: UploadOptions = {},
  duration = 1600,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const abortError = () => new DOMException('The upload was aborted.', 'AbortError');
    if (signal?.aborted) {
      reject(abortError());
      return;
    }

    const startedAt = Date.now();
    let timer = 0;
    const onAbort = () => {
      window.clearInterval(timer);
      reject(abortError());
    };

    timer = window.setInterval(() => {
      const percent = Math.min(100, Math.round(((Date.now() - startedAt) / duration) * 100));
      onProgress?.(percent);
      if (percent >= 100) {
        window.clearInterval(timer);
        signal?.removeEventListener('abort', onAbort);
        resolve();
      }
    }, 80);

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
