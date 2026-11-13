# General browser run

## Preflight before the main run

First check all prerequisites for the current request: Node.js 18+, an available browser and required capabilities, URL and correct page, feature presence and opening, and reference access for comparisons. Continue checking independent prerequisites that remain available; mark dependent checks “not checked” (e.g. the feature when the page is unavailable). Do not check unrelated systems.

Show a short available / unavailable / not checked list with observed causes. VPN, a desktop client and HTTP 200 do not prove access: inspect page content, login redirects and authorization for the specific tool. Distinguish timeout, DNS, connection refusal, 401/403, missing element and ambiguous selector. Do not attribute a failure to VPN without evidence. For external documents use the relevant available integration under environment rules.

If all prerequisites are available, proceed without confirmation. If a mandatory prerequisite is unavailable, stop before the matrix, offer concrete options and await the user's decision. Do not automatically install dependencies or reduce the agreed scope. This rule overrides the fallback scenarios below. If a blocker arises during the run, save results obtained and stop the dependent part; agree on continuation with reduced coverage.

For Figma, a working connection may be found in the order Desktop MCP → plugin without changing the reference. If neither connection can read the design, report the blocker and offer to restore access, use cache with its date, provide screenshots or run without a reference. Await the choice. Do not independently substitute cache for inaccessible Figma or run without the design. An already requested repeat using saved data requires no live access; note that separately.

## 1. Check tools

- An available browser tool with viewport, DOM and screenshots or Playwright is required. Follow the browser tool's instructions. If capabilities are missing, choose Playwright and explain why.
- Find existing Playwright in the project or agent runtime. Do not hard-code the author's paths, browser profile or debugging port. If no tool exists, explain that a browser connector or Node.js + Playwright + installed browser is needed. Read [browser-setup.md](browser-setup.md) for step-by-step setup. Install dependencies only after the user's choice and within environment permissions; do not change application dependencies for the review.
- A finished report needs Node.js 18+ (standard library only, no npm dependencies). Python is not required. If Node.js is unavailable, report the HTML-report blocker and await the user's decision.
- If the user supplied images or a suitable saved package, Figma is unnecessary. For a Figma link only, first check the file cache. If data is missing, use local Figma Desktop MCP → available Figma plugin in the agent client → ask for screenshots of the required states. Order, errors and cache are described in [references.md](references.md). Installing the skill does not itself connect accounts.
- Use Confluence/Bitbucket only for requirements or change scope when needed for the request; they are not mandatory.

Perform preflight once before acquiring all assets and running the matrix:

1. Check URL access and target presence at one control width.
2. Check Playwright and only the chosen browser profiles. Do not repeatedly launch a missing runtime: immediately mark `skipped`.
3. Check Node.js for the report; check references only for a design comparison. If Figma is needed, the first useful request both checks access and fills the cache; do not make a separate request solely for preflight.
4. Show a brief result: `✓ URL`, `✓ target`, `✓ reference: cache from <date>, freshness not checked`, `✓ Chrome`. Without a reference state “responsive review without design”. For other sources specify `Figma Desktop MCP`, `Figma plugin` or `user screenshots`; for an unavailable source give the reason. Do not mark live Figma access as checked when using cache.

Do not start an expensive full run if the control target did not appear. For a local URL use the permission already provided by the user; do not request it again for the same task.

Only for comparison with a design read source and local cache details: [references.md](references.md). Chrome, WebKit, Safari and Yandex Browser profiles are described in [browsers.md](browsers.md).

## 2. Choose mode and matrix

If the repository is available, read its instructions and relevant code. Without code access continue using designs and observed UI, noting unknown breakpoints as a limitation. If code is available, obtain breakpoints from the current design system/theme. Follow theme and stylesheet imports to actual values, not examples in comments. For white label inspect the applied theme and overrides.

Find both global breakpoints and those actually used by the target component. Choose a reasonable viewport height (e.g. 1000 CSS px) and record it in the report.

### Fast — default mode

- Google Chrome.
- Visible window for local development. If the environment does not support a GUI, explain and use headless.
- Reference widths, 360 px by default, and b−1/b pairs only for breakpoints changing the target feature's composition.
- If component breakpoints cannot be determined, use reference widths; without those use 360/768/1024/1440 as assumed control widths.
- Capture reference widths and boundaries where composition changes. For an issue add a screenshot and adjacent width.

Example for references 360/767/1200 and component breakpoint 768: `360, 767, 768, 1200`.

### Full — only on explicit request

- Google Chrome at 360, reference widths and b−1/b/b+1 for all discovered breakpoints b ≥ 360.
- WebKit at control widths. Safari and Yandex Browser if requested and profiles are available.
- Additional states, context screenshots and fresh loads when needed by the scenario.

If tokens are unavailable, use fallback 360/768/1024/1440 for full and identify it as an assumption. User-specified widths and browsers take priority.

When designs exist, separately determine expected composition from them. A design-system breakpoint is a check point, not proof that a particular component must change layout there.

Explicitly specified widths take precedence over the default matrix, including 360 px. Pass them via `widths`. The batch script honors the explicit matrix, including widths under 360 px.

Briefly tell the user the mode, scenario, browsers and widths; do not introduce additional agreement for an already requested design check. Do not call Playwright WebKit Safari. Profile rules: [browsers.md](browsers.md).

## 3. Prepare and capture UI

For repeatable Playwright runs use [scripts/capture_playwright.cjs](../scripts/capture_playwright.cjs). First create a small JSON config following [capture-config.md](capture-config.md), check the plan without a browser, then run:

```sh
node <skill-dir>/scripts/capture_playwright.cjs --plan <run-dir>/capture-config.json
node <skill-dir>/scripts/capture_playwright.cjs <run-dir>/capture-config.json
```

The script reuses one browser context, prints progress by width, and collects geometry and a nine-point hit-test. Playwright must be supplied by the project or runtime; do not add it to application dependencies for the review.

Procedure:

1. Open the exact URL and obtain one control target screenshot. An absent block is “not checked”, not success.
2. Before the matrix and each capture, inspect unrelated ad modals, full-screen banners, onboarding and hints. Close them using the normal cross or confirmed close button unless the user requested the popup itself. First inspect the control DOM: advertising links, target=_blank, submit, cookie consent and subscriptions are not closing actions. Do not click them to clear a screenshot. For cookie banners use only an independent close control that does not change consent; if none exists, report the blocker and options. Do not close the feature under review. Record actions, wait for the popup to disappear and repeat capture/measurements. Do not remove elements from the DOM or hide them with CSS. Recheck after resize, scroll and opening the feature: a banner may appear late. For unknown popups first identify a specific safe control with a browser tool; do not click every close button on the page.
3. Repeat the screenshot and check nine points inside the target with hit-testing. If interference remains, try normal dismissal again. Only then use `blocked` or a finding about actual overlap.
4. Wait for target state, `document.fonts.ready`, images and stable geometry. Record disabling animation during capture in the conditions.
5. Record browser, version, engine, OS, viewport, DPR, scale, language, state and time. Do not save cookies, tokens or full network responses.
6. Collect rect, padding, gap, dimensions, flex/grid composition, typography, parent container and overflow.
7. Use resize within one session. Fresh-load at 360 and the primary desktop width only if server/JS-dependent responsiveness is a risk.
8. Open only states in the requested review. Do not perform actions with external effects without the corresponding request.

Show brief live progress, e.g. `✓ Chrome 360 · screenshot`, `✓ Chrome 992 · measurements`, `↷ WebKit · skipped`. In visible mode do not add `slowMo`; use `demo` only on request because it increases time.

Keep run screenshots and temporary scripts in a separate artifacts directory, outside application sources by default. Only when using references, keep the shared file cache separate from individual runs per the [cache rules](figma-cache.md). Check artifacts for personal data before including them in a portable report.

## Browser session cleanup

Before first opening a page, record existing tabs and connection method. When possible create a separate session for the review; track created tabs, including HTML report viewing. A blank tab alone does not prove the browser belongs to this review.

After saving screenshots and measurements and checking the HTML, release browser resources belonging to the review before the final answer. This applies to browser MCPs and direct Playwright. For your own Playwright instance call browser.close() in finally; the batch script already does so.

For Playwright MCP use browser_close if the entire session was created for this review and has no other user's tabs. When connected to an existing browser or ownership is unclear, use browser_tabs: close only tabs created by the review, checking the current list before closing because indices change. Do not close original tabs or the user's entire browser. If the tool cannot safely distinguish your resources, leave them and report it.

Leave the session open when explicitly requested or when the review is paused for login, manual action or continuation of the same scenario. State why. After continuation and completion, close normally. On error save available artifacts and release your resources if user action is not awaited. If closure fails, report it; do not terminate browser processes using system commands.

Treat a successful browser_close response as confirmation of closure. Do not call snapshot, navigate or tabs afterwards solely to verify: those commands can launch a new session. Report exceptions left open in the result.
