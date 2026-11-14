// Opens the website's two pages in every language at many widths, and reports where the layout does not hold for a
// language's texts. The e2e suite looks at English, Japanese and Arabic only; this is run by hand after a change to
// the website's layout or texts (docs/TRANSLATING.md, "The website"):
//
//   node test/website/layout-in-every-language.mjs [--languages=de,lv] [--pictures] [--output=<folder>]
//
// For each language and each of WIDTHS, on the landing page and on the page of the Windows download, it finds:
// - a page that is wider than the window, and what reaches outside the window;
// - a text that is cut by its box;
// - a download button whose text is on two lines, the two buttons of different widths when one is above the other,
//   and the two side by side that did not fit in one row;
// - a name that is divided between two lines (Photo Location Map, Photo Data Viewer, the developer's, and the
//   English names of Windows' two buttons), which i18n.js keeps on one;
// - the language picker's button on two lines, and its box outside a window of 320 pixels, with its line for a
//   search that finds no language on two lines or the search field's hint wider than the field;
// - the picker's first entry, "Use browser setting" with the name of the browser's language, on two lines in a
//   desktop's window, where the box can grow with it.
// It prints the findings and writes everything to measurements.json in the output folder (the system's temporary
// folder, or --output). With --pictures, it also writes a picture of each page in each language at 390 and 1000
// pixels, landing-390-<code>.png and so on, with the video and the two pictures of Windows made low, as they are
// the same in every language, and of the picker's search field and its "no languages" line, and of its box with the
// top of the list in a desktop's window, picker-list-<code>.png.
//
// The pages are served from docs/ at an address of this computer and shown in a window of the application's
// Electron, kept off the screen as in the e2e suite (test/e2e/README.md). The video is not loaded.
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { languages } from './website-i18n.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const option = name => process.argv.slice(2).find(argument => argument.startsWith(`--${name}=`))?.slice(name.length + 3);
const pictures = process.argv.includes('--pictures');
const only = option('languages')?.split(',');
const output = path.resolve(option('output') ?? path.join(tmpdir(), 'plm-layout-website'));
// Phones, the widths around which the download buttons change from one above the other to side by side (600), a
// tablet and desktops.
const WIDTHS = [320, 360, 390, 430, 500, 501, 520, 540, 560, 580, 599, 600, 620, 660, 700, 768, 1000, 1200];
const PICTURE_WIDTHS = [390, 1000];

const require = createRequire(import.meta.url);
const { _electron } = require('playwright');
await mkdir(output, { recursive: true });

const docs = path.join(root, 'docs');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.ico': 'image/x-icon', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = createServer(async (request, response) => {
  try {
    const { pathname } = new URL(request.url, 'http://127.0.0.1');
    const file = path.join(docs, decodeURIComponent(pathname.endsWith('/') ? `${pathname}index.html` : pathname));
    if (!file.startsWith(docs + path.sep)) throw new Error('Outside docs/.');
    let body = await readFile(file);
    // The landing page without its video, which is the same in every language and would be played.
    if (file === path.join(docs, 'index.html'))
      body = Buffer.from(body.toString().replace(/src="https:\/\/www\.youtube\.com\/embed\/[^"]*"/, 'src="about:blank"'));
    response.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' }).end(body);
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}/`;
const profile = await mkdtemp(path.join(tmpdir(), 'plm-layout-website-'));
const app = await _electron.launch({ executablePath: require('electron'), args: ['test/e2e/main.mjs'], cwd: root,
  env: { ...process.env, PLM_TEST_ROOT: profile, PLM_E2E: '1', PLM_TEST_HEADLESS: process.platform === 'linux' ? '0' : '1' } });

/** The parts that are the same in every language are made low, so that a page's texts fill its picture. */
const lowPictures = `
  .demo-video { height: 48px !important; padding-bottom: 0 !important; margin: 24px auto !important; background: #dee2e6; }
  .demo-video iframe { display: none !important; }
  .windows-defender-more-info, .windows-defender-run-anyway { height: 36px !important; object-fit: cover; object-position: top; }
`;

/** What a page's layout is at the window's width: see the head of this file. */
const measure = () => {
  const view = document.documentElement.clientWidth;
  const box = element => element.getBoundingClientRect();
  const linesOf = element => {
    const style = getComputedStyle(element);
    const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.5;
    const height = box(element).height - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)
      - parseFloat(style.borderTopWidth) - parseFloat(style.borderBottomWidth);
    return Math.round(height / lineHeight);
  };
  const visible = element => {
    const style = getComputedStyle(element);
    const { width, height } = box(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && width > 0 && height > 0;
  };
  const nameOf = element => `${element.tagName.toLowerCase()}${element.className && typeof element.className === 'string' ? '.' + element.className.trim().split(/\s+/).join('.') : ''}`;
  // Not the picker's label, which is hidden from the eye on purpose, nor the video.
  const all = [...document.querySelectorAll('body *')].filter(visible)
    .filter(element => !element.closest('.demo-video') && !element.classList.contains('language-hidden-label'));
  const buttons = [...document.querySelectorAll('.download-buttons > *')];
  const picker = document.querySelector('.language-button');
  // The names in the page's texts that are on more than one line: with ordinary spaces, as the texts have them, or
  // with the no-break spaces that i18n.js gives them.
  const dividedNames = [];
  for (const element of [...document.body.querySelectorAll('[data-i18n]')].filter(visible)) {
    const texts = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    for (let text = texts.nextNode(); text; text = texts.nextNode()) {
      for (const match of text.data.matchAll(/Photo[ \u00a0]Location[ \u00a0]Map|Photo[ \u00a0]Data[ \u00a0]Viewer|Tomoyuki[ \u00a0]Aota|More[ \u00a0]info|Run[ \u00a0]anyway/g)) {
        const name = document.createRange();
        name.setStart(text, match.index);
        name.setEnd(text, match.index + match[0].length);
        if (new Set([...name.getClientRects()].map(line => Math.round(line.top))).size > 1) dividedNames.push(match[0].replace(/\u00a0/g, ' '));
      }
    }
  }
  return {
    wider: document.documentElement.scrollWidth - view,
    outside: all.filter(element => box(element).right > view + 0.5 || box(element).left < -0.5).map(nameOf).slice(0, 6),
    cut: all.filter(element => element.scrollWidth > element.clientWidth + 1 && getComputedStyle(element).overflowX !== 'visible').map(nameOf).slice(0, 6),
    buttons: buttons.map(button => ({ lines: linesOf(button), width: Math.round(box(button).width), top: Math.round(box(button).top) })),
    buttonsDirection: buttons.length ? getComputedStyle(buttons[0].parentElement).flexDirection : null,
    pickerLines: picker ? linesOf(picker) : null,
    dividedNames,
  };
};

const results = {};
try {
  await app.firstWindow();
  // A window of its own, without the application's page.
  const opened = app.waitForEvent('window');
  await app.evaluate(({ app, BrowserWindow }) => {
    const require = globalThis.__plmTestRequire;
    const { withHeadlessTestOptions } = require(require('node:path').join(app.getAppPath(), 'out/app/electron-util/e2e-test-hooks.js'));
    const window = new BrowserWindow(withHeadlessTestOptions({ useContentSize: true, width: 1000, height: 900, minWidth: 100 }));
    window.webContents.setAudioMuted(true);
    globalThis.__websiteWindow = window;
    void window.loadURL('about:blank');
  });
  const page = await opened;
  // The page of the Windows download starts the download when it is loaded, which is not wanted here.
  await page.addInitScript(() => {
    const click = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () { if (!this.hasAttribute('download')) click.call(this); };
  });
  const setWidth = async width => {
    await app.evaluate((_, width) => globalThis.__websiteWindow.setContentSize(width, 900), width);
    await page.waitForFunction(width => window.innerWidth === width, width);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  };
  /** The page shows its texts in the language, with the picker, and its pictures are loaded. */
  const shown = language => page.waitForFunction(language => document.documentElement.lang === language
    && !document.documentElement.classList.contains('i18n-pending')
    && document.querySelector('.language-picker')?.hidden === false
    && document.querySelector('.language-button-name').lang === language
    && [...document.images].every(image => image.complete && image.naturalWidth > 0), language);
  const pages = { landing: '', downloading: 'github-pages/downloading-for-windows/downloading-for-windows.html' };

  for (const { code } of languages) {
    if (only && !only.includes(code)) continue;
    results[code] = {};
    for (const [name, address] of Object.entries(pages)) {
      await setWidth(1000);
      await page.goto(`${base}${address}?lang=${code}`, { waitUntil: 'load' });
      await shown(code);
      await page.evaluate(() => document.fonts.ready);
      results[code][name] = {};
      for (const width of WIDTHS) {
        await setWidth(width);
        results[code][name][width] = await page.evaluate(measure);
      }
      if (name === 'landing') {
        // The picker's box in a desktop's window, with its first entry.
        await setWidth(1000);
        await page.locator('.language-button').click();
        results[code].pickerList = await page.evaluate(() => {
          // The lines by the entry's height, as the name of the language in it is set in another font, whose boxes
          // stand higher or lower on the same line.
          const entry = document.querySelector('#language-option-browser');
          const style = getComputedStyle(entry);
          const height = entry.getBoundingClientRect().height - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
          return { entryLines: Math.round(height / parseFloat(style.lineHeight)), entryText: entry.textContent,
            width: Math.round(document.querySelector('.language-popup').getBoundingClientRect().width) };
        });
        if (pictures) {
          // The list from its top, where the first entry is, rather than at the chosen language.
          await page.locator('.language-options').evaluate(list => { list.scrollTop = 0; });
          await page.locator('.language-popup').screenshot({ path: path.join(output, `picker-list-${code}.png`), scale: 'css' });
        }
        await page.keyboard.press('Escape');
        // The picker's box in the narrowest window, with a search that finds no language.
        await setWidth(320);
        await page.locator('.language-button').click();
        await page.locator('.language-search').fill('zzzz');
        results[code].picker = await page.evaluate(() => {
          const view = document.documentElement.clientWidth;
          const popup = document.querySelector('.language-popup').getBoundingClientRect();
          const none = document.querySelector('.language-none');
          const search = document.querySelector('.language-search');
          const context = document.createElement('canvas').getContext('2d');
          context.font = getComputedStyle(search).font;
          return { left: Math.round(popup.left), right: Math.round(popup.right), view,
            noneLines: Math.round((none.getBoundingClientRect().height - 12) / 20),
            hintWidth: Math.round(context.measureText(search.placeholder).width),
            hintRoom: Math.round(search.clientWidth - parseFloat(getComputedStyle(search).paddingLeft) - parseFloat(getComputedStyle(search).paddingRight)) };
        });
        if (pictures) {
          await setWidth(390);
          await page.locator('.language-search-field').screenshot({ path: path.join(output, `picker-search-${code}.png`), scale: 'css' });
          await page.locator('.language-none').screenshot({ path: path.join(output, `picker-none-${code}.png`), scale: 'css' });
        }
        await page.keyboard.press('Escape');
      }
      if (pictures) {
        await page.addStyleTag({ content: lowPictures });
        for (const width of PICTURE_WIDTHS) {
          await setWidth(width);
          await page.mouse.move(0, 0);
          await page.screenshot({ path: path.join(output, `${name}-${width}-${code}.png`), fullPage: true, scale: 'css' });
        }
      }
    }
    process.stdout.write(`${code} `);
  }
  process.stdout.write('\n');
} finally {
  await app.close().catch(() => {});
  server.close();
  await rm(profile, { recursive: true, force: true });
}
await writeFile(path.join(output, 'measurements.json'), JSON.stringify(results, null, 1));

let found = 0;
const report = text => { found += 1; console.log(text); };
for (const [code, of] of Object.entries(results)) {
  for (const name of Object.keys(of).filter(name => !['picker', 'pickerList'].includes(name))) {
    for (const [width, at] of Object.entries(of[name])) {
      const where = `${code.padEnd(8)} ${name.padEnd(11)} ${String(width).padStart(4)}px`;
      if (at.wider > 0) report(`${where}: the page is ${at.wider}px wider than the window`);
      if (at.outside.length) report(`${where}: outside the window: ${at.outside.join(', ')}`);
      if (at.cut.length) report(`${where}: cut: ${at.cut.join(', ')}`);
      if (at.buttons.some(button => button.lines > 1)) report(`${where}: a download button's text is on ${Math.max(...at.buttons.map(button => button.lines))} lines`);
      if (at.buttonsDirection === 'column' && new Set(at.buttons.map(button => button.width)).size > 1) report(`${where}: the download buttons, one above the other, have different widths`);
      if (at.buttonsDirection === 'row' && new Set(at.buttons.map(button => button.top)).size > 1) report(`${where}: the download buttons did not fit side by side`);
      if (at.pickerLines > 1) report(`${where}: the picker's button is on ${at.pickerLines} lines`);
      if (at.dividedNames.length) report(`${where}: divided between two lines: ${[...new Set(at.dividedNames)].join(', ')}`);
    }
  }
  const list = of.pickerList;
  if (list && list.entryLines > 1) report(`${code.padEnd(8)} the picker's first entry is on ${list.entryLines} lines in a desktop's window: ${list.entryText}`);
  const picker = of.picker;
  if (!picker) continue;
  if (picker.left < 0 || picker.right > picker.view) report(`${code.padEnd(8)} the picker's box is outside a window of 320px (${picker.left}..${picker.right})`);
  if (picker.noneLines > 1) report(`${code.padEnd(8)} the picker's line for no language is on ${picker.noneLines} lines`);
  if (picker.hintWidth > picker.hintRoom) report(`${code.padEnd(8)} the search field's hint (${picker.hintWidth}px) is wider than the field (${picker.hintRoom}px)`);
}
console.log(`${found} finding(s) in ${Object.keys(results).length} language(s). Written to ${output}.`);
