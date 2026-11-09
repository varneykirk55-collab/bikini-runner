// Headless-browser smoke test for Bikini Runner. NOT YET RUN: written without the ability to
// install Phaser/Vite or Playwright browsers. Treat the first run as a test of this script too.
//
// Usage:  npm run build && npm run preview   (in one terminal; serves http://localhost:4173)
//         npm run smoke                      (in another; optional URL as first argument)
//
// Checks: the page loads on a phone-sized touch viewport, the canvas appears, no uncaught errors or
// failed requests occur while starting a run, swiping, and pausing, and the canvas is not blank.
// Screenshots go to ./smoke-out/. This does not replace playtesting on a real device.
import { chromium, devices } from 'playwright';
import { mkdirSync } from 'node:fs';

const url = process.argv[2] ?? 'http://localhost:4173';
mkdirSync('smoke-out', { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ ...devices['iPhone 13'] });
const page = await context.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => m.type() === 'error' && problems.push(`console.error: ${m.text()}`));
page.on('requestfailed', (r) => problems.push(`requestfailed: ${r.url()}`));

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForSelector('canvas', { timeout: 15000 });
await page.waitForTimeout(1500); // boot -> menu
await page.screenshot({ path: 'smoke-out/1-menu.png' });

const box = await page.locator('canvas').boundingBox();
if (!box) throw new Error('canvas has no bounding box');
const at = (fx, fy) => ({ x: box.x + box.width * fx, y: box.y + box.height * fy });

// RUN button sits at roughly 48% of the game height.
await page.touchscreen.tap(at(0.5, 0.473).x, at(0.5, 0.473).y);
await page.waitForTimeout(2500);
await page.screenshot({ path: 'smoke-out/2-running.png' });

const swipe = async (dx, dy) => {
  const s = at(0.5, 0.6);
  await page.mouse.move(s.x, s.y);
  await page.mouse.down();
  await page.mouse.move(s.x + dx, s.y + dy, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(400);
};
await swipe(-120, 0);
await swipe(120, 0);
await swipe(0, -120);
await swipe(0, 120);
await page.screenshot({ path: 'smoke-out/3-after-swipes.png' });

await page.keyboard.press('Escape');
await page.waitForTimeout(500);
await page.screenshot({ path: 'smoke-out/4-paused.png' });

// Not blank: sample the canvas through a screenshot and require some colour variety.
const buf = await page.locator('canvas').screenshot();
const distinct = new Set();
for (let i = 0; i < buf.length; i += 997) distinct.add(buf[i]);
if (distinct.size < 20) problems.push('canvas looks blank');

await browser.close();
if (problems.length) {
  console.error('SMOKE FAILED:\n' + problems.join('\n'));
  process.exit(1);
}
console.log('smoke ok (screenshots in ./smoke-out/; still needs a real-device playtest)');
