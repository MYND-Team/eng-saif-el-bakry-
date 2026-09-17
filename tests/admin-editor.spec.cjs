const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const results = path.join(root, 'test-results');
fs.mkdirSync(results, { recursive: true });

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('file:///' + path.join(root, 'index.html').replaceAll('\\', '/') + '#admin');
  await page.locator('#adminUser').fill('admin');
  await page.locator('#adminPass').fill('admin123');
  await page.locator('#adminLoginForm button').click();
  await page.locator('[data-tab="design"]').click();
  await page.locator('[data-path="design.headingFont"]').selectOption('Georgia');
  await page.locator('[data-path="design.bodySize"]').fill('18');
  await page.locator('[data-path="design.buttonRadius"]').fill('0');
  await page.locator('[data-design-motion]').uncheck();
  await page.locator('[data-section-visible="about"]').uncheck();
  assert.match(
    await page.locator('html').evaluate((e) => e.style.getPropertyValue('--font-display')),
    /Georgia/,
  );
  await page.reload();
  await page.locator('[data-tab="design"]').click();
  assert.equal(await page.locator('[data-path="design.bodySize"]').inputValue(), '18');
  assert.equal(await page.locator('[data-design-motion]').isChecked(), false);
  await page.locator('[data-tab="complete"]').click();
  const nested = page.locator('[data-path="fork.0.steps.0.1"]');
  assert.equal(await nested.count(), 1);
  await nested.evaluate((e) => {
    let p = e.parentElement;
    while (p) {
      if (p.tagName === 'DETAILS') p.open = true;
      p = p.parentElement;
    }
  });
  await nested.fill('Edited craft heading');
  await page.locator('[data-tab="copy"]').click();
  const title = page.locator('[data-path="hero.eyebrow"]');
  await title.fill('Continuous typing');
  await title.pressSequentially(' works');
  assert.equal(await title.inputValue(), 'Continuous typing works');
  await page.screenshot({ path: path.join(results, 'admin-desktop.png'), fullPage: false });
  await page.locator('[data-tab="tools"]').click();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-action="download-site"]').click();
  const download = await downloadPromise;
  const downloaded = path.join(root, 'exported-preview.html');
  await download.saveAs(downloaded);
  const html = fs.readFileSync(downloaded, 'utf8');
  assert.match(html, /publishedSiteData/);
  assert.match(html, /Edited craft heading/);
  const preview = await browser.newContext();
  const exportedPage = await preview.newPage();
  exportedPage.on('pageerror', (e) => errors.push(e.message));
  await exportedPage.goto('file:///' + downloaded.replaceAll('\\', '/') + '#home');
  assert.match(
    await exportedPage.locator('html').evaluate((e) => e.style.getPropertyValue('--font-display')),
    /Georgia/,
  );
  await page.evaluate(() => (location.hash = '#home'));
  await page.waitForTimeout(200);
  assert.equal(await page.locator('#about').isVisible(), false);
  assert.equal(
    await page
      .locator('.btn')
      .first()
      .evaluate((e) => getComputedStyle(e).borderRadius),
    '0px',
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: path.join(results, 'site-mobile.png'), fullPage: false });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.evaluate(() => (location.hash = '#admin'));
  await page.locator('[data-tab="design"]').click();
  await page.locator('#adminWorkspace').scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(results, 'admin-mobile.png'), fullPage: false });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.deepEqual(errors, []);
  await browser.close();
  fs.unlinkSync(downloaded);
  console.log(
    'PASS: typography, nested content, focus, persistence, visibility, export, mobile overflow, runtime errors',
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
