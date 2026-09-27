import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { preview } from 'vite';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
const access=JSON.parse(await fs.readFile('src/project-access.json','utf8'));
const projects=JSON.parse(await fs.readFile('src/project-data.json','utf8'));
const projectFlag=process.argv.indexOf('--project');
const selectedSlug=projectFlag>=0?process.argv[projectFlag+1]:undefined;
if(projectFlag>=0)assert(selectedSlug,'--project requires a native/archive slug');
const native=Object.entries(access).filter(([slug,entry])=>entry.kind!=='web'&&(!selectedSlug||slug===selectedSlug));
assert(native.length,'No matching native/archive project');
for(const [slug,entry] of native){
 const project=projects.find(p=>p.slug===slug);assert(project,slug);assert(!project.deploymentUrl,`${slug}: no browser demo`);
 for(const file of [...entry.images.map(i=>i.path),...entry.videos.map(v=>v.url),entry.downloadUrl,entry.transcriptUrl,entry.creditsUrl].filter(Boolean)){
  assert(file.startsWith('/native/'),`${slug}: native media provenance path`);
  const size=(await fs.stat(`public${file}`)).size;assert(size>0,`${slug}: nonempty artifact`);assert(size<=25*1024*1024,`${slug}: static hosting file limit`);
 }
}
const server=await preview({preview:{host:'127.0.0.1',port:4189,strictPort:true}});
const browser=await chromium.launch({headless:true,channel:process.platform==='win32'?'chrome':undefined});
await fs.mkdir('output/playwright', {recursive:true});
const errors=[];
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 for(const [slug,entry] of native){
  console.log('Checking native/archive: '+slug);
  await page.goto(`http://127.0.0.1:4189/projects/${slug}`);await page.getByRole('heading',{name:'Run & availability',exact:true}).waitFor();
  assert.equal(await page.locator('.project-actions').getByRole('link',{name:/Open live project|Play the game/}).count(),0,slug);
  const cover=page.locator('.project-cover img');await cover.waitFor();await cover.evaluate(img=>img.decode());
  assert((await cover.getAttribute('src')).startsWith(entry.images.length?'/native/':'/project-shots/native-placeholder.svg'),`${slug}: authentic source or explicit placeholder`);
  for(const link of await page.locator('.project-access a').all()){
   const href=await link.getAttribute('href');if(href.startsWith('/'))assert((await page.request.get(new URL(href,page.url()).href)).ok(),`${slug}: download/transcript works`);
  }
  if(['portfolio-ai-orchestrator','helloword','unity-audio-recorder','my-musical-app-code','bean-tapper-arena','miata-lights'].includes(slug)){
   const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();assert.equal(result.violations.length,0,`${slug}: ${result.violations.map(v=>v.id).join(',')}`);
  }
  if(entry.videos.length){
   await page.locator('.project-cover').getByRole('button',{name:/Watch video/}).click();
   const video=page.locator('dialog video');await video.waitFor();await video.evaluate(v=>v.play());
   await page.waitForFunction(()=>{const v=document.querySelector('dialog video');return v && v.currentTime>0 && v.videoWidth>0});
   assert((await video.getAttribute('src')).startsWith('/native/'),`${slug}: actual native clip`);
   if(slug==='miata-lights'){
    for(const viewport of [{width:1440,height:1000},{width:390,height:844},{width:844,height:390}]){
     await page.setViewportSize(viewport);
     const frame=await video.evaluate(v=>{const r=v.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,ratio:v.videoWidth/v.videoHeight,fit:getComputedStyle(v).objectFit};});
     assert.equal(frame.fit,'contain',`${slug}: portrait footage is not cropped`);
     assert(Math.abs(frame.width-frame.height*frame.ratio)<2,`${slug}: native aspect ratio retained`);
     assert(frame.x>=0&&frame.y>=0&&frame.x+frame.width<=viewport.width+1&&frame.y+frame.height<=viewport.height+1,`${slug}: whole portrait video fits ${viewport.width}x${viewport.height}`);
    }
    await page.setViewportSize({width:1440,height:1000});
   }
   await page.keyboard.press('Escape');
  }
  if(['portfolio-ai-orchestrator','helloword','unity-audio-recorder','soundstage-composer','bean-tapper-arena','miata-lights'].includes(slug)){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`output/playwright/native-${slug}.png`});}
  await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${slug}: mobile overflow`);await page.setViewportSize({width:1440,height:1000});
 }
 assert.deepEqual(errors,[]);console.log(`PASS ${native.length} native/archive pages: authentic media, honest access, artifacts, mobile overflow, selected accessibility`);
}finally{await browser.close();await new Promise(resolve=>server.httpServer.close(resolve));}
