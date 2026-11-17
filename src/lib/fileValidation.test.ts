import { describe, expect, it } from 'vitest';
import { describeAccept, formatBytes, getExtension, validateFile } from './fileValidation';

const rules = { accept: ['.pdf', '.doc', '.docx'], maxSize: 10 * 1024 * 1024 };
const fileOf = (name: string, size: number) => new File([new Uint8Array(size)], name);

describe('getExtension', () => {
  it('returns the lower-cased extension including the dot', () => {
    expect(getExtension('Resume.PDF')).toBe('.pdf');
    expect(getExtension('my.resume.v2.docx')).toBe('.docx');
  });

  it('returns an empty string when there is no extension', () => {
    expect(getExtension('README')).toBe('');
  });
});

describe('formatBytes', () => {
  it.each([
    [512, '512 B'],
    [1024, '1 KB'],
    [1536, '1.5 KB'],
    [245 * 1024, '245 KB'],
    [10 * 1024 * 1024, '10 MB'],
    [3.25 * 1024 * 1024 * 1024, '3.3 GB'],
  ])('formats %d bytes as %s', (bytes, expected) => {
    expect(formatBytes(bytes)).toBe(expected);
  });
});

describe('describeAccept', () => {
  it('builds a readable list of formats', () => {
    expect(describeAccept(['.pdf', '.doc', '.docx'])).toBe('PDF, DOC or DOCX');
    expect(describeAccept(['.pdf'])).toBe('PDF');
  });
});

describe('validateFile', () => {
  it('accepts supported files regardless of extension case', () => {
    expect(validateFile(fileOf('cv.PDF', 100), rules)).toBeNull();
    expect(validateFile(fileOf('cv.docx', 100), rules)).toBeNull();
  });

  it('rejects unsupported types', () => {
    expect(validateFile(fileOf('photo.png', 100), rules)).toMatch(/Unsupported file type/);
    expect(validateFile(fileOf('pdf', 100), rules)).toMatch(/Unsupported file type/);
  });

  it('rejects empty files', () => {
    expect(validateFile(fileOf('cv.pdf', 0), rules)).toMatch(/empty/);
  });

  it('rejects files above the size limit', () => {
    expect(validateFile(fileOf('cv.pdf', rules.maxSize), rules)).toBeNull();
    expect(validateFile(fileOf('cv.pdf', rules.maxSize + 1), rules)).toMatch(/too large.*10 MB/);
  });
});
