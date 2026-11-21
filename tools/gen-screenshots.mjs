// Programmatic screenshots: Playwright (the repo's Python venv Chromium) drives
// the app served by serve.ts and saves 4 real renders into screenshots/.
// Each PNG is 1280 wide, comfortably under the 256 KiB gate cap.
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const toolDir = dirname(fileURLToPath(import.meta.url));
const repo = resolve(toolDir, '..');
const shotDir = join(repo, 'screenshots');
mkdirSync(shotDir, { recursive: true });

const PORT = 8937;
const shots = [
  ['1-cover-checklist.png', 'cover', 1280, 720],
  ['2-roadmap.png', 'roadmap', 1280, 640],
  ['3-missables.png', 'missables', 1280, 640],
  ['4-spoiler-filters.png', 'spoiler', 1280, 640],
];

const driver = `
import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1280, "height": 720}, device_scale_factor=1)
        await page.goto("http://127.0.0.1:${PORT}/", wait_until="networkidle")
        await page.wait_for_timeout(400)
        # tick a handful of trophies so the meter shows real progress
        await page.evaluate("""() => {
          const ticks = document.querySelectorAll('.row-check');
          for (let i = 0; i < 9 && i < ticks.length; i++) {
            ticks[i].checked = true;
            ticks[i].dispatchEvent(new Event('change'));
          }
        }""")
        await page.wait_for_timeout(250)

        async def cover():
            await page.locator('.row .row-name').nth(3).click()
            await page.wait_for_timeout(200)
        async def roadmap():
            await page.evaluate("document.querySelector('#roadmapPanel').scrollIntoView({block: 'center'})")
            await page.wait_for_timeout(150)
        async def missables():
            await page.click('#missableChip')
            await page.wait_for_timeout(250)
        async def spoiler():
            await page.click('#missableChip')  # toggle back off
            await page.check('#spoilerMode')
            await page.select_option('#kindFilter', 'story')
            await page.wait_for_timeout(250)

        scenes = {"cover": cover, "roadmap": roadmap, "missables": missables, "spoiler": spoiler}
        for fname, scene, w, h in ${JSON.stringify(shots)}:
            await page.set_viewport_size({"width": w, "height": h})
            await scenes[scene]()
            await page.screenshot(path="screenshots/" + fname)
        await browser.close()

asyncio.run(run())
`;

const server = spawn('node', ['serve.ts', '--port', String(PORT)], { cwd: repo, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 1200));
try {
  const proc = spawn('.venv/bin/python', ['-c', driver], { cwd: repo, stdio: 'inherit' });
  const code = await new Promise((res, rej) => {
    proc.on('exit', c => res(c));
    proc.on('error', rej);
  });
  if (code !== 0) throw new Error('screenshot driver exited ' + code);
} finally {
  server.kill();
}
console.log('screenshots written to', shotDir);
