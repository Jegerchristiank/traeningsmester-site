// Render campaign artwork in Chromium, then cut the four views from the original Center Stage film.
// Run with its MP4 as the first argument to also render the launch film. Without it, render the two stills.
const { chromium } = require('@playwright/test');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '..');
const launch = path.join(root, 'marketing', 'launch');
const product = path.join(root, 'public', 'product');
const fps = 30;

// Crop coordinates belong to source/product-center-stage.mp4 (1080 × 1920).
// Set and rest keep the same source origin, scale and photograph position across the edit.
const shots = [
  { id: 'intro', duration: 3, zoom: [1, 1.05] },
  { id: 'program', duration: 3, zoom: [1, 1.025], sourceAt: 0, crop: [628, 814, 225, 486] },
  { id: 'set', duration: 3, zoom: [1.025, 1.05], sourceAt: 3, crop: [628, 709, 225, 685] },
  { id: 'rest', duration: 3, zoom: [1.05, 1.075], sourceAt: 6, crop: [628, 913, 225, 685] },
  { id: 'history', duration: 3, zoom: [1, 1.025], sourceAt: 9, crop: [628, 586, 225, 1012] },
  { id: 'outro', duration: 4, zoom: [1.035, 1] },
];

function ffmpeg(args) {
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-nostdin', '-y', ...args], { stdio: 'inherit' });
}

async function showComposition(page, mode) {
  const url = pathToFileURL(path.join(launch, 'composition.html'));
  url.searchParams.set('mode', mode);
  await page.goto(url.href);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(image => image.decode()));
  });
}

async function renderShot(page, shot, temp, source) {
  await showComposition(page, shot.id);
  const box = await page.locator('.photo').boundingBox();
  const rect = Object.fromEntries(Object.entries(box).map(([key, value]) => [key, Math.round(value)]));
  const imageFile = path.join(temp, shot.id + '-photo.png');
  const typeFile = path.join(temp, shot.id + '-type.png');
  const filmFile = path.join(temp, shot.id + '.mp4');
  const isolatePhoto = await page.addStyleTag({ content: '#canvas > :not(.photo) { visibility: hidden }' });
  await page.locator('.photo').screenshot({ path: imageFile });
  await isolatePhoto.evaluate(el => el.remove());

  // Keep the soft edge of the physical cut even though the final picture inside it is video.
  const placement = await page.evaluate(sourceRatio => {
    if (!sourceRatio) return null;
    const screen = document.querySelector('.screen');
    const { x, y, width } = screen.getBoundingClientRect();
    const height = Math.round(width / sourceRatio);
    const shadow = document.createElement('div');
    Object.assign(shadow.style, {
      position: 'absolute', top: y + 'px', left: x + 'px', width: width + 'px', height: height + 'px',
      background: 'white', boxShadow: '0 7px 12px rgb(15 23 19 / 11%)',
    });
    screen.replaceWith(shadow);
    return { x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) };
  }, shot.crop && shot.crop[0] / shot.crop[1]);
  await page.addStyleTag({ content: 'html,body,#canvas { background: transparent } .photo { visibility: hidden }' });
  await page.locator('#canvas').screenshot({ path: typeFile, omitBackground: true });

  const frames = shot.duration * fps;
  const [startZoom, endZoom] = shot.zoom;
  const zoom = startZoom + '+(' + (endZoom - startZoom).toFixed(3) + ')*on/' + (frames - 1);
  const camera = [
    'scale=iw*2:ih*2',
    "zoompan=z='" + zoom + "':x='(iw-iw/zoom)*0.52':y='(ih-ih/zoom)*0.46'",
  ].join(',') + ':d=' + frames + ':s=' + rect.width + 'x' + rect.height + ':fps=' + fps;
  const filters = [
    '[0:v]' + camera + ',format=yuv444p,pad=1080:1920:' + rect.x + ':' + rect.y + ':color=0xf7f6f1[background]',
    '[1:v]format=rgba[type]',
    '[background][type]overlay=0:0:format=rgb[layout]',
  ];
  const args = ['-framerate', String(fps), '-i', imageFile, '-framerate', String(fps), '-i', typeFile];
  let picture = 'layout';
  if (placement) {
    args.push('-ss', String(shot.sourceAt), '-t', String(shot.duration), '-i', source);
    filters.push('[2:v]crop=' + shot.crop.join(':') + ',scale=' + placement.width + ':' + placement.height
      + ':flags=lanczos,setsar=1,setpts=PTS-STARTPTS[product]');
    filters.push('[layout][product]overlay=' + placement.x + ':' + placement.y + ':format=rgb:shortest=1[scene]');
    picture = 'scene';
  }
  filters.push('[' + picture + ']scale=out_color_matrix=bt709,format=yuv420p[out]');
  ffmpeg([...args, '-filter_complex', filters.join(';'), '-map', '[out]', '-frames:v', String(frames),
    '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-color_primaries', 'bt709',
    '-color_trc', 'bt709', '-colorspace', 'bt709', filmFile]);
}

async function main() {
  const source = process.argv[2] && path.resolve(process.argv[2]);
  if (source && !fs.existsSync(source)) throw new Error('Center Stage source not found: ' + source);
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'tm-launch-'));
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1200, height: 1920 }, deviceScaleFactor: 1 });
    const canvas = page.locator('#canvas');
    await showComposition(page, 'still');
    await canvas.screenshot({ path: path.join(temp, 'still.png') });
    await showComposition(page, 'og');
    await canvas.screenshot({ path: path.join(temp, 'og.jpg'), quality: 91 });
    if (source) {
      for (const shot of shots) await renderShot(page, shot, temp, source);
      const list = path.join(temp, 'shots.txt');
      fs.writeFileSync(list, shots.map(shot => "file '" + shot.id + ".mp4'").join('\n') + '\n');
      const movie = path.join(temp, 'launch.mp4');
      ffmpeg(['-f', 'concat', '-safe', '1', '-i', list, '-c', 'copy', '-movflags', '+faststart', movie]);
      fs.copyFileSync(movie, path.join(launch, 'traen-videre.mp4'));
    }
    fs.copyFileSync(path.join(temp, 'still.png'), path.join(launch, 'traen-videre-still.png'));
    fs.copyFileSync(path.join(temp, 'og.jpg'), path.join(product, 'og-image.jpg'));
    console.log(source ? 'Rendered launch film, social still and link preview.' : 'Rendered social still and link preview.');
  } finally {
    if (browser) await browser.close();
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
