import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { effectiveMedia } from './lib/effective-media.mjs';
const load = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const details=load('src/project-details.json'), overrides=load('src/project-media-overrides.json'), access=load('src/project-access.json');
test('a metadata-bot rewrite cannot replace verified clips with stale repository URLs', () => {
  const stale=structuredClone(details);
  for(const slug of Object.keys(overrides)) stale[slug]={...stale[slug],trailers:[{url:'https://broken.invalid/unavailable.mp4'}],videos:[{url:'https://broken.invalid/unavailable-extra.mp4',kind:'video'}]};
  const effective=effectiveMedia(stale,overrides,access);
  for(const [slug,record] of Object.entries(overrides)) {
    assert.deepEqual(effective[slug].trailers,record.trailers,slug);
    assert.deepEqual(effective[slug].videos,record.videos,`${slug}: stale extra videos cannot reappear`);
  }
});
test('native media remains authoritative after generated metadata rewrites', () => {
  const effective=effectiveMedia(details,overrides,access);
  for(const [slug,entry] of Object.entries(access)) if(entry.kind!=='web'){
    assert.deepEqual(effective[slug].videos,entry.videos,slug);
    assert.deepEqual(effective[slug].trailers,[],slug);
  }
});
test('every portfolio-owned video and poster exists and fits static delivery limits', () => {
  const effective=effectiveMedia(details,overrides,access);
  for(const [slug,record] of Object.entries(effective)) for(const clip of [...record.trailers??[],...record.videos??[]]){
    for(const url of [clip.url,clip.poster].filter(v=>v?.startsWith('/'))){
      const size=fs.statSync('public'+url).size;
      assert(size>0&&size<=25*1024*1024,`${slug}: ${url}`);
    }
  }
});
