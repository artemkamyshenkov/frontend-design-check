# Frontend Design Check

**Give your coding agent a URL. Get a responsive review with a shareable HTML report.**

Frontend Design Check is an agent skill for reviewing a page or a specific UI feature across screen sizes. Give it a Figma design or local screenshots to compare against, or use it to spot responsive issues without a design.

## Try it

After installation, ask your agent:

```text
Use frontend-design-check to review http://localhost:3000 at 360, 768,
1024, and 1440 px. Check for layout problems and create an HTML report.
```

For a design comparison, include a Figma link or paths to screenshots:

```text
Use frontend-design-check to compare the pricing card on
http://localhost:3000 with <Figma link>. Check desktop and mobile,
and create an HTML report with screenshots and findings.
```

Describe how to open the feature if it needs a click or a particular state. A selector can help, but isn't required when the agent can identify the element.

## What you get

- A review of the whole page or a focused feature, such as a modal or card.
- Checks at your chosen widths and relevant layout breakpoints.
- Optional comparison with Figma or PNG/JPEG references.
- A standalone HTML report with screenshots, findings, and review limitations. When a reference is available, the report supports side-by-side comparison and an overlay where the image scale is known.
- Reusable Figma references for follow-up checks after fixes.

Reports are in English by default; request Russian if preferred. The skill reviews the interface; it does not change application code. Without a reference, it reports responsive issues rather than claiming a match to a design.

## Install

Use [GitHub CLI with Agent Skills support](https://cli.github.com/manual/gh_skill_install) and run the command for your agent:

| Agent | Command |
| --- | --- |
| Codex | `gh skill install artemkamyshenkov/frontend-design-check frontend-design-check --agent codex --scope user` |
| Claude Code | `gh skill install artemkamyshenkov/frontend-design-check frontend-design-check --agent claude-code --scope user` |
| Cursor | `gh skill install artemkamyshenkov/frontend-design-check frontend-design-check --agent cursor --scope user` |
| GitHub Copilot in VS Code | `gh skill install artemkamyshenkov/frontend-design-check frontend-design-check --agent github-copilot --scope user` |
| Gemini CLI | `gh skill install artemkamyshenkov/frontend-design-check frontend-design-check --agent gemini-cli --scope user` |

For a single project, run the command from that project's repository and use `--scope project`. Start a new agent session and ask it to use `frontend-design-check`.

For manual installation, copy the skill folder into your agent's skills directory. Keep `SKILL.md`, `references/`, and `scripts/` together.

## Requirements

- An accessible page and any sign-in or test data needed to reach the requested state.
- Node.js 18+ for the HTML report.
- A browser tool that supports viewport changes, page inspection, and screenshots, or Playwright with Google Chrome. Extra browser checks require the corresponding browser tools and runtimes.
- For a live Figma comparison, access to the file through a supported Figma connection. Local images and saved references do not require Figma access.

## Browser setup

If your agent already has a browser tool that can resize the viewport, inspect the page, and take screenshots, use it for the review.

For the bundled capture script, install Node.js 20+ and [Google Chrome](https://www.google.com/chrome/), then install Playwright once in a separate user directory.

**macOS and Linux**

```sh
npm install --prefix "$HOME/.local/share/frontend-design-check" --save-exact playwright@1.62.1
```

**Windows (PowerShell)**

```powershell
npm install --prefix "$env:LOCALAPPDATA\frontend-design-check" --save-exact playwright@1.62.1
```

Ask your agent to verify that Playwright can launch Chrome before starting the review. If you used a custom install directory, give it the absolute path to `node_modules/playwright`. You can also connect [Playwright MCP](https://github.com/microsoft/playwright-mcp) as your agent's browser tool. See the [browser setup guide](references/browser-setup.md) for details.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development checks.
