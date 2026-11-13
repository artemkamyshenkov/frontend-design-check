# Playwright capture configuration

The [capture_playwright.cjs](../scripts/capture_playwright.cjs) script accepts one JSON file. First check the calculated plan without launching a browser:

```sh
node <skill-dir>/scripts/capture_playwright.cjs --plan <run-dir>/capture-config.json
node <skill-dir>/scripts/capture_playwright.cjs <run-dir>/capture-config.json
```

Minimal practical example:

```json
{
  "url": "http://localhost:4000/example",
  "selector": "[data-ti=feature]",
  "mode": "fast",
  "visibility": "visible",
  "referenceWidths": [360, 767, 1200],
  "componentBreakpoints": [768],
  "designSystemBreakpoints": [576, 768, 992, 1200, 1400],
  "viewportHeight": 1000,
  "dpr": 1,
  "state": "results-loaded",
  "outputDir": "./run",
  "freshLoadWidths": [360, 1200],
  "dismissControls": [
    {"selector": "[data-ti=bdui-modal] button[data-ti=close-button]", "label": "Ad close button", "waitMs": 4000}
  ]
}
```

## Fields

- `url` is the required absolute URL. `scope` is `feature` by default (requires `selector`) or `page` (whole page, no selector required).
- `readySelector` is an optional indicator that the required content has loaded.
- `openControl` is the normal opening button: `{ "role": "button", "name": "Фильтры", "widths": [360, 768] }` or `{ "selector": "[data-ti=open-filters]" }`. Set `name` to the button’s exact accessible name in the page’s language. Without widths it applies at every width, only when the target is still hidden.
- `mode` is `fast` by default or `full`.
- `visibility` is `visible` by default locally, `demo` with `slowMo=120`, or `headless` in CI.
- `referenceWidths` lists the widths of provided designs.
- `componentBreakpoints` contains only transitions that actually change the target component.
- `designSystemBreakpoints` contains global points for `full`; fallback: 576/768/992/1200/1400. For unknown breakpoints explicitly pass widths: [360,768,1024,1440] so fallback points are not presented as project breakpoints.
- `widths` is an explicit matrix instead of automatic calculation, followed exactly, including widths under 360 px.
- `browserProfiles` accepts `chrome`, `webkit`, `yandex`, `safari`. By default `fast` uses Chrome and `full` uses Chrome and WebKit.
- `browserWidths` is an optional per-profile matrix, for example `{"webkit":[360,768,1200]}`. Without it Chrome uses the primary matrix and secondary browsers use control widths.
- `screenshotWidths`, `screenshotAll` select additional captures or captures at every point (`screenshotAll` defaults to true).
- `contextScreenshots` captures the viewport alongside the target screenshot at problem points.
- `freshLoadWidths` specifies points requiring a fresh `goto`; other widths use resize in one context.
- `dismissControls` contains exact selectors or role/name for buttons on known unrelated popups. The default is only the bdui-modal close button. The script requires a single visible normal button, excludes links, form submits and consent buttons, and waits for the control to disappear. For feature reviews it does not click buttons inside the target. The agent verifies unknown controls before acting. Pass [] when reviewing the ad modal itself. Do not add generic `Accept`, `OK`, submit buttons or selectors capable of changing the feature under review.
- `playwrightModulePath` is an optional exact path to an already available module. The script also checks `PLAYWRIGHT_MODULE_PATH`, `playwright` and `@playwright/test`. Do not add a dependency to the application for a design check.
- `yandexExecutablePath` is the path to a local Yandex Browser for an explicitly requested profile.

If `capture-results.json` already exists, a new timestamped directory is created. `overwrite: true` permits overwriting. This script does not launch actual Safari and marks it `skipped`; use a separate browser tool.

In `capture-results.json`, an entry with `filename` contains a target screenshot. A successful entry without `filename` was checked geometrically and is recorded as `measured` in the report. `blocked` and `skipped` always retain their reason. The script does not decide whether the design matches Figma: the agent makes findings and creates `report.json`.

Without references, fast uses 360/768/1024/1440 and known component boundaries. For a page, capture fullPage. `availability` is visible, missing, hidden, ambiguous, or unknown on another error. If the first control width is blocked, the script stops that profile; remaining planned widths are unchecked. Capture JSON contains measurements, not a verdict: the agent reviews screenshots and creates report.json following report-format.md.
