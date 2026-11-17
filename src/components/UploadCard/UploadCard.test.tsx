import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { UploadFn, UploadOptions } from '../../lib/mockUpload';
import { UploadCard } from './UploadCard';

const HINT = /drag your resume file to this area/i;
const pdf = (name = 'Jane_Doe_Resume.pdf', size = 245 * 1024) =>
  new File([new Uint8Array(size)], name, { type: 'application/pdf' });

/** An upload whose progress and completion are driven by the test. */
function controllableUpload() {
  let options: UploadOptions = {};
  let finish: () => void = () => {};
  let fail: (error: Error) => void = () => {};
  const upload = vi.fn<UploadFn>(
    (_file, opts = {}) =>
      new Promise<void>((resolve, reject) => {
        options = opts;
        finish = resolve;
        fail = reject;
        opts.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
      }),
  );
  return {
    upload,
    progress: (value: number) => act(() => options.onProgress?.(value)),
    finish: () => act(async () => finish()),
    fail: () => act(async () => fail(new Error('network down'))),
  };
}

function setup(props: Parameters<typeof UploadCard>[0] = {}) {
  const user = userEvent.setup({ applyAccept: false });
  render(<UploadCard {...props} />);
  const input = screen.getByLabelText(HINT) as HTMLInputElement;
  const dropzone = input.closest('[data-status]') as HTMLElement;
  return { user, input, dropzone };
}

describe('UploadCard', () => {
  it('renders the design structure with accessible names', () => {
    setup();
    expect(screen.getByRole('region', { name: 'Upload file' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Upload file' })).toBeInTheDocument();
    expect(screen.getByLabelText(HINT)).toHaveAttribute('type', 'file');
    expect(screen.getByLabelText(HINT)).toHaveAttribute('accept', '.pdf,.doc,.docx');
    expect(screen.getByRole('button', { name: 'Last step' })).toHaveAttribute('type', 'button');
    expect(screen.getByRole('button', { name: 'Finish' })).toHaveAttribute('type', 'submit');
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('shows the selected file name, type and size', async () => {
    const { user, input } = setup();
    await user.upload(input, pdf());

    expect(screen.getByTitle('Jane_Doe_Resume.pdf')).toHaveTextContent('Jane_Doe_Resume.pdf');
    expect(screen.getByText('PDF 245 KB')).toHaveTextContent('PDF · 245 KB · Ready to upload');
  });

  it('rejects an unsupported file with an inline error', async () => {
    const { user, input, dropzone } = setup();
    await user.upload(input, new File(['x'], 'photo.png', { type: 'image/png' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Unsupported file type. Please upload a PDF, DOC or DOCX file.');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(dropzone).toHaveAttribute('data-invalid', 'true');
    expect(screen.queryByTitle('photo.png')).not.toBeInTheDocument();
  });

  it('accepts a dropped file and highlights the zone while dragging', () => {
    const { dropzone } = setup();
    const dataTransfer = { files: [pdf('cv.docx')], types: ['Files'], dropEffect: 'none' };

    fireEvent.dragEnter(dropzone, { dataTransfer });
    fireEvent.dragEnter(dropzone.querySelector('label')!, { dataTransfer });
    fireEvent.dragLeave(dropzone, { dataTransfer });
    expect(dropzone).toHaveAttribute('data-dragging', 'true');

    fireEvent.drop(dropzone, { dataTransfer });
    expect(dropzone).not.toHaveAttribute('data-dragging');
    expect(screen.getByTitle('cv.docx')).toBeInTheDocument();
  });

  it('ignores drags that do not carry files', () => {
    const { dropzone } = setup();
    fireEvent.dragEnter(dropzone, { dataTransfer: { files: [], types: ['text/plain'] } });
    expect(dropzone).not.toHaveAttribute('data-dragging');
  });

  it('rejects dropping more than one file', () => {
    const { dropzone } = setup();
    fireEvent.drop(dropzone, { dataTransfer: { files: [pdf('a.pdf'), pdf('b.pdf')], types: ['Files'] } });
    expect(screen.getByRole('alert')).toHaveTextContent('Please choose only one file.');
  });

  it('removes the selected file and allows choosing the same file again', async () => {
    const { user, input } = setup();
    const file = pdf();
    await user.upload(input, file);
    await user.click(screen.getByRole('button', { name: 'Remove Jane_Doe_Resume.pdf' }));
    expect(screen.queryByTitle('Jane_Doe_Resume.pdf')).not.toBeInTheDocument();

    await user.upload(input, file);
    expect(screen.getByTitle('Jane_Doe_Resume.pdf')).toBeInTheDocument();
  });

  it('uploads on Finish, reports progress and completes the stepper', async () => {
    const transport = controllableUpload();
    const { user, input } = setup({ upload: transport.upload });
    await user.upload(input, pdf());
    await user.click(screen.getByRole('button', { name: 'Finish' }));

    expect(transport.upload).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Uploading' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Last step' })).toBeDisabled();
    expect(input).toBeDisabled();

    transport.progress(40);
    expect(screen.getByRole('progressbar', { name: 'Uploading Jane_Doe_Resume.pdf' })).toHaveValue(40);
    expect(screen.getByText('Uploading… 40%')).toBeInTheDocument();

    await transport.finish();
    expect(screen.getByText('Uploaded')).toBeInTheDocument();
    expect(within(screen.getByRole('status')).getByText('“Jane_Doe_Resume.pdf” has been uploaded.')).toBeInTheDocument();
    expect(screen.getByText('Step 3 of 3, completed')).toBeInTheDocument();
  });

  it('cancels an upload in progress', async () => {
    const transport = controllableUpload();
    const { user, input, dropzone } = setup({ upload: transport.upload });
    await user.upload(input, pdf());
    await user.click(screen.getByRole('button', { name: 'Finish' }));
    await user.click(screen.getByRole('button', { name: 'Cancel uploading Jane_Doe_Resume.pdf' }));

    expect(dropzone).toHaveAttribute('data-status', 'idle');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Finish' })).toBeEnabled();
  });

  it('shows an error when the upload fails and lets the user retry', async () => {
    const transport = controllableUpload();
    const { user, input } = setup({ upload: transport.upload });
    await user.upload(input, pdf());
    await user.click(screen.getByRole('button', { name: 'Finish' }));
    await transport.fail();

    expect(screen.getByRole('alert')).toHaveTextContent('Upload failed. Please try again.');
    expect(screen.getByRole('button', { name: 'Finish' })).toBeEnabled();
  });

  it('treats Finish without a file as skipping the step', async () => {
    const transport = controllableUpload();
    const { user } = setup({ upload: transport.upload });
    await user.click(screen.getByRole('button', { name: 'Finish' }));

    expect(transport.upload).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('Upload skipped. You can add your resume later.');
  });

  it('calls onBack for "Last step", with a fallback notice', async () => {
    const onBack = vi.fn<() => void>();
    const { user } = setup({ onBack });
    await user.click(screen.getByRole('button', { name: 'Last step' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('auto-dismisses notifications', async () => {
    vi.useFakeTimers();
    try {
      render(<UploadCard />);
      fireEvent.click(screen.getByRole('button', { name: 'Last step' }));
      expect(screen.getByRole('status')).toHaveTextContent('The previous step is not part of this demo.');
      act(() => vi.advanceTimersByTime(3600));
      expect(screen.getByRole('status')).toBeEmptyDOMElement();
    } finally {
      vi.useRealTimers();
    }
  });
});
