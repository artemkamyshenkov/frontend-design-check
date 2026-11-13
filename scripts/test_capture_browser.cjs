'use strict';
// Integration check: needs Playwright and installed Chrome; uses only a local fixture.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const http=require('node:http');
const {spawn}=require('node:child_process');
const {build}=require('./build_report.cjs');
test('Chrome captures page, opens feature and reports unavailable targets',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'design-check-browser-'));
 const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(`<!doctype html><html><body style="margin:0"><button id="open" onclick="document.querySelector('#feature').hidden=false">Фильтры</button><section id="feature" hidden style="box-sizing:border-box;width:100%;padding:16px;background:#eef">Фильтры <button>Применить</button></section><div class="duplicate">Первый</div><div class="duplicate">Второй</div><section id="hidden" hidden>Скрытый</section><main style="height:1600px">Содержимое страницы</main></body></html>`)});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(async()=>{await new Promise(resolve=>server.close(resolve));fs.rmSync(root,{recursive:true,force:true})});
 async function capture(name,extra){
  const dir=path.join(root,name);fs.mkdirSync(dir);
  const config={url:`http://127.0.0.1:${server.address().port}`,visibility:'headless',widths:[360,992],dismissControls:[],targetTimeoutMs:400,outputDir:'run',...extra};
  const cfg=path.join(dir,'config.json');fs.writeFileSync(cfg,JSON.stringify(config));
  await new Promise((resolve,reject)=>{const p=spawn(process.execPath,[path.join(__dirname,'capture_playwright.cjs'),cfg]);let log='';p.stdout.on('data',s=>log+=s);p.stderr.on('data',s=>log+=s);p.on('error',reject);p.on('exit',c=>c===0?resolve():reject(new Error(log)))});
  const result=JSON.parse(fs.readFileSync(path.join(dir,'run','capture-results.json')));
  assert.notEqual(result.results[0].status,'skipped',result.results[0].error);
  return {profile:result.results[0],dir:path.join(dir,'run')};
 }
 const page=await capture('page',{scope:'page'});
 assert.equal(page.profile.checks.length,2);
 for(const check of page.profile.checks){assert.equal(check.status,'captured');assert.equal(check.availability,'visible');assert.ok(fs.statSync(path.join(page.dir,'actual',check.filename)).size>0)}
 const feature=await capture('feature',{selector:'#feature',openControl:{role:'button',name:'Фильтры'}});
 for(const check of feature.profile.checks){assert.equal(check.availability,'visible');assert.equal(check.status,'captured')}
 const ambiguousOpen=await capture('ambiguous-open',{selector:'.duplicate',openControl:{selector:'#absent-button'}});
 assert.equal(ambiguousOpen.profile.checks[0].availability,'ambiguous');
 for(const [selector,expected] of [['#missing','missing'],['#hidden','hidden'],['.duplicate','ambiguous']]){
  const r=await capture(expected,{selector});assert.equal(r.profile.checks.length,1);assert.equal(r.profile.status,'blocked');assert.equal(r.profile.checks[0].availability,expected);
 }
 const report={title:'Проверка адаптивности',target:'#feature',limitations:['Без макета'],checks:feature.profile.checks.map(c=>({browser:'Chrome',viewport:c.width,status:'no-reference',actual:{path:'actual/'+c.filename,cssWidth:c.geometry.rect.width}}))};
 const html=build(report,feature.dir);assert.ok(html.includes('data:image/png;base64,'));assert.ok(html.includes('соответствие макету не подтверждено'));
});
