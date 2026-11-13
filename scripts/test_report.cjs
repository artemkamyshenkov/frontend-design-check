'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { build } = require('./build_report.cjs');
const script = path.join(__dirname, 'build_report.cjs');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZ1cAAAAASUVORK5CYII=', 'base64');
function fixture() {
  return { title: '<script>alert(1)</script>', target: '[data-ti="feature"]', environment: 'macOS, DPR 1', limitations: ['Live data'], checks: [{ browser: 'Google Chrome', viewport: 360, state: 'default', status: 'review', actual: { path: 'a.png', cssWidth: 1 }, reference: { path: 'a.png', cssWidth: 1 }, notes: '<b>test</b>' }], findings: [{ title: 'Spacing', severity: 'major', browser: 'Google Chrome', evidence: 'DOM 24 vs Figma 16', expected: '16', actual: '24', viewport: 360 }] };
}
function run(t, mutate = () => {}, setup = () => {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'design-report-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(root, 'a.png'), png);
  const data = fixture();
  mutate(data); setup(root);
  const input = path.join(root, 'input.json');
  const output = path.join(root, 'report.html');
  fs.writeFileSync(input, JSON.stringify(data));
  const result = spawnSync(process.execPath, [script, input, output], { encoding: 'utf8' });
  return { ...result, html: fs.existsSync(output) ? fs.readFileSync(output, 'utf8') : '', root, input, output };
}
function ok(result) { assert.equal(result.status, 0, result.stderr); return result.html; }
function rejected(result) { assert.notEqual(result.status, 0); assert.equal(result.html, ''); }
test('self-contained images, escaped text and difference control', t => {
  const html = ok(run(t));
  assert.match(html, /data:image\/png;base64,/);
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.match(html, /&lt;script&gt;/); assert.match(html, /&lt;b&gt;test&lt;\/b&gt;/);
  assert.match(html, /mix-blend-mode:difference/); assert.match(html, /data-overlay="overlay-0"/);
});
test('missing reference is explicit', t => assert.match(ok(run(t, d => delete d.checks[0].reference)), /Нет референса/));
for (const name of ['https://example.com/a.png', '../a.png', '/tmp/a.png', 'C:\\temp\\a.png', 'missing.png']) {
  test(`reject image path ${name}`, t => rejected(run(t, d => d.checks[0].actual.path = name)));
}
for (const status of ['probably_passed', 'toString', '__proto__']) {
  test(`reject unknown status ${status}`, t => rejected(run(t, d => d.checks[0].status = status)));
}
for (const width of [0, -1, true, '10']) {
  test(`reject cssWidth ${JSON.stringify(width)}`, t => rejected(run(t, d => d.checks[0].actual.cssWidth = width)));
}
test('unknown scale keeps both images without overlay', t => {
  const html = ok(run(t, d => d.checks[0].reference.cssWidth = null));
  assert.match(html, /Масштаб неизвестен/); assert.ok(!html.includes('<button data-overlay='));
  assert.equal(html.split('data:image/png;base64,').length - 1, 2);
});
test('matched requires reference', t => rejected(run(t, d => { delete d.checks[0].reference; d.checks[0].status = 'matched'; })));
test('group by browser including prototype-like names', t => {
  const html = ok(run(t, d => { d.checks.push({ ...d.checks[0], browser: 'WebKit', viewport: 768 }, { ...d.checks[0], browser: '__proto__' }); }));
  for (const name of ['Google Chrome', 'WebKit', '__proto__']) assert.ok(html.includes(`Браузер: ${name}`));
  assert.match(html, /<th>Браузер<\/th>/);
});
for (const [status, message] of [['skipped', 'Пропущено'], ['blocked', 'Заблокировано'], ['measured', 'Измерено без снимка']]) {
  test(`${status} needs no capture`, t => assert.ok(ok(run(t, d => { d.checks = [{ browser: 'Google Chrome', viewport: 992, status, notes: 'Причина или измерения' }]; })).includes(message)));
}
test('browser required', t => rejected(run(t, d => delete d.checks[0].browser)));
test('metadata and comparison visible', t => {
  const html = ok(run(t, d => { Object.assign(d.checks[0], { browserVersion: '128.0', engine: 'Blink' }); d.findings[0].comparison = 'различие между браузерами'; }));
  for (const value of ['128.0', 'Blink', 'различие между браузерами']) assert.ok(html.includes(value));
});
test('reject symlink outside package', t => rejected(run(t, d => d.checks[0].actual.path = 'link.png', root => {
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'outside-report-'));
  t.after(() => fs.rmSync(outside, { recursive: true, force: true }));
  fs.writeFileSync(path.join(outside, 'outside.png'), png);
  fs.symlinkSync(path.join(outside, 'outside.png'), path.join(root, 'link.png'));
})));
test('reject image over 30 MiB', t => rejected(run(t, () => {}, root => fs.truncateSync(path.join(root, 'a.png'), 30 * 1024 * 1024 + 1))));
test('reject SVG', t => rejected(run(t, () => {}, root => fs.writeFileSync(path.join(root, 'a.png'), '<svg/>'))));
test('accept JPEG signature', t => assert.match(ok(run(t, () => {}, root => fs.writeFileSync(path.join(root, 'a.png'), Buffer.from('ffd8ffffd9', 'hex')))), /data:image\/jpeg;base64,/));
test('refuse overwrite and preserve existing report', t => {
  const result = run(t); ok(result);
  const second = spawnSync(process.execPath, [script, result.input, result.output], { encoding: 'utf8' });
  assert.notEqual(second.status, 0); assert.equal(fs.readFileSync(result.output, 'utf8'), result.html);
});
for (const [name, mutate] of [
  ['empty checks', d => d.checks = []], ['findings object', d => d.findings = {}],
  ['missing evidence', d => delete d.findings[0].evidence], ['missing actual', d => delete d.checks[0].actual],
  ['invalid viewport', d => d.checks[0].viewport = 0],
]) test(`reject ${name}`, t => rejected(run(t, mutate)));
test('reject non-finite width before rendering', t => {
  const r = run(t); const data = fixture(); data.checks[0].actual.cssWidth = Infinity;
  assert.throws(() => build(data, r.root), /положительное конечное/);
});
test('malformed JSON creates no report', t => {
  const r = run(t); fs.writeFileSync(r.input, '{');
  const output = path.join(r.root, 'bad.html');
  const result = spawnSync(process.execPath, [script, r.input, output], { encoding: 'utf8' });
  assert.notEqual(result.status, 0); assert.ok(!fs.existsSync(output));
});
test('CLI help and argument count', () => {
  assert.equal(spawnSync(process.execPath, [script, '--help']).status, 0);
  assert.notEqual(spawnSync(process.execPath, [script]).status, 0);
});
