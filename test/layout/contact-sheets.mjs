// Puts the pictures of one screen in every language side by side, each under its language, so that all languages
// are looked at together. See README.md in this folder.
//
//   node test/layout/contact-sheets.mjs <folder of pictures> <screen> [--width=300] [--columns=5] [--rows=4]
//                                       [--clip=<x>,<y>,<width>,<height>] [--name=<name>] [--output=<folder>]
//
// <screen> is a picture's name before "-<code>.png", as app-in-every-language.mjs --pictures writes them
// (settings-datetime, welcome, home-loaded, ...). --width is the width that each picture, or its clip, is shown at.
// --clip shows one rectangle of each picture, in the picture's own pixels: the status bars at the bottom of the
// window, say, which are then large enough to read with all languages on one sheet. The sheets are written as
// sheet-<screen>-<number>.png, or sheet-<name>-<number>.png, with --columns times --rows languages on each, in the
// order of the application's list.
//
// The sheets are drawn in a window of the application's Electron, kept off the screen as in the e2e suite, so that
// no image tool is needed.
import { createRequire } from 'node:module';
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(import.meta.dirname, '../..');
const [folder, screen] = process.argv.slice(2).filter(argument => !argument.startsWith('--'));
if (!folder || !screen) throw new Error('Usage: node test/layout/contact-sheets.mjs <folder of pictures> <screen> [--width=300] [--columns=5] [--rows=4]');
const option = (name, otherwise) => process.argv.slice(2).find(argument => argument.startsWith(`--${name}=`))?.slice(name.length + 3) ?? otherwise;
const width = Number(option('width', 300));
const columns = Number(option('columns', 5));
const rows = Number(option('rows', 4));
// A sheet of no row or no column would never be finished.
for (const [name, value] of Object.entries({ width, columns, rows }))
  if (!Number.isInteger(value) || value < 1) throw new Error(`--${name} takes a whole number of 1 or more.`);
const clip = option('clip')?.split(',').map(Number);
if (clip && (clip.length !== 4 || clip.some(Number.isNaN))) throw new Error('--clip takes four numbers: x,y,width,height.');
const name = option('name', screen);
const output = path.resolve(option('output', folder));
const require = createRequire(import.meta.url);
const { _electron } = require('playwright');
const languages = [...(await readFile(path.join(root, 'src-shared/i18n/languages.ts'), 'utf8'))
  .matchAll(/\{ code: '([^']+)', name: '[^']+', englishName: '([^']+)'/g)].map(([, code, englishName]) => ({ code, englishName }));
const cells = [];
for (const { code, englishName } of languages) {
  const file = path.resolve(folder, `${screen}-${code}.png`);
  if (await access(file).then(() => true, () => false)) cells.push({ code, englishName, url: pathToFileURL(file).href });
}
if (cells.length === 0) throw new Error(`${folder} has no picture named ${screen}-<code>.png.`);
await mkdir(output, { recursive: true });

const profile = await mkdtemp(path.join(tmpdir(), 'plm-layout-sheets-'));
const app = await _electron.launch({ executablePath: require('electron'), args: ['test/e2e/main.mjs'], cwd: root,
  env: { ...process.env, PLM_TEST_ROOT: profile, PLM_E2E: '1', PLM_TEST_HEADLESS: process.platform === 'linux' ? '0' : '1' } });
try {
  await app.firstWindow();
  // A window of its own, without the application's page, which may show pictures from the disk.
  const opened = app.waitForEvent('window');
  await app.evaluate(({ app, BrowserWindow }, windowWidth) => {
    const require = globalThis.__plmTestRequire;
    const { withHeadlessTestOptions } = require(require('node:path').join(app.getAppPath(), 'out/app/electron-util/e2e-test-hooks.js'));
    const window = new BrowserWindow(withHeadlessTestOptions({ useContentSize: true, width: windowWidth, height: 800, minWidth: 100,
      webPreferences: { webSecurity: false } }));
    void window.loadURL('about:blank');
  }, columns * (width + 12) + 12);
  const page = await opened;
  for (let start = 0, number = 1; start < cells.length; start += columns * rows, number += 1) {
    const sheet = path.join(profile, `sheet-${number}.html`);
    await writeFile(sheet, `<!doctype html><meta charset="utf-8"><style>
      body { margin: 0; padding: 6px; background: #d0d0d0; font: 12px sans-serif; }
      .grid { display: grid; grid-template-columns: repeat(${columns}, ${width}px); gap: 12px; align-items: start; }
      .label { padding: 2px 4px; background: #222; color: #fff; white-space: nowrap; overflow: hidden; }
      .label b { color: #ffd54f; margin-inline-end: 6px; }
      .picture { overflow: hidden; background: #fff; width: ${width}px; }
      img { display: block; width: ${width}px; transform-origin: 0 0; }
    </style><div class="grid">${cells.slice(start, start + columns * rows).map(cell =>
      `<div><div class="label"><b>${cell.code}</b>${cell.englishName}</div><div class="picture"><img src="${cell.url}"></div></div>`).join('')}</div>`);
    await page.goto(pathToFileURL(sheet).href);
    await page.waitForFunction(() => [...document.images].every(image => image.complete && image.naturalWidth > 0));
    // The clip is given in the picture's own pixels: the picture is enlarged so that the clip is as wide as a cell,
    // and moved so that the clip's corner is at the cell's.
    if (clip) await page.evaluate(([x, y, clipWidth, clipHeight, cellWidth]) => {
      const scale = cellWidth / clipWidth;
      for (const box of document.querySelectorAll('.picture')) {
        const image = box.querySelector('img');
        image.style.width = `${image.naturalWidth * scale}px`;
        image.style.transform = `translate(${-x * scale}px, ${-y * scale}px)`;
        box.style.height = `${Math.round(clipHeight * scale)}px`;
      }
    }, [...clip, width]);
    const file = path.join(output, `sheet-${name}-${number}.png`);
    await page.screenshot({ path: file, fullPage: true, scale: 'css' });
    console.log(file);
  }
} finally {
  await app.close().catch(() => {});
  await rm(profile, { recursive: true, force: true });
}
