export const RESUME_EXTENSIONS = ['.pdf', '.doc', '.docx'] as const;
export const RESUME_MAX_SIZE = 10 * 1024 * 1024;

export interface FileRules {
  accept: readonly string[];
  maxSize: number;
}

export function getExtension(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot === -1 ? '' : fileName.slice(dot).toLowerCase();
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const rounded = value < 10 ? Math.round(value * 10) / 10 : Math.round(value);
  return `${rounded} ${units[unit]}`;
}

/** ['.pdf', '.doc', '.docx'] -> "PDF, DOC or DOCX" */
export function describeAccept(accept: readonly string[]): string {
  const names = accept.map((ext) => ext.replace(/^\./, '').toUpperCase());
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} or ${names[names.length - 1]}`;
}

/** Returns a user-facing error message, or null when the file is acceptable. */
export function validateFile(file: File, { accept, maxSize }: FileRules): string | null {
  if (!accept.includes(getExtension(file.name))) {
    return `Unsupported file type. Please upload a ${describeAccept(accept)} file.`;
  }
  if (file.size === 0) {
    return 'This file is empty. Please choose another file.';
  }
  if (file.size > maxSize) {
    return `This file is too large. The maximum size is ${formatBytes(maxSize)}.`;
  }
  return null;
}
