import { expect, test, type Page } from '@playwright/test';

const resume = { name: 'Jane_Doe_Resume.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(245 * 1024, 1) };

const dropzone = (page: Page) => page.locator('div:has(> input[type="file"])');
const fileInput = (page: Page) => page.locator('input[type="file"]');
const hint = (page: Page) => page.getByText('Drag your resume file');

/** Builds a DataTransfer in the page; drag events cannot carry files from Node. */
const dataTransferWith = (page: Page, names: string[]) =>
  page.evaluateHandle((fileNames) => {
    const transfer = new DataTransfer();
    for (const name of fileNames) transfer.items.add(new File([new Uint8Array(1500)], name));
    return transfer;
  }, names);

let pageErrors: string[] = [];

test.beforeEach(async ({ page }) => {
  pageErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') pageErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto('./');
});

test.afterEach(() => {
  expect(pageErrors).toEqual([]);
});

test('renders the copy from the design with the Inter font', async ({ page }) => {
  await expect(page).toHaveTitle('Upload Your Resume');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Finish! Upload Your Resume');
  await expect(page.getByRole('heading', { level: 2 })).toHaveText('Upload file');
  await expect(page.getByRole('list', { name: 'Progress' }).getByRole('listitem')).toHaveCount(3);

  const interLoaded = await page.evaluate(async () => {
    await document.fonts.ready;
    return document.fonts.check('400 16px Inter') && document.fonts.check('500 16px Inter');
  });
  expect(interLoaded).toBe(true);
});

test('drop zone and buttons have hover and pressed states', async ({ page }) => {
  const zone = dropzone(page);
  await expect(zone).toHaveCSS('background-color', 'rgb(242, 250, 255)');
  await hint(page).hover();
  await expect(zone).toHaveCSS('background-color', 'rgb(234, 244, 255)');
  await expect(zone.locator('svg rect')).toHaveCSS('stroke', 'rgb(27, 90, 255)');
  await page.mouse.down();
  await expect(zone).toHaveCSS('background-color', 'rgb(225, 238, 255)');
  await page.mouse.move(5, 5);
  await page.mouse.up();

  const finish = page.getByRole('button', { name: 'Finish' });
  const back = page.getByRole('button', { name: 'Last step' });
  await expect(finish).toHaveCSS('background-color', 'rgb(27, 90, 255)');
  await expect(back).toHaveCSS('background-color', 'rgb(117, 172, 255)');

  await finish.hover();
  await expect(finish).toHaveCSS('background-color', 'rgb(61, 116, 255)');
  await back.hover();
  await expect(back).toHaveCSS('background-color', 'rgb(139, 186, 255)');
  await page.mouse.down();
  await expect(back).toHaveCSS('background-color', 'rgb(94, 156, 247)');
  // Release outside the button so that it does not count as a click.
  await page.mouse.move(5, 5);
  await page.mouse.up();
});

test('clicking anywhere in the drop zone opens the file chooser', async ({ page }) => {
  const openChooser = async (click: () => Promise<void>) => {
    const chooserPromise = page.waitForEvent('filechooser');
    await click();
    return chooserPromise;
  };

  await openChooser(() => page.locator('label').click({ position: { x: 24, y: 24 } }));
  await openChooser(() => page.locator('label svg').click());
  const chooser = await openChooser(() => hint(page).click());
  expect(chooser.isMultiple()).toBe(false);
  await chooser.setFiles(resume);

  await expect(page.getByTitle('Jane_Doe_Resume.pdf')).toBeVisible();
  await expect(page.getByText('PDF · 245 KB · Ready to upload')).toBeVisible();
});

test('rejects unsupported, oversized and empty files', async ({ page }) => {
  const input = fileInput(page);
  await input.setInputFiles(resume);

  await input.setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') });
  await expect(page.getByRole('alert')).toHaveText('Unsupported file type. Please upload a PDF, DOC or DOCX file.');
  await expect(dropzone(page)).toHaveAttribute('data-invalid', 'true');
  await expect(page.getByTitle('Jane_Doe_Resume.pdf')).toBeVisible();

  await input.setInputFiles({ name: 'huge.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(10 * 1024 * 1024 + 1) });
  await expect(page.getByRole('alert')).toHaveText(/too large/);

  await input.setInputFiles({ name: 'empty.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(0) });
  await expect(page.getByRole('alert')).toHaveText(/empty/);
});

test('accepts a dropped file and highlights the zone while dragging', async ({ page }) => {
  const zone = dropzone(page);
  const label = page.locator('label');
  const dataTransfer = await dataTransferWith(page, ['Dropped CV.docx']);

  await zone.dispatchEvent('dragenter', { dataTransfer });
  // Moving over a child element must not switch the highlight off.
  await label.dispatchEvent('dragenter', { dataTransfer });
  await zone.dispatchEvent('dragleave', { dataTransfer });
  await expect(zone).toHaveAttribute('data-dragging', 'true');
  await expect(zone).toHaveCSS('background-color', 'rgb(225, 238, 255)');

  await label.dispatchEvent('drop', { dataTransfer });
  await expect(page.getByTitle('Dropped CV.docx')).toBeVisible();
  await expect(zone).not.toHaveAttribute('data-dragging');
});

test('rejects several files dropped at once', async ({ page }) => {
  const dataTransfer = await dataTransferWith(page, ['a.pdf', 'b.pdf']);
  await dropzone(page).dispatchEvent('drop', { dataTransfer });
  await expect(page.getByRole('alert')).toHaveText('Please choose only one file.');
});

test('a file dropped outside the zone does not replace the page', async ({ page }) => {
  const prevented = await page.evaluate(() => {
    const transfer = new DataTransfer();
    transfer.items.add(new File(['x'], 'x.pdf'));
    const heading = document.querySelector('h1');
    return ['dragover', 'drop'].map((type) => {
      const event = new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: transfer });
      heading?.dispatchEvent(event);
      return event.defaultPrevented;
    });
  });
  expect(prevented).toEqual([true, true]);
});

test('a removed file can be chosen again', async ({ page }) => {
  await fileInput(page).setInputFiles(resume);
  await page.getByRole('button', { name: 'Remove Jane_Doe_Resume.pdf' }).click();
  await expect(page.getByTitle('Jane_Doe_Resume.pdf')).toHaveCount(0);

  await fileInput(page).setInputFiles(resume);
  await expect(page.getByTitle('Jane_Doe_Resume.pdf')).toBeVisible();
});

test('Finish uploads the file with progress and completes the last step', async ({ page }) => {
  await fileInput(page).setInputFiles(resume);
  await page.getByRole('button', { name: 'Finish' }).click();

  await expect(page.getByRole('button', { name: 'Uploading', exact: true })).toBeDisabled();
  await expect(page.getByRole('progressbar', { name: 'Uploading Jane_Doe_Resume.pdf' })).toBeVisible();
  await expect(fileInput(page)).toBeDisabled();

  await expect(page.getByRole('status')).toHaveText('“Jane_Doe_Resume.pdf” has been uploaded.');
  await expect(page.getByText('PDF · 245 KB · Uploaded')).toBeVisible();
  await expect(page.getByText('Step 3 of 3, completed')).toBeAttached();
  await expect(page.getByRole('button', { name: 'Finish' })).toBeEnabled();
});

test('an upload can be cancelled', async ({ page }) => {
  await fileInput(page).setInputFiles(resume);
  await page.getByRole('button', { name: 'Finish' }).click();
  await page.getByRole('button', { name: 'Cancel uploading Jane_Doe_Resume.pdf' }).click();

  await expect(dropzone(page)).toHaveAttribute('data-status', 'idle');
  await expect(page.getByTitle('Jane_Doe_Resume.pdf')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Finish' })).toBeEnabled();
});

test('Finish without a file skips the step and Last step gives feedback', async ({ page }) => {
  await page.getByRole('button', { name: 'Finish' }).click();
  await expect(page.getByRole('status')).toHaveText('Upload skipped. You can add your resume later.');

  await page.getByRole('button', { name: 'Last step' }).click();
  await expect(page.getByRole('status')).toHaveText('The previous step is not part of this demo.');

  await page.getByRole('button', { name: 'Dismiss notification' }).click();
  await expect(page.getByRole('status')).toBeEmpty();
});

test('works with the keyboard', async ({ page }) => {
  await page.keyboard.press('Tab');
  await expect(fileInput(page)).toBeFocused();
  await expect(dropzone(page)).toHaveCSS('outline-style', 'solid');

  const chooserPromise = page.waitForEvent('filechooser');
  await page.keyboard.press('Enter');
  await chooserPromise;

  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Last step' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Finish' })).toBeFocused();
});

test.describe('responsive layout', () => {
  const sizes = [
    [1920, 1080],
    [1536, 864],
    [1440, 900],
    [1366, 768],
    [1280, 800],
    [1024, 768],
    [768, 1024],
    [390, 844],
    [320, 640],
  ] as const;

  for (const [width, height] of sizes) {
    test(`has no horizontal scrolling at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBe(0);
    });
  }

  test('places the card next to the intro from 1280px and below it on smaller screens', async ({ page }) => {
    const intro = page.locator('header');
    const card = page.locator('section');

    await page.setViewportSize({ width: 1280, height: 800 });
    let introBox = await intro.boundingBox();
    let cardBox = await card.boundingBox();
    expect(cardBox!.x).toBeGreaterThanOrEqual(introBox!.x + introBox!.width);
    expect(cardBox!.y).toBeLessThan(introBox!.y + introBox!.height);

    await page.setViewportSize({ width: 1279, height: 800 });
    introBox = await intro.boundingBox();
    cardBox = await card.boundingBox();
    expect(cardBox!.y).toBeGreaterThanOrEqual(introBox!.y + introBox!.height);
  });
});
