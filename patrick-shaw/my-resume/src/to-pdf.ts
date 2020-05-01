import { logger, consoleTransport } from '@pshaw/logger';
import express from 'express';
import puppeteer from 'puppeteer';
const l = logger().add(consoleTransport());
l.info('Serving bundle...');
const app = express();
app.use('/', express.static('dist'));
const PORT = 3000;
app.listen(PORT, async () => {
  l.info(`Listing on port ${PORT}`);
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  const filename = 'resume.pdf';
  await page.pdf({ path: filename, format: 'A4', printBackground: true });
  l.info(`Saved PDF as ${filename}`);
  process.exit(0);
});
