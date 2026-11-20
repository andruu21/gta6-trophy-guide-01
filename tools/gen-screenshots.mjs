// Programmatic screenshots of the app via Playwright (Python venv chromium).
// 4 real renders of the app: cover (checklist + guide with sources + progress),
// roadmap, missables flagged, spoiler mode + story filter. Each PNG is
// 1280x720, comfortably under the 256 KiB cap.
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '..');
const outDir = join(repo, 'screenshots');
mkdirSync(outDir, { recursive: true });

const shots = [
  { name: '1-cover-checklist.png', script: 'cover', w: 1280, h: 720 },
  { name: '2-roadmap.png', script: 'roadmap', w: 1280, h: 720 },
  { name: '3-missables.png', script: 'missables', w: 1280, h: 640 },
  { name: '4-spoiler-filters.png', script: 'spoiler', w: 1280, h: 640 },
];

const py = `
import asyncio, sys
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1280, "height": 720}, device_scale_factor=1)
        await page.goto("http://127.0.0.1:8931/", wait_until="networkidle")
        await page.wait_for_timeout(400)
        # pre-check some trophies so the cover shows progress
        await page.evaluate("""() => {
          const boxes = document.querySelectorAll('.tr-check');
          for (let i = 0; i < 9 && i < boxes.length; i++) {
            boxes[i].checked = true;
            boxes[i].dispatchEvent(new Event('change', {bubbles: false}));
          }
        }""")
        await page.wait_for_timeout(200)

        async def cover():
            boxes = page.locator('.trophy .tr-name')
            await boxes.nth(3).click()
            await page.wait_for_timeout(200)
        async def roadmap():
            # reset scroll so the roadmap panel (right column, under the guide) is in view
            await page.evaluate("document.querySelector('#roadmapPanel').scrollIntoView({block: 'center'})")
            await page.wait_for_timeout(150)
        async def missables():
            await page.click('#missableChip')
            await page.wait_for_timeout(250)
        async def spoiler():
            await page.click('#missableChip')  # toggle off
            await page.check('#spoilerMode')
            await page.select_option('#kindFilter', 'story')
            await page.wait_for_timeout(250)

        for name, fn in [("1-cover-checklist.png", cover), ("2-roadmap.png", roadmap),
                         ("3-missables.png", missables), ("4-spoiler-filters.png", spoiler)]:
            await fn()
            await page.screenshot(path="screenshots/" + name, full_page=False)
        await browser.close()

asyncio.run(main())
`;

const server = spawn('node', ['serve.ts', '--port', '8931'], { cwd: repo, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 1200));
try {
  const proc = spawn('.venv/bin/python', ['-c', py], { cwd: repo, stdio: 'inherit' });
  await new Promise((res, rej) => {
    proc.on('exit', c => c === 0 ? res() : rej(new Error('screenshot script exit ' + c)));
  });
} finally {
  server.kill();
}
console.log('screenshots written to', outDir, existsSync(join(outDir, '1-cover-checklist.png')));
