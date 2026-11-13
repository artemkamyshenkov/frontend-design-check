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

For Codex, clone this repository into your user skills directory:

```sh
git clone https://github.com/artemkamyshenkov/frontend-design-check.git \
  ~/.agents/skills/frontend-design-check
```

Start a new Codex session, then invoke `$frontend-design-check` or ask for it by name. For another agent, follow its instructions for installing skills and make sure the whole repository is available to the agent.

## Requirements

- An accessible page and any sign-in or test data needed to reach the requested state.
- Node.js 18+ for the HTML report.
- A browser tool that supports viewport changes, page inspection, and screenshots, or Playwright with Google Chrome. Extra browser checks require the corresponding browser tools and runtimes.
- For a live Figma comparison, access to the file through a supported Figma connection. Local images and saved references do not require Figma access.

The agent checks prerequisites before starting and explains what is missing. You can ask it to help set up a browser; see [browser setup](references/browser-setup.md) for the available options.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development checks.
