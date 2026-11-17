# Contributing

The skill entry point, `SKILL.md`, is in the repository root. The scripts and tests are in `scripts/`.

The report generator and capture planning tests require Node.js 18 or later.

```sh
node --test scripts/test_report.cjs scripts/test_capture_plan.cjs
```

The browser integration tests require Playwright and Google Chrome. If Playwright is installed outside this repository, set `PLAYWRIGHT_MODULE_PATH` to the path of the installed package.

```sh
PLAYWRIGHT_MODULE_PATH=/path/to/node_modules/playwright node --test scripts/test_capture_browser.cjs scripts/test_report_browser.cjs
```
