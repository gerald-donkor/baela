// Run from the project root: node course-trailers/claude-code/source/render.cjs
// Add --stills to render only the poster and storyboard panels.
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { pathToFileURL } = require('node:url');
const { chromium } = require('@playwright/test');
const sharp = require('sharp');
const dir=path.resolve(__dirname,'..');
const FPS=30,DURATION=24,RATE=48000;

function soundtrack(){
  // Entirely original synthesis: soft triads, a sparse arpeggio and a low pulse.
  // No samples, recordings, third-party music, or generated speech.
  const n=RATE*DURATION, data=Buffer.alloc(n*4), chords=[[130.8128,155.5635,195.9977,233.0819],[103.8262,130.8128,155.5635,207.6523],[116.5409,146.8324,174.6141,233.0819],[130.8128,155.5635,195.9977,261.6256]];
  let peak=0;const buf=new Float32Array(n*2);
  for(let i=0;i<n;i++){
    const t=i/RATE,section=Math.min(3,Math.floor(t/6)),local=t-section*6,chord=chords[section];
    const beat=t%.5,pluck=t%.25,gate=Math.min(1,local/.7)*Math.min(1,(6-local)/.7);
    let l=0,r=0;
    chord.forEach((f,j)=>{const env=.047*gate; l+=env*Math.sin(2*Math.PI*f*t+.13*j)*(1+.14*Math.sin(t*.7+j));r+=env*Math.sin(2*Math.PI*(f+.11)*t+.16*j)*(1+.14*Math.sin(t*.65+j));});
    const f=chord[Math.floor(t/.25)%4]*2;
    const arp=.075*Math.exp(-pluck*18)*Math.min(1,pluck/.006)*(Math.sin(2*Math.PI*f*pluck)+.22*Math.sin(4*Math.PI*f*pluck));
    const kick=.075*Math.exp(-beat*21)*Math.sin(2*Math.PI*(48*beat+1.2*(1-Math.exp(-beat*35))));
    const fade=Math.min(1,t/1.2)*Math.min(1,(24-t)/1.8);
    l=(l+arp*.8+kick)*fade;r=(r+arp+kick)*fade;
    buf[2*i]=l;buf[2*i+1]=r;peak=Math.max(peak,Math.abs(l),Math.abs(r));
  }
  const gain=.55/peak;
  for(let i=0;i<buf.length;i++)data.writeInt16LE(Math.round(buf[i]*gain*32767),i*2);
  const header=Buffer.alloc(44);header.write('RIFF');header.writeUInt32LE(36+data.length,4);header.write('WAVEfmt ',8);header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(2,22);header.writeUInt32LE(RATE,24);header.writeUInt32LE(RATE*4,28);header.writeUInt16LE(4,32);header.writeUInt16LE(16,34);header.write('data',36);header.writeUInt32LE(data.length,40);
  fs.writeFileSync(path.join(__dirname,'soundtrack.wav'),Buffer.concat([header,data]));
}

(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
    await page.goto(pathToFileURL(path.join(__dirname,'trailer.html')).href);
    await page.evaluate(()=>window.ready);
    async function frame(t){return Buffer.from(await page.evaluate(t=>{window.renderFrame(t);return document.querySelector('canvas').toDataURL('image/png').split(',')[1]},t),'base64')}
    const times=[3,9,15,21];const panels=[];
    for(let i=0;i<times.length;i++){
      const png=await frame(times[i]);fs.writeFileSync(path.join(dir,`scene-${i+1}.png`),png);
      panels.push({input:await sharp(png).resize(960,540).toBuffer(),left:i%2*960,top:Math.floor(i/2)*540});
    }
    fs.writeFileSync(path.join(dir,'poster.png'),await frame(21));
    await sharp({create:{width:1920,height:1080,channels:3,background:'#050919'}}).composite(panels).png().toFile(path.join(dir,'storyboard.png'));
    console.log('Poster and storyboard rendered.');
    if(process.argv.includes('--stills'))return;
    soundtrack();
    const args=['-hide_banner','-loglevel','warning','-y','-f','image2pipe','-framerate',String(FPS),'-i','pipe:0','-i',path.join(__dirname,'soundtrack.wav'),'-map','0:v','-map','1:a','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-vf','scale=in_range=full:out_range=tv:out_color_matrix=bt709','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-c:a','aac','-b:a','192k','-ar','48000','-af','loudnorm=I=-18:TP=-1.5:LRA=7','-t',String(DURATION),'-movflags','+faststart','-metadata','title=Claude Code Tutorial — Baela','-metadata','comment=Original motion graphics and synthesized soundtrack. Illustrative workflow.',path.join(dir,'claude-code-trailer.mp4')];
    const ffmpeg=spawn('ffmpeg',args,{stdio:['pipe','inherit','inherit']});
    const completed=once(ffmpeg,'close');
    for(let i=0;i<DURATION*FPS;i++){
      const png=await frame(i/FPS);if(!ffmpeg.stdin.write(png))await once(ffmpeg.stdin,'drain');
      if(i%90===0)console.log(`Rendered ${i}/${DURATION*FPS} frames`);
    }
    ffmpeg.stdin.end();const [code]=await completed;if(code!==0)throw Error(`ffmpeg exited ${code}`);
    console.log('Complete: '+path.join(dir,'claude-code-trailer.mp4'));
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
