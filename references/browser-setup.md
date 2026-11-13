# Browser setup on first run

Read this file only if preflight did not find a suitable browser tool or Playwright. Show the options and wait for the user's choice. Installing the skill itself does not run npm or install an MCP.

## Options

1. An available browser tool with DOM, viewport and screenshots: check its capabilities and use its normal instructions. Installing a package for the batch script is unnecessary.
2. A local Playwright package and Google Chrome: suitable for the bundled batch script. Install once in a separate user directory, not the project or skill folder.
3. Playwright MCP: connects to the agent client and provides browser tools. This is an alternative workflow, not a package that our script can require(). Setup depends on the client.

## Local package: steps for agent and user

1. Check `node --version`, `npm --version` and Google Chrome availability. Node.js 18+ is enough for the report generator; tested Playwright 1.62.1 requires Node.js 20+. If Node is unsuitable, first offer to update it using the user's normal method; do not update Node automatically.
2. Explain the path and scope of the change: npm downloads Playwright and dependencies into a separate directory for the current user. Use the existing configured registry; do not change the global registry, disable TLS or request tokens in chat.
3. After consent, install the package. macOS/Linux example (the path can be changed):

```sh
npm install --prefix "$HOME/.local/share/frontend-design-check" --save-exact playwright@1.62.1
```

For Windows PowerShell:

```powershell
npm install --prefix "$env:LOCALAPPDATA\frontend-design-check" --save-exact playwright@1.62.1
```

This is the pinned version used to test the skill. Do not silently upgrade it. If the registry lacks the version or download is blocked, report the error and wait for a decision. Do not install globally or add the package to the application.

4. Record the absolute path to `node_modules/playwright` in `playwrightModulePath` in the run config. Alternatively set `PLAYWRIGHT_MODULE_PATH` for the launch command only. Do not put a personal path in the distributed skill. On later runs check the service directory and reuse the installed package.
5. Verify the installed package: launch Chrome through Playwright, open a blank page, set a viewport, read the DOM and save a control screenshot in a temporary directory. Close the browser. Do not report a permissions error as a missing Playwright installation.
6. Separately check the user's URL. A new Chrome profile may not contain the login session. Ask the user to sign in normally if necessary; do not copy cookies or a profile without permission. A VPN on the machine does not guarantee that a remote browser tool can reach the test environment or localhost.

Google Chrome for the chrome profile must be installed separately. If absent, offer its normal installation. Do not replace it with Chromium without agreement. WebKit is required only for the corresponding profile and is prepared separately according to official Playwright instructions after the user chooses it.

## Playwright MCP

1. Use an existing connection if available and it supports the required operations.
2. For a new installation read the current official instructions at https://github.com/microsoft/playwright-mcp and the specific client's instructions. Ask which client only if unknown. Check Node.js and OS requirements for the chosen version.
3. Show the user the configuration and launch method, then connect through the client's normal mechanism after consent. Say if the client requires a restart.
4. After connecting, verify tool availability, browser launch, viewport changes, DOM and screenshots, then the user's URL. Do not report a connection working solely because a configuration entry exists.

Do not mix a local package, MCP and built-in browser in a single run without a reason. Record the actual tool and browser used in the report.
