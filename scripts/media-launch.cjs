// Rebuild launch artwork; pass a Center Stage WebM/MP4 export to assemble the film.
// Requires the project's Playwright dependency and ffmpeg on PATH.
const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'marketing/launch');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'tm-launch-'));
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1920 }, deviceScaleFactor: 1 });
  for (const mode of ['intro', 'outro', 'still', 'og', 'overlay0', 'overlay1', 'overlay2', 'overlay3']) {
    const overlay = mode.startsWith('overlay');
    const url = pathToFileURL(path.join(output, 'composition.html'));
    url.search = overlay ? `mode=overlay&chapter=${mode.slice(-1)}` : `mode=${mode}`;
    await page.goto(url.href);
    await page.evaluate(() => document.fonts.ready);
    await page.locator('img').evaluateAll(elements => Promise.all(elements.map(image => image.decode())));
    const target = mode === 'still' ? path.join(output, 'traen-videre-still.png')
      : mode === 'og' ? path.join(root, 'public/product/og-image.jpg') : path.join(temp, `${mode}.png`);
    await page.locator('#canvas').screenshot({ path: target, omitBackground: overlay,
      ...(mode === 'og' ? { type: 'jpeg', quality: 90 } : {}) });
  }
  await browser.close();
  const source = process.argv[2];
  if (!source) { console.log('Artwork rendered. Pass a Center Stage video export to render the film.'); return; }
  const args = ['-hide_banner', '-loglevel', 'error', '-y', '-loop', '1', '-i', path.join(temp, 'intro.png'),
    '-i', path.resolve(source), '-loop', '1', '-i', path.join(temp, 'outro.png')];
  for (let i = 0; i < 4; i++) args.push('-loop', '1', '-i', path.join(temp, `overlay${i}.png`));
  const filters = [
    '[0:v]fps=30,trim=duration=2.5,setpts=PTS-STARTPTS,setsar=1,format=yuv420p[intro]',
    '[1:v]fps=30,split=4[v0][v1][v2][v3]',
    '[v0]trim=start=0:end=3,setpts=PTS-STARTPTS,scale=1566:2784,crop=1080:1920:243:200,setsar=1[p0]',
    '[v1]trim=start=3:end=6,setpts=PTS-STARTPTS,scale=1566:2784,crop=1080:1920:243:420,setsar=1[p1]',
    '[v2]trim=start=6:end=9,setpts=PTS-STARTPTS,scale=1566:2784,crop=1080:1920:243:620,setsar=1[p2]',
    '[v3]trim=start=9:end=12,setpts=PTS-STARTPTS,scale=1782:3168,crop=1080:1920:351:900,setsar=1[p3]',
    '[p0][p1][p2][p3]concat=n=4:v=1:a=0[body]',
    '[body][3:v]overlay=0:0:enable=lt(t\\,3):shortest=1[b0]',
    '[b0][4:v]overlay=0:0:enable=between(t\\,3\\,5.999):shortest=1[b1]',
    '[b1][5:v]overlay=0:0:enable=between(t\\,6\\,8.999):shortest=1[b2]',
    '[b2][6:v]overlay=0:0:enable=gte(t\\,9):shortest=1[b3]',
    '[2:v]fps=30,trim=duration=4,setpts=PTS-STARTPTS,setsar=1,format=yuv420p[outro]',
    '[intro][b3][outro]concat=n=3:v=1:a=0,format=yuv420p[final]'
  ].join(';');
  args.push('-filter_complex', filters, '-map', '[final]', '-an', '-c:v', 'libx264', '-preset', 'fast',
    '-crf', '19', '-movflags', '+faststart', path.join(output, 'traen-videre.mp4'));
  execFileSync('ffmpeg', args, { stdio: 'inherit' });
  console.log('Rendered marketing/launch/traen-videre.mp4 (18.5 seconds, 1080×1920, 30 fps).');
})().catch(error => { console.error(error); process.exitCode = 1; });
