import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { chromium as pw } from 'playwright-core';
const browser = await pw.launch({executablePath:process.env.CHROME_BIN,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],headless:true});
try {
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});
 const errors=[];page.on('pageerror', e=>errors.push(e.message));
 await page.route('https://planetary.test/**',async route=>{
  const path=new URL(route.request().url()).pathname.replace(/^\/planetary\//,'')||'index.html';
  await route.fulfill({body:await readFile(resolve('dist',path)),contentType:path.endsWith('.js')?'application/javascript':path.endsWith('.css')?'text/css':'text/html'});
 });
 await page.goto('https://planetary.test/planetary/');
 await page.locator('#planet-nav button').last().waitFor({timeout:15000}).catch(e=>{throw Error('Renderer failed: '+errors.join(', ')+e.message)});
 for(const [w,h] of [[390,844],[320,568],[844,390],[1366,900]]){
  await page.setViewportSize({width:w,height:h});
  const compact=w<701||h<=500;
  assert.equal(await page.locator('#details').isVisible(),!compact);
  assert.equal(await page.locator('#observatory').isVisible(),!compact);
  if(!compact)continue;
  if(w===390)await page.screenshot({path:resolve('planetary-mobile.jpg'),quality:88});
  assert.equal(await page.evaluate(()=>document.elementFromPoint(innerWidth/2,innerHeight/2)?.id),'universe');
  await page.getByRole('button',{name:'Observatory',exact:true}).click();
  assert.equal(await page.locator('#observatory').isVisible(),true);
  await page.locator('#info-toggle').click();
  assert.equal(await page.locator('#details').isVisible(),true);
  assert.equal(await page.locator('#observatory').isVisible(),false);
  await page.locator('#focus').click();
  assert.equal(await page.locator('#details').isVisible(),false);
  await page.locator('#planet-nav button').filter({hasText:'Earth'}).click();
  assert.equal(await page.locator('#info-toggle').innerText(),'Earth info');
  await page.locator('#info-toggle').click();
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#details').isVisible(),false);
  await page.getByRole('button',{name:'Observatory',exact:true}).click();
  await page.locator('#reset').click();
  assert.equal(await page.locator('#observatory').isVisible(),false);
  console.log('Verified',w,h);
 }
 assert.deepEqual(errors,[]);console.log('WebGL initialization, mobile panels, desktop layout verified');
}finally{await browser.close();}
