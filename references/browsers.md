# Cross-browser review

## Run modes

- `fast` is the default: Google Chrome, a compact matrix for the target feature, and a visible local window.
- `full` is only for explicit requests: the full Chrome matrix and WebKit control points. Add Safari and Yandex Browser when requested and available.
- `visible` uses an ordinary visible window without artificial delays so the developer can observe the run.
- `demo` uses a visible window with a short delay between Playwright actions. Use only on request because it takes longer.
- `headless` is for CI or environments without a GUI.

A browser connector that can change viewport, read DOM and capture elements in one session can replace the batch script. Preserve the same matrix, progress and reporting rules.

## Browser profiles

- **Google Chrome** is the primary browser. In Playwright use installed Chrome via the `chrome` channel; do not silently substitute bundled Chromium.
- **WebKit** is Playwright's engine, close to Safari. Always call this profile `WebKit`; it is not branded Safari.
- **Safari** is actual Safari on macOS via Safari WebDriver or an available browser tool. Run only on explicit request. First use may require the user to enable **Develop → Allow Remote Automation** or `safaridriver --enable`; do not change system settings without permission.
- **Yandex Browser** is a local Chromium-compatible binary used through a browser tool or `executablePath`. This profile is best-effort: Playwright has no official Yandex channel. Do not hard-code a user's path.

A user-specified browser list takes priority. If a required profile is unavailable, record the preflight reason and await the user's decision to proceed with reduced coverage. After agreement mark the excluded profile `skipped`. Do not silently install browsers or enable system automation.

## Matrix

Explicit user widths override the following matrices, including 360 px. The batch script honors explicit widths without adding 360 px.

In `fast`, run Chrome at 360 px, reference widths and b−1/b pairs only for breakpoints changing the target feature's composition. Capture reference and transition widths; other points may be measured.

In `full`:

1. Chrome: 360 px, reference widths and b−1/b/b+1 for all discovered breakpoints.
2. WebKit: 360 px, primary mobile/tablet/desktop widths and relevant transitions.
3. Safari and Yandex Browser: the same control widths if explicitly requested and available.

For a browser issue, add adjacent widths. Use the same URL, data, state, language, time zone, DPR and scale across profiles. Record browser name and version, engine and OS when reported by the tool.

## Comparison

- With a reference, compare each browser with its matching Figma/PNG reference. Without one, review responsiveness.
- Compare secondary browsers with Chrome at matching width, state and data.
- Label the finding as `comparison with reference` or `difference between browsers`.
- Rasterization and antialiasing noise is not a defect unless it changes wrapping, dimensions, overflow, alignment or readability.
- Dynamic values must match across browsers; otherwise mark the comparison as noisy.

`skipped` means a profile did not run because the browser, runtime or permission was unavailable. `blocked` means the browser started but the target state could not be obtained.

## Environment setup

- Install the WebKit runtime with the normal Playwright command when needed. If downloading is required, request permission first.
- Chrome and Yandex Browser must be installed in the OS or available through a connector.
- Safari is macOS-only and requires enabled WebDriver automation.

Official sources: [Playwright Browsers](https://playwright.dev/docs/browsers), [Playwright BrowserType](https://playwright.dev/docs/api/class-browsertype), [Apple: Enabling WebDriver](https://developer.apple.com/documentation/safari-developer-tools/macos-enabling-webdriver).
