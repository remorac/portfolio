// Render the portfolio (index.html) to a print-optimized portfolio.pdf using
// the locally installed Google Chrome via puppeteer-core (no bundled browser).
//
//   npm run pdf
//
// Override the browser with CHROME_PATH=/path/to/chrome if needed.

import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';
import puppeteer from 'puppeteer-core';
import { PDFDocument, PDFName } from 'pdf-lib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const indexUrl = pathToFileURL(resolve(projectRoot, 'print.html')).href;
const outputPath = resolve(projectRoot, 'portfolio.pdf');

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

const { existsSync } = await import('node:fs');
const executablePath = CHROME_CANDIDATES.find((p) => existsSync(p));

if (!executablePath) {
  console.error(
    'Could not find a Chrome/Chromium binary. Set CHROME_PATH to your browser executable.',
  );
  process.exit(1);
}

const browser = await puppeteer.launch({
  executablePath,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu'],
});

try {
  const page = await browser.newPage();
  // Wait for fonts (Google Fonts), Lucide icons (CDN), and the JS that
  // injects the project cards into #projects-grid.
  await page.goto(indexUrl, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.waitForSelector('#pdf-projects .pdf-project', { timeout: 15000 });
  await page.emulateMediaType('print');

  const pdfBytes = await page.pdf({
    printBackground: true,
    // Page size + margins come from the CSS @page rule in css/pdf.css.
    preferCSSPageSize: true,
  });

  // Chrome doesn't embed an initial-view directive, so viewers like macOS
  // Preview open at actual size — and if the window is narrower than the A4
  // page, the right margin gets cropped from view. Add an /OpenAction that
  // fits the first page to the window, and FitWindow so the page fits on open.
  const pdf = await PDFDocument.load(pdfBytes);
  const firstPageRef = pdf.getPage(0).ref;
  pdf.catalog.set(
    PDFName.of('OpenAction'),
    pdf.context.obj([firstPageRef, PDFName.of('Fit')]),
  );
  pdf.catalog.set(PDFName.of('PageLayout'), PDFName.of('SinglePage'));
  pdf.catalog.set(
    PDFName.of('ViewerPreferences'),
    pdf.context.obj({ FitWindow: true }),
  );

  await writeFile(outputPath, await pdf.save());

  console.log(`✓ Wrote ${outputPath}`);
} finally {
  await browser.close();
}
