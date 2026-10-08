// From the project root: node course-trailers/claude-code/source/render.cjs
// --stills exports only artwork; otherwise saved narration is mixed and encoded.
const fs = require('node:fs');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const { once } = require('node:events');
const { createServer } = require('node:http');
const { chromium } = require('@playwright/test');
const sharp = require('sharp');
const dir = path.resolve(__dirname, '..');
const FPS = 30, DURATION = 28;
(async () => {
 const server = createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const file = path.resolve(__dirname, '.' + pathname);
  if (!file.startsWith(__dirname + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
   response.writeHead(404); response.end(); return;
  }
  const mime = { '.html': 'text/html', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.wav': 'audio/wav' };
  response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(response);
 });
 await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
 const browser = await chromium.launch({ headless: true });
 try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${server.address().port}/trailer.html`);
  await page.evaluate(() => window.ready);
  async function frame(t) {
   return Buffer.from(await page.evaluate(t => {
    window.renderFrame(t);
    return document.querySelector('canvas').toDataURL('image/png').split(',')[1];
   }, t), 'base64');
  }
  const times = [3, 7.8, 12.7, 17.7, 20.4, 25.5], panels = [];
  for (let i = 0; i < times.length; i++) {
   const png = await frame(times[i]);
   fs.writeFileSync(path.join(dir, `scene-${i + 1}.png`), png);
   panels.push({ input: await sharp(png).resize(960, 540).toBuffer(), left: i % 2 * 960, top: Math.floor(i / 2) * 540 });
  }
  fs.writeFileSync(path.join(dir, 'poster.png'), await frame(25.5));
  await sharp({ create: { width: 1920, height: 1620, channels: 3, background: '#faf9f5' } }).composite(panels).png().toFile(path.join(dir, 'storyboard.png'));
  console.log('Six-scene storyboard and poster rendered.');
  if (process.argv.includes('--stills')) return;
  const mix = spawnSync('python3', [path.join(__dirname, 'mix-audio.py')], { stdio: 'inherit' });
  if (mix.status !== 0) throw Error('Audio mixing failed.');
  const temporary = path.join(dir, '.claude-code-trailer-render.mp4');
  const args = [
   '-hide_banner', '-loglevel', 'warning', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-i', 'pipe:0',
   '-i', path.join(__dirname, 'audio/final-mix.wav'), '-map', '0:v', '-map', '1:a',
   '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
   '-vf', 'scale=in_range=full:out_range=tv:out_color_matrix=bt709',
   '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
   '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-t', String(DURATION), '-movflags', '+faststart',
   '-metadata', 'title=Claude Code Tutorial — Baela',
   '-metadata', 'comment=Independent tutorial trailer. Official Claude Code logo. Illustrative walkthrough. Synthetic narration.', temporary,
  ];
  const ffmpeg = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] });
  const completed = once(ffmpeg, 'close');
  for (let i = 0; i < DURATION * FPS; i++) {
   if (!ffmpeg.stdin.write(await frame(i / FPS))) await once(ffmpeg.stdin, 'drain');
   if (i % 120 === 0) console.log(`Rendered ${i}/${DURATION * FPS} frames`);
  }
  ffmpeg.stdin.end();
  const [code] = await completed;
  if (code !== 0) throw Error(`ffmpeg exited ${code}`);
  const destination = path.join(dir, 'claude-code-trailer.mp4');
  fs.renameSync(temporary, destination);
  console.log('Complete: ' + destination);
 } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
