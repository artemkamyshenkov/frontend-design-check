'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
function plan(t, overrides = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'capture-plan-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const config = path.join(root, 'config.json');
  fs.writeFileSync(config, JSON.stringify({ url: 'http://localhost:4000/', selector: '[data-ti=feature]', referenceWidths: [360, 767, 1200], componentBreakpoints: [768], designSystemBreakpoints: [576, 768], visibility: 'visible', ...overrides }));
  const result = spawnSync(process.execPath, [path.join(__dirname, 'capture_playwright.cjs'), '--plan', config], { encoding: 'utf8' });
  return { ...result, plan: result.status === 0 ? JSON.parse(result.stdout) : null };
}
test('fast uses references and component boundary', t => {
  const r = plan(t); assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(r.plan.widths, [360, 767, 768, 1200]);
  assert.deepEqual(r.plan.browserProfiles, ['chrome']);
  assert.deepEqual(r.plan.browserWidths, { chrome: [360, 767, 768, 1200] });
  assert.deepEqual(r.plan.screenshotWidths, [360, 767, 768, 1200]);
});
test('full expands design system boundaries', t => {
  const r = plan(t, { mode: 'full' }); assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(r.plan.widths, [360, 575, 576, 577, 767, 768, 769, 1200]);
  assert.deepEqual(r.plan.browserProfiles, ['chrome', 'webkit']);
  assert.deepEqual(r.plan.browserWidths, { chrome: [360, 575, 576, 577, 767, 768, 769, 1200], webkit: [360, 767, 768, 769, 1200] });
});
test('secondary browser widths override', t => {
  const r = plan(t, { mode: 'full', browserWidths: { webkit: [360, 1024] } });
  assert.equal(r.status, 0, r.stderr); assert.deepEqual(r.plan.browserWidths.webkit, [360, 1024]);
});
test('invalid mode rejected before browser launch', t => {
  const r = plan(t, { mode: 'slow' }); assert.notEqual(r.status, 0); assert.equal(r.plan, null); assert.match(r.stderr, /fast или full/);
});
test('page does not need selector and uses responsive defaults', t => {
  const r = plan(t, {scope:'page', selector:null, referenceWidths:[], componentBreakpoints:[]});
  assert.equal(r.status,0,r.stderr); assert.equal(r.plan.scope,'page');
  assert.deepEqual(r.plan.widths,[360,768,1024,1440]);
});
test('explicit widths are exact for every browser, including under 360', t => {
  const r=plan(t,{mode:'full',widths:[320,992]});
  assert.equal(r.status,0,r.stderr); assert.deepEqual(r.plan.browserWidths,{chrome:[320,992],webkit:[320,992]});
});
test('feature still requires selector',t=>assert.notEqual(plan(t,{selector:null}).status,0));
test('empty and invalid explicit widths fail instead of silently falling back',t=>{
  for(const widths of [[],[0],[320.5],['360']]) assert.notEqual(plan(t,{widths}).status,0);
});
