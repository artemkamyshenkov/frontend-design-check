#!/usr/bin/env node
/** Batch visual-check capture. Node.js 18+, Playwright supplied by project/runtime. */
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');

const DEFAULT_BREAKPOINTS = [576, 768, 992, 1200, 1400];
const DEFAULT_DISMISS_CONTROLS = [
	{ selector: '[data-ti="bdui-modal"] button[data-ti="close-button"]', label: 'Рекламная модалка: крестик' },
];

function fail(message) {
	throw new Error(message);
}

function uniqueWidths(values) {
	return [...new Set(values.map(Number).filter(value => Number.isFinite(value) && Number.isInteger(value) && value > 0))].sort((a, b) => a - b);
}

function normalizeConfig(raw, configPath) {
	if (!raw || typeof raw !== 'object') fail('Конфиг должен быть JSON-объектом');
	const scope = raw.scope ?? 'feature';
	if (!['page', 'feature'].includes(scope)) fail('scope: page или feature');
	if (!raw.url || (scope === 'feature' && !raw.selector)) fail('Нужны url и selector для фичи');
	if (raw.widths !== undefined && (!Array.isArray(raw.widths) || !raw.widths.length || raw.widths.some(v => !Number.isInteger(v) || v <= 0))) fail('widths: нужен непустой список положительных целых чисел');
	if (raw.openControl && !(raw.openControl.selector || (raw.openControl.role && raw.openControl.name))) fail('openControl: нужен selector либо role/name');
	try { new URL(raw.url); } catch { fail('url должен быть абсолютным URL'); }
	const mode = raw.mode ?? 'fast';
	if (!['fast', 'full'].includes(mode)) fail('mode: допустимы fast или full');
	const visibility = raw.visibility ?? (process.env.CI ? 'headless' : 'visible');
	if (!['visible', 'demo', 'headless'].includes(visibility)) fail('visibility: visible, demo или headless');

	const referenceWidths = uniqueWidths(raw.referenceWidths ?? []);
	const designSystemBreakpoints = uniqueWidths(raw.designSystemBreakpoints ?? DEFAULT_BREAKPOINTS);
	const componentBreakpoints = uniqueWidths(raw.componentBreakpoints ?? []);
	let widths;
	if (Array.isArray(raw.widths) && raw.widths.length) {
		widths = uniqueWidths(raw.widths);
	} else if (mode === 'fast') {
		widths = uniqueWidths([360, ...(referenceWidths.length ? referenceWidths : [768, 1024, 1440]), ...componentBreakpoints.flatMap(value => [value - 1, value])]);
	} else {
		widths = uniqueWidths([
			360,
			...referenceWidths,
			...designSystemBreakpoints.flatMap(value => [value - 1, value, value + 1]),
		]);
	}
	if (!widths.length) fail('Не удалось построить матрицу ширин');

	const browserProfiles = raw.browserProfiles ?? (mode === 'fast' ? ['chrome'] : ['chrome', 'webkit']);
	if (!Array.isArray(browserProfiles) || !browserProfiles.length) fail('browserProfiles должен быть непустым списком');
	const allowedProfiles = new Set(['chrome', 'webkit', 'yandex', 'safari']);
	for (const profile of browserProfiles) if (!allowedProfiles.has(profile)) fail(`Неизвестный browser profile: ${profile}`);

	const screenshotWidths = uniqueWidths([
		360,
		...referenceWidths,
		...componentBreakpoints.flatMap(value => [value - 1, value]),
		...(raw.screenshotWidths ?? []),
	]);
	const secondaryWidths = uniqueWidths([
		360,
		...referenceWidths,
		768,
		Math.max(...widths),
		...componentBreakpoints.flatMap(value => [value - 1, value, value + 1]),
	]);
	const configuredBrowserWidths = raw.browserWidths ?? {};
	const browserWidths = Object.fromEntries(browserProfiles.map(profile => {
		const configured = configuredBrowserWidths[profile];
		if (configured !== undefined && !Array.isArray(configured)) {
			fail(`browserWidths.${profile} должен быть списком`);
		}
		const defaults = profile === 'chrome' || raw.widths !== undefined ? widths : secondaryWidths;
		const selected = uniqueWidths(configured ?? defaults);
		if (!selected.length) fail(`browserWidths.${profile}: нужна хотя бы одна ширина`);
		return [profile, selected];
	}));
	const freshLoadWidths = uniqueWidths(raw.freshLoadWidths ?? [360, Math.max(...referenceWidths, ...widths)]);
	const outputDir = path.resolve(path.dirname(configPath), raw.outputDir ?? 'design-check-run');
	const viewportHeight = Number(raw.viewportHeight ?? 1000);
	const dpr = Number(raw.dpr ?? 1);
	if (!Number.isFinite(viewportHeight) || viewportHeight < 320) fail('viewportHeight должен быть числом не меньше 320');
	if (!Number.isFinite(dpr) || dpr <= 0) fail('dpr должен быть положительным числом');

	return {
		...raw,
		scope,
		selector: scope === 'page' ? 'body' : raw.selector,
		screenshotAll: raw.screenshotAll ?? true,
		mode,
		visibility,
		widths,
		referenceWidths,
		designSystemBreakpoints,
		componentBreakpoints,
		browserProfiles,
		browserWidths,
		screenshotWidths,
		freshLoadWidths,
		viewportHeight,
		dpr,
		locale: raw.locale ?? 'ru-RU',
		state: raw.state ?? 'default',
		outputDir,
		dismissControls: raw.dismissControls ?? DEFAULT_DISMISS_CONTROLS,
	};
}

function loadPlaywright(config) {
	const candidates = [
		config.playwrightModulePath,
		process.env.PLAYWRIGHT_MODULE_PATH,
		'playwright',
		'@playwright/test',
	].filter(Boolean);
	const errors = [];
	for (const candidate of candidates) {
		try { return require(candidate); } catch (error) { errors.push(`${candidate}: ${error.message}`); }
	}
	fail(`Playwright не найден. Передайте playwrightModulePath или PLAYWRIGHT_MODULE_PATH. Проверено: ${errors.join(' | ')}`);
}

async function chooseOutputDir(config) {
	const marker = path.join(config.outputDir, 'capture-results.json');
	if (!config.overwrite && fs.existsSync(marker)) {
		const stamp = new Date().toISOString().replace(/[:.]/g, '-');
		return path.join(config.outputDir, `run-${stamp}`);
	}
	return config.outputDir;
}

function progress(message) {
	process.stdout.write(`${message}\n`);
}

async function dismissWindows(page, controls, allowWait, preserveSelector) {
	const actions = [];
	for (const control of controls) {
		if (!control?.selector && !(control?.role && control?.name)) continue;
		const locator = control.selector ? page.locator(control.selector) : page.getByRole(control.role, { name: control.name, exact: control.exact ?? true });
		if (allowWait && control.waitMs) await locator.waitFor({ state: 'visible', timeout: Math.min(Number(control.waitMs), 10000) }).catch(() => {});
		if (await locator.count() !== 1 || !(await locator.isVisible())) continue;
		const safe = await locator.evaluate((element, preserve) => {
			if (element.tagName !== 'BUTTON' || element.closest('a') || element.getAttribute('formaction') || (element.type === 'submit' && element.form)) return false;
			const label = element.textContent + ' ' + (element.getAttribute('aria-label') || '');
			if (/соглаша|принять|разрешить|accept|agree|allow|subscribe|подпис|купить|buy/i.test(label)) return false;
			if (preserve && [...document.querySelectorAll(preserve)].some(target => target.contains(element) || element.contains(target))) return false;
			return true;
		}, preserveSelector || null);
		if (!safe) { actions.push('Не нажато: контрол закрытия не подтверждён как безопасная кнопка'); continue; }
		await locator.click({ timeout: 3000 });
		await locator.waitFor({ state: 'hidden', timeout: 3000 });
		actions.push('Закрыто постороннее окно: ' + (control.label || control.name || control.selector));
	}
	return actions;
}

async function inspectTarget(locator) {
	return locator.evaluate(element => {
		const rectOf = node => {
			const rect = node.getBoundingClientRect();
			return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
		};
		const style = getComputedStyle(element);
		const rect = element.getBoundingClientRect();
		const coverage = [];
		for (const xRatio of [0.1, 0.5, 0.9]) {
			for (const yRatio of [0.1, 0.5, 0.9]) {
				const left = Math.max(0, rect.left), right = Math.min(innerWidth, rect.right);
				const topEdge = Math.max(0, rect.top), bottom = Math.min(innerHeight, rect.bottom);
				if (right <= left || bottom <= topEdge) continue;
				const x = left + (right - left) * xRatio;
				const y = topEdge + (bottom - topEdge) * yRatio;
				const top = document.elementFromPoint(x, y);
				coverage.push({
					xRatio,
					yRatio,
					blocked: Boolean(top && !element.contains(top)),
					top: top ? { tag: top.tagName, className: String(top.className).slice(0, 180), text: String(top.innerText || '').slice(0, 180) } : null,
				});
			}
		}
		return {
			rect: rectOf(element),
			styles: {
				display: style.display,
				flexDirection: style.flexDirection,
				alignItems: style.alignItems,
				padding: style.padding,
				gap: style.gap,
				margin: style.margin,
				borderRadius: style.borderRadius,
				overflow: style.overflow,
				fontSize: style.fontSize,
				lineHeight: style.lineHeight,
			},
			text: element.innerText,
			clientWidth: element.clientWidth,
			scrollWidth: element.scrollWidth,
			coverageHitTest: coverage,
			page: {
				viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
				documentScrollWidth: document.documentElement.scrollWidth,
				documentClientWidth: document.documentElement.clientWidth,
				userAgent: navigator.userAgent,
			},
		};
	});
}

async function captureProfile(playwright, profileName, config, outputDir) {
	let browserType;
	let launchOptions = { headless: config.visibility === 'headless', slowMo: config.visibility === 'demo' ? 120 : 0 };
	let label;
	let engine;
	if (profileName === 'chrome') {
		browserType = playwright.chromium;
		launchOptions.channel = 'chrome';
		label = 'Google Chrome';
		engine = 'Blink';
	} else if (profileName === 'webkit') {
		browserType = playwright.webkit;
		label = 'WebKit';
		engine = 'WebKit';
	} else if (profileName === 'yandex') {
		browserType = playwright.chromium;
		label = 'Yandex Browser';
		engine = 'Blink';
		if (!config.yandexExecutablePath) return { browser: label, engine, status: 'skipped', error: 'Не задан yandexExecutablePath', checks: [] };
		launchOptions.executablePath = config.yandexExecutablePath;
	} else {
		return { browser: 'Safari', engine: 'WebKit', status: 'skipped', error: 'Настоящий Safari запускается отдельным WebDriver-инструментом, не этим Playwright-скриптом', checks: [] };
	}

	progress(`→ ${label}: запуск`);
	let browser;
	try { browser = await browserType.launch(launchOptions); }
	catch (error) {
		progress(`↷ ${label}: пропущен`);
		return { browser: label, engine, status: 'skipped', error: String(error), checks: [] };
	}
	const browserVersion = browser.version();
	const profileWidths = config.browserWidths[profileName];
	const context = await browser.newContext({
		viewport: { width: profileWidths[0], height: config.viewportHeight },
		deviceScaleFactor: config.dpr,
		locale: config.locale,
		reducedMotion: 'reduce',
	});
	const page = await context.newPage();
	const checks = [];
	const uiActions = [];
	let loaded = false;
	try {
		for (const width of profileWidths) {
			const check = { width, state: config.state };
			try {
				await page.setViewportSize({ width, height: config.viewportHeight });
				const needsNavigation = !loaded || (config.freshLoadWidths.includes(width) && width !== profileWidths[0]);
				if (needsNavigation) {
					await page.goto(config.url, { waitUntil: 'domcontentloaded', timeout: Number(config.navigationTimeoutMs ?? 30000) });
					loaded = true;
				}
				const actions = await dismissWindows(page, config.dismissControls, needsNavigation, config.scope === 'feature' ? config.selector : null);
				uiActions.push(...actions);
				if (config.readySelector) await page.locator(config.readySelector).waitFor({state: 'visible', timeout: Number(config.targetTimeoutMs ?? 30000)});
				const target = page.locator(config.selector);
				if (await target.count() > 1) { check.availability = 'ambiguous'; throw new Error('ambiguous: selector находит несколько элементов'); }
				const control = config.openControl;
				if (control && (!control.widths || control.widths.includes(width)) && !(await target.isVisible().catch(() => false))) {
					const opener = control.selector ? page.locator(control.selector) : page.getByRole(control.role, {name: control.name, exact: true});
					await opener.click({timeout: Number(config.targetTimeoutMs ?? 30000)});
					uiActions.push('Открыта фича штатным элементом управления');
				}
				try { await target.waitFor({state: 'visible', timeout: Number(config.targetTimeoutMs ?? 30000)}); }
				catch (error) {
					const count = await target.count();
					check.availability = count === 0 ? 'missing' : count > 1 ? 'ambiguous' : 'hidden';
					throw new Error(check.availability + ': ' + error.message);
				}
				check.availability = 'visible';
				await page.evaluate(() => document.fonts.ready);
				if (config.scope === 'feature') await target.scrollIntoViewIfNeeded();
				uiActions.push(...await dismissWindows(page, config.dismissControls, false, config.scope === 'feature' ? config.selector : null));
				let geometry = await inspectTarget(target);
				if (geometry.coverageHitTest.some(point => point.blocked)) {
					uiActions.push(...await dismissWindows(page, config.dismissControls, false, config.scope === 'feature' ? config.selector : null));
					geometry = await inspectTarget(target);
				}
				const blocked = geometry.coverageHitTest.some(point => point.blocked);
				const overflow = geometry.scrollWidth > geometry.clientWidth || geometry.page.documentScrollWidth > geometry.page.documentClientWidth;
				const shouldScreenshot = config.screenshotAll || config.screenshotWidths.includes(width) || blocked || overflow;
				if (shouldScreenshot) {
					const filename = `${profileName}-${width}.png`;
					if (config.scope === 'page') await page.screenshot({path: path.join(outputDir, 'actual', filename), fullPage: true, animations: 'disabled'});
					else await target.screenshot({ path: path.join(outputDir, 'actual', filename), animations: 'disabled' });
					check.filename = filename;
				}
				if (config.contextScreenshots && (shouldScreenshot || blocked)) {
					const contextFilename = `${profileName}-${width}-context.png`;
					await page.screenshot({ path: path.join(outputDir, 'actual', contextFilename), fullPage: false, animations: 'disabled' });
					check.contextFilename = contextFilename;
				}
				check.status = blocked ? 'blocked' : 'captured';
				check.geometry = geometry;
				check.overflow = overflow;
				progress(`${blocked ? '!' : '✓'} ${label}: ${width} px${shouldScreenshot ? ' · screenshot' : ' · measurements'}`);
			} catch (error) {
				check.status = 'blocked';
				check.availability ??= 'unknown';
				check.error = String(error);
				progress(`! ${label}: ${width} px · blocked`);
			}
			checks.push(check);
			if (checks.length === 1 && check.status === 'blocked') break;
		}
	} finally {
		await context.close();
		await browser.close();
	}
	return { browser: label, engine, version: browserVersion, status: checks.some(check => check.status === 'blocked') ? 'blocked' : 'captured', uiActions: [...new Set(uiActions)], checks };
}

async function main() {
	const args = process.argv.slice(2);
	const planOnly = args.includes('--plan');
	const configArg = args.find(value => value !== '--plan');
	if (!configArg) fail('Использование: node capture_playwright.cjs [--plan] <config.json>');
	const configPath = path.resolve(configArg);
	const raw = JSON.parse(await fsp.readFile(configPath, 'utf8'));
	const config = normalizeConfig(raw, configPath);
	const plan = {
		scope: config.scope,
		mode: config.mode,
		visibility: config.visibility,
		widths: config.widths,
		browserProfiles: config.browserProfiles,
		browserWidths: config.browserWidths,
		screenshotWidths: config.screenshotWidths,
		freshLoadWidths: config.freshLoadWidths,
		outputDir: config.outputDir,
	};
	if (planOnly) {
		process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
		return;
	}

	const outputDir = await chooseOutputDir(config);
	await fsp.mkdir(path.join(outputDir, 'actual'), { recursive: true });
	progress(`Режим: ${config.mode}; окно: ${config.visibility}; ширины: ${config.widths.join(', ')}`);
	const playwright = loadPlaywright(config);
	const results = [];
	for (const profile of config.browserProfiles) results.push(await captureProfile(playwright, profile, config, outputDir));
	const payload = { url: config.url, selector: config.selector, capturedAt: new Date().toISOString(), plan, results };
	await fsp.writeFile(path.join(outputDir, 'capture-results.json'), JSON.stringify(payload, null, 2));
	progress(`Готово: ${path.join(outputDir, 'capture-results.json')}`);
}

module.exports = { dismissWindows };
if (require.main === module) main().catch(error => { console.error(`Не удалось выполнить capture: ${error.message}`); process.exitCode = 1; });
