import express from 'express';
import puppeteer from 'puppeteer';

import createLogger from '@pshaw/logger';
const l = createLogger();
l.info('Serving bundle...');
const app = express();
app.use('/', express.static('dist'));
const PORT = 3000;
app.listen(PORT, async () => {
  l.info(`Listening on port ${PORT}`);
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://localhost:3000', { waitUntil: 'networkidle2' });
  const filename = 'resume.pdf';
  await page.pdf({ path: filename, format: 'A4', printBackground: true });
  l.info(`Saved PDF as ${filename}`);
  process.exit(0);
});
