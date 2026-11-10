// Headless-browser smoke test for Bikini Runner.
//
// Usage:  npm run build && npm run smoke
//         (or pass a running server URL: node scripts/smoke.mjs http://localhost:4173)
//
// Checks: the page loads on a phone-sized touch viewport, the canvas appears, no uncaught errors or
// failed requests occur while starting a run, swiping, and pausing, and the canvas is not blank.
// Screenshots go to ./smoke-out/. This does not replace playtesting on a real device.
import { chromium, devices } from 'playwright';
import { mkdirSync } from 'node:fs';
import { preview } from 'vite';

const output = process.env.SMOKE_OUT ?? 'smoke-out';
mkdirSync(output, { recursive: true });

let server = null;
let url = process.argv[2];
if (!url) {
  server = await preview({ preview: { port: 0, host: '127.0.0.1' } });
  url = server.resolvedUrls?.local[0] ?? `http://127.0.0.1:${server.httpServer.address().port}`;
}

const browser = await chromium.launch();
const problems = [];
try {
  for (const [name, width, height] of [['iphone-se', 375, 667], ['iphone-13', 390, 844], ['iphone-16-pro-max', 440, 956], ['android', 412, 915]]) {
    const context = await browser.newContext({ ...devices['iPhone 13'], viewport: { width, height }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
    page.on('console', (m) => m.type() === 'error' && problems.push(`console.error: ${m.text()}`));
    page.on('requestfailed', (r) => problems.push(`requestfailed: ${r.url()}`));

    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForSelector('canvas', { timeout: 15000 });
    await page.waitForTimeout(1500); // boot -> menu
    await page.screenshot({ path: `${output}/${name}-1-menu.png` });

    const box = await page.locator('canvas').boundingBox();
    if (!box) throw new Error('canvas has no bounding box');
    if (Math.abs(box.width / box.height - 540 / 960) > 0.001) problems.push(`${name}: distorted canvas`);
    if (box.x < -1 || box.y < -1 || box.x + box.width > width + 1 || box.y + box.height > height + 1) problems.push(`${name}: clipped canvas`);
    const at = (fx, fy) => ({ x: box.x + box.width * fx, y: box.y + box.height * fy });

    // RUN button sits at roughly 48% of the game height.
    await page.touchscreen.tap(at(0.5, 0.473).x, at(0.5, 0.473).y);
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${output}/${name}-2-running.png` });

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
    await page.screenshot({ path: `${output}/${name}-3-after-swipes.png` });

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${output}/${name}-4-paused.png` });

    // Not blank: sample the canvas through a screenshot and require some colour variety.
    const buf = await page.locator('canvas').screenshot();
    const distinct = new Set();
    for (let i = 0; i < buf.length; i += 997) distinct.add(buf[i]);
    if (distinct.size < 20) problems.push('canvas looks blank');
    await context.close();
  }
} finally {
  await browser.close();
  server?.httpServer.close();
}

if (problems.length) {
  console.error('SMOKE FAILED:\n' + problems.join('\n'));
  process.exit(1);
}
console.log(`smoke ok: four portrait viewports (screenshots in ${output}/; still needs a real-device playtest)`);
