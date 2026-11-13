#!/usr/bin/env node
'use strict';
// Build a standalone visual review using Node.js 18+ standard library only.
const fs = require('node:fs');
const path = require('node:path');

const STATUS = new Map(Object.entries({
  matched: 'Проверено: совпадает', review: 'Нужен просмотр',
  'no-reference': 'Нет референса', blocked: 'Заблокировано',
  skipped: 'Пропущено', measured: 'Измерено без снимка',
}));
const esc = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;',
})[char]);
function positive(value, label) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new Error(`${label}: требуется положительное конечное число`);
  }
  return value;
}
function embed(item, root) {
  const name = item.path;
  if (typeof name !== 'string' || !name || path.isAbsolute(name) ||
      path.win32.isAbsolute(name) || name.split(/[\\/]/).includes('..') || name.includes('://')) {
    throw new Error('Путь изображения должен быть относительным внутри пакета');
  }
  const filename = fs.realpathSync(path.resolve(root, name));
  const relative = path.relative(root, filename);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error('Изображение находится вне пакета');
  }
  const limit = 30 * 1024 * 1024;
  if (fs.statSync(filename).size > limit) throw new Error('Изображение больше 30 МБ; экспортируйте меньшую область');
  const raw = fs.readFileSync(filename);
  if (raw.length > limit) throw new Error('Изображение больше 30 МБ; экспортируйте меньшую область');
  let mime;
  if (raw.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) mime = 'image/png';
  else if (raw.subarray(0, 3).equals(Buffer.from('ffd8ff', 'hex'))) mime = 'image/jpeg';
  else throw new Error('Поддерживаются PNG и JPEG; SVG нужно экспортировать в PNG');
  const width = item.cssWidth == null ? null : positive(item.cssWidth, 'cssWidth');
  const style = width == null ? 'width:600px' : `width:${width}px`;
  return `<img style="${style}" src="data:${mime};base64,${raw.toString('base64')}" alt="${esc(item.label ?? path.basename(filename))}">`;
}
function build(data, root) {
  root = fs.realpathSync(root);
  const checks = data.checks;
  if (!Array.isArray(checks) || !checks.length) throw new Error('checks: нужна хотя бы одна запись, в том числе blocked для незавершённой проверки');
  const findings = data.findings ?? [];
  if (!Array.isArray(findings)) throw new Error('findings должен быть списком');
  const css = "body{font:16px/1.5 system-ui,sans-serif;color:#181c2d;background:#f4f4fa;max-width:1280px;margin:32px auto;padding:0 20px}h1{font-size:30px}section{background:white;border-radius:16px;padding:24px;margin:24px 0}.browser-group{border:2px solid #e0d9ff}.check{border-top:1px solid #ddd;padding-top:20px;margin-top:20px}table{width:100%;min-width:760px;border-collapse:collapse}.table-scroll{overflow-x:auto}td,th{text-align:left;padding:10px;border-bottom:1px solid #ddd;vertical-align:top;overflow-wrap:anywhere}code,p,li,pre{overflow-wrap:anywhere}.scroll{background:#ececf3;padding:12px;min-width:0}.pair{display:flex;gap:16px;align-items:flex-start}.pair figure{margin:0;flex:1;min-width:0}@media(max-width:700px){.pair{flex-direction:column}.pair figure{width:100%}}figcaption{font-weight:600;margin-bottom:8px}img{display:block;height:auto;max-width:100%;object-fit:contain}.overlay{display:grid;grid-template-columns:minmax(0,1fr);isolation:isolate;max-width:100%}.overlay img{grid-area:1/1;align-self:start;justify-self:start}.overlay img:nth-child(2){opacity:.5}.overlay.diff img:nth-child(2){opacity:1;mix-blend-mode:difference}button{padding:8px 16px;cursor:pointer;margin:12px 0}summary{cursor:pointer;margin-top:12px}small{color:#555a7a}pre{white-space:pre-wrap}";
  const result = [
    `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(data.title ?? 'Дизайн-чек')}</title><style>${css}</style></head><body>`,
    `<h1>${esc(data.title ?? 'Дизайн-чек')}</h1>`,
    `<p>${esc(data.environment ?? 'Окружение не указано')}</p><p>Цель: <code>${esc(data.target ?? 'Не указана')}</code></p>`,
    '<p>Сравнение подготовлено агентом. Визуальный difference не является автоматическим вердиктом.</p>',
    '<section><h2>Замечания</h2>',
  ];
  if (!findings.length) result.push('<p>Замечания не внесены. Это не означает, что все проверки выполнены: см. покрытие и ограничения.</p>');
  else {
    result.push('<table><thead><tr><th>Элемент / влияние</th><th>Ожидалось</th><th>Получено</th><th>Доказательство</th></tr></thead><tbody>');
    for (const f of findings) {
      if (!f.title || !f.evidence) throw new Error('Каждому замечанию нужны title и evidence');
      const comparison = f.comparison ? `<br>${esc(f.comparison)}` : '';
      result.push(`<tr><td><b>${esc(f.title)}</b><br>${esc(f.severity ?? 'review')} · ${esc(f.browser ?? 'Браузер не указан')} · ${esc(f.viewport ?? '—')} px · ${esc(f.state ?? 'default')}${comparison}<br>${esc(f.impact ?? '')}</td><td>${esc(f.expected ?? '—')}</td><td>${esc(f.actual ?? '—')}</td><td>${esc(f.evidence)}<br>${esc(f.source ?? '')}<br>${esc(f.confidence ?? '')}</td></tr>`);
    }
    result.push('</tbody></table>');
  }
  result.push('</section><section><h2>Покрытие</h2><table><thead><tr><th>Браузер</th><th>Ширина</th><th>Состояние</th><th>Статус</th><th>Примечание</th></tr></thead><tbody>');
  const browsers = new Map();
  checks.forEach((check, i) => {
    if (typeof check.browser !== 'string' || !check.browser.trim()) throw new Error('Каждой проверке требуется непустое поле browser');
    const browser = check.browser.trim();
    const meta = [check.browserVersion, check.engine].filter(Boolean).map(esc).join(' · ');
    const label = esc(browser) + (meta ? `<br><small>${meta}</small>` : '');
    if (!browsers.has(browser)) browsers.set(browser, []);
    const sections = browsers.get(browser);
    const viewport = positive(check.viewport, 'viewport');
    const status = check.status;
    if (!STATUS.has(status)) throw new Error(`Неизвестный status: ${status}`);
    const { actual, reference } = check;
    if (!['blocked', 'skipped', 'measured'].includes(status) && !actual) throw new Error('Для незаблокированной проверки нужен actual');
    if (status === 'matched' && !reference) throw new Error('matched требует референс; используйте no-reference');
    const state = esc(check.state ?? 'default');
    result.push(`<tr><td>${label}</td><td>${viewport}</td><td>${state}</td><td>${STATUS.get(status)}</td><td>${esc(check.notes ?? '')}</td></tr>`);
    const metadata = meta ? `<p><small>${meta}</small></p>` : '';
    sections.push(`<article class="check"><h3>${viewport} px · ${state}</h3>${metadata}<p>${STATUS.get(status)}</p><p>${esc(check.notes ?? '')}</p>`);
    const a = actual ? embed(actual, root) : '';
    const b = reference ? embed(reference, root) : '';
    const pair = `<div class="scroll"><div class="pair"><figure><figcaption>Референс</figcaption>${b}</figure><figure><figcaption>Реализация</figcaption>${a}</figure></div></div>`;
    if (a && b && (actual.cssWidth == null || reference.cssWidth == null)) {
      sections.push(`<p>Масштаб неизвестен: только просмотр рядом, без наложения и точных измерений по изображению. Картинки могут отображаться уменьшенными.</p>${pair}`);
    } else if (a && b) {
      sections.push(`${pair}<details><summary>Наложение и difference</summary><p><small>Оба изображения уменьшены в одном масштабе до ширины контейнера; пропорции сохранены. Выравнивание по верхнему левому углу. Различия данных и шрифтов могут давать шум.</small></p><button data-overlay="overlay-${i}" aria-pressed="false">Режим: наложение 50%</button><div class="scroll"><div id="overlay-${i}" class="overlay" style="width:${Math.max(actual.cssWidth, reference.cssWidth)}px">${b.replace(`width:${reference.cssWidth}px`, `width:${100 * reference.cssWidth / Math.max(actual.cssWidth, reference.cssWidth)}%`)}${a.replace(`width:${actual.cssWidth}px`, `width:${100 * actual.cssWidth / Math.max(actual.cssWidth, reference.cssWidth)}%`)}</div></div></details>`);
    } else if (a) sections.push(`<p>Нет референса: соответствие макету не подтверждено.</p><div class="scroll">${a}</div>`);
    else if (status === 'measured') sections.push('<p>Снимок не включён: ширина проверена измерениями. Подробности указаны в примечании.</p>');
    else sections.push('<p>Снимок реализации не получен.</p>');
    sections.push('</article>');
  });
  result.push('</tbody></table></section>');
  for (const [browser, sections] of browsers) {
    result.push(`<section class="browser-group"><h2>Браузер: ${esc(browser)}</h2>`, ...sections, '</section>');
  }
  result.push('<section><h2>Ограничения</h2><ul>');
  for (const note of data.limitations ?? ['Ограничения не заполнены; полнота проверки не подтверждена.']) result.push(`<li>${esc(note)}</li>`);
  result.push('</ul><h2>Условия и источники</h2><pre>' + esc(data.provenance ?? 'Не указаны') + '</pre></section>');
  result.push(`<script>document.querySelectorAll('button[data-overlay]').forEach(button=>button.addEventListener('click',()=>{const diff=document.getElementById(button.dataset.overlay).classList.toggle('diff');button.setAttribute('aria-pressed',String(diff));button.textContent=diff?'Режим: difference':'Режим: наложение 50%';}));</script></body></html>`);
  return result.join('').replaceAll('<table>', '<div class="table-scroll"><table>').replaceAll('</table>', '</table></div>');
}
function main(args) {
  if (args.length === 1 && ['--help', '-h'].includes(args[0])) {
    console.log('node build_report.cjs <report.json> <report.html>\nСоздаёт автономный HTML; существующий файл не перезаписывается.');
    return 0;
  }
  if (args.length !== 2) {
    console.error('Использование: node build_report.cjs <report.json> <report.html>');
    return 1;
  }
  try {
    const [input, output] = args;
    const data = JSON.parse(fs.readFileSync(input, 'utf8'));
    const html = build(data, path.dirname(fs.realpathSync(input)));
    fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
    fs.writeFileSync(output, html, { encoding: 'utf8', flag: 'wx' });
    console.log(path.resolve(output));
    return 0;
  } catch (error) {
    console.error(`Не удалось собрать отчёт: ${error.message}`);
    return 1;
  }
}
module.exports = { build };
if (require.main === module) process.exitCode = main(process.argv.slice(2));
