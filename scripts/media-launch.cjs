// Render campaign artwork in Chromium, then cut the four views from the original Center Stage film.
// A source MP4 adds the film. --studio also builds all optical crops of the source-faithful screen.
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

// Crops refer to the existing 1080 × 1920 Center Stage movie. The last field in the rest crop is
// the timer, so the viewer can read the completed first set and pause in one shot.
const shots = [
  { id: 'intro', duration: 3 },
  { id: 'program', duration: 3, sourceAt: 0, crop: [628, 814, 225, 486] },
  { id: 'set', duration: 3, sourceAt: 3, crop: [628, 709, 225, 685] },
  { id: 'rest', duration: 3, sourceAt: 6, crop: [628, 391, 225, 1114] },
  { id: 'history', duration: 3, sourceAt: 9, crop: [628, 586, 225, 1012] },
  { id: 'outro', duration: 4 },
];

function ffmpeg(args) {
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-nostdin', '-y', '-filter_complex_threads', '4', ...args], { stdio: 'inherit' });
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
  const typeFile = path.join(temp, shot.id + '-artwork.png');
  const filmFile = path.join(temp, shot.id + '.mp4');
  const layers = await page.evaluate(sourceRatio => {
    const coordinates = element => {
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) };
    };
    const motif = document.querySelector('.moving-motif');
    const motion = motif ? { ...coordinates(motif), name: motif.getAttribute('src') } : null;
    if (motif) motif.style.visibility = 'hidden';
    const screen = document.querySelector('.screen');
    let placement = null;
    if (screen && sourceRatio) {
      placement = coordinates(screen);
      placement.height = Math.round(placement.width / sourceRatio);
      const edge = document.createElement('div');
      const { x, y, width, height } = placement;
      Object.assign(edge.style, {
        position: 'absolute', zIndex: '1', top: y + 'px', left: x + 'px',
        width: width + 'px', height: height + 'px', background: 'white',
        boxShadow: '0 7px 12px rgb(18 29 63 / 12%)',
      });
      screen.replaceWith(edge);
    }
    const paper = getComputedStyle(document.getElementById('canvas')).getPropertyValue('--paper').trim();
    return { motion, placement, paper };
  }, shot.crop && shot.crop[0] / shot.crop[1]);
  if (layers.motion) await page.addStyleTag({ content: 'html,body,#canvas { background:transparent }' });
  await page.locator('#canvas').screenshot({ path: typeFile, omitBackground: true });

  const { motion, placement, paper } = layers;
  const frames = shot.duration * fps;
  const background = 'color=c=' + paper.replace('#', '0x') + ':s=1080x1920:r=' + fps + ':d=' + shot.duration;
  const args = ['-f', 'lavfi', '-i', background, '-framerate', String(fps), '-i', typeFile];
  const filters = [];
  let picture = '0:v';
  if (motion) {
    args.push('-i', path.join(launch, motion.name));
    const pan = "zoompan=z='1.012-.012*on/" + (frames - 1)
      + "':x='(iw-iw/zoom)*.54':y='(ih-ih/zoom)*.86':d=" + frames
      + ':s=' + motion.width + 'x' + motion.height + ':fps=' + fps;
    filters.push('[2:v]' + pan + ',setsar=1[motif]');
    filters.push('[0:v][motif]overlay=' + motion.x + ':' + motion.y + ':format=rgb[ground]');
    picture = 'ground';
  }
  filters.push('[1:v]format=rgba[type]');
  filters.push('[' + picture + '][type]overlay=0:0:format=rgb[layout]');
  picture = 'layout';
  if (placement) {
    const input = motion ? 3 : 2;
    args.push('-ss', String(shot.sourceAt), '-t', String(shot.duration), '-i', source);
    filters.push('[' + input + ':v]crop=' + shot.crop.join(':') + ',scale=' + placement.width + ':' + placement.height
      + ':flags=lanczos,setsar=1,setpts=PTS-STARTPTS[product]');
    filters.push('[layout][product]overlay=' + placement.x + ':' + placement.y + ':format=rgb:shortest=1[scene]');
    picture = 'scene';
  }
  filters.push('[' + picture + ']scale=out_color_matrix=bt709,format=yuv420p[out]');
  ffmpeg([...args, '-filter_complex', filters.join(';'), '-map', '[out]', '-frames:v', String(frames),
    '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-color_primaries', 'bt709',
    '-color_trc', 'bt709', '-colorspace', 'bt709', '-threads', '4', filmFile]);
}

// The set image is mounted at its native proportions. Each artboard has its own framing, so the
// previous value and all of the active confirmation control survive mobile and panoramic delivery.
async function renderStudio(browser, temp) {
  const composition = path.join(launch, 'source', 'fokus-studio.html');
  const views = [
    ['desktop', [
      [product, 'fokus-desktop-960.webp', 960, 640, 88],
      [product, 'fokus-desktop-1620.webp', 1620, 1080, 90],
    ]],
    ['mobil', [
      [product, 'fokus-mobil-540.webp', 540, 400, 87],
      [product, 'fokus-mobil-1080.webp', 1080, 800, 90],
    ]],
    ['panorama', [[product, 'fokus-panorama.webp', 1800, 720, 89]]],
    ['deling', [[path.join(launch, 'source'), 'fokus-deling.webp', 1200, 630, 93]]],
  ];
  const page = await browser.newPage({ viewport: { width: 1800, height: 1000 }, deviceScaleFactor: 1.8 });
  try {
    for (const [view, files] of views) {
      const url = pathToFileURL(composition);
      url.searchParams.set('view', view);
      await page.goto(url.href);
      await page.evaluate(() => Promise.all([...document.images].map(image => image.decode())));
      const png = path.join(temp, view + '.png');
      await page.locator('#studio').screenshot({ path: png });
      for (const [destination, name, width, height, quality] of files) {
        execFileSync('cwebp', ['-quiet', '-q', String(quality), '-m', '6', '-sharp_yuv',
          '-resize', String(width), String(height), png, '-o', path.join(destination, name)]);
      }
    }
  } finally {
    await page.close();
  }
}

async function main() {
  const rebuildSources = process.argv[2] === '--studio';
  const source = rebuildSources ? path.join(launch, 'source', 'product-center-stage.mp4')
    : process.argv[2] && path.resolve(process.argv[2]);
  if (source && !fs.existsSync(source)) throw new Error('Center Stage source not found: ' + source);
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'tm-launch-'));
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    if (rebuildSources) await renderStudio(browser, temp);
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
