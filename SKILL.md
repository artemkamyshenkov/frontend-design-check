---
name: frontend-design-check
description: Reviews responsive behavior of a page or individual web feature across breakpoints, compares it with Figma/PNG when available, and creates an HTML report. For visual review, not implementation or code fixes.
---

# Frontend Design Check

Determine scope and reference source independently. Use the request details; do not require Figma for a review without a design or load all instructions up front.

| Request | Read |
| --- | --- |
| Whole page | [page-check.md](references/page-check.md) |
| Feature, block, selector or attribute | [feature-check.md](references/feature-check.md) |
| Figma, PNG or saved references provided | Also [references.md](references/references.md) and [comparison.md](references/comparison.md) |
| Any browser review | [workflow.md](references/workflow.md) and [responsive-check.md](references/responsive-check.md) |
| Preparing the result | [report.md](references/report.md), then the [report format](references/report-format.md) |

A URL and review scope are required. A selector is optional if the block can be identified unambiguously by name and DOM. A URL suffices for a page. If no scope is specified, review the page. If a feature is specified, do not expand the review to the whole page without a request. Ask only for information needed to obtain the required state.

Defaults are fast mode, visible Chrome (headless when no GUI is available), and one scenario. User-specified widths take precedence. Without designs and known breakpoints, use 360/768/1024/1440 and label them as assumptions. With Figma, compare the same regions; a link to a parent frame is sufficient and links to every child layer are not required.

Before the main run, perform the preflight in [workflow.md](references/workflow.md). Show availability of every prerequisite. If a mandatory prerequisite is unavailable, offer options and wait for the user's decision; do not automatically change the reference source or scope. If everything is ready, proceed without confirmation.

Scripts are optional when a browser tool provides viewport, DOM and screenshots. If no browser environment is available, offer the options in [browser-setup.md](references/browser-setup.md) and guide the user through their choice. For batch capture read [capture-config.md](references/capture-config.md). For full mode or additional browsers read [browsers.md](references/browsers.md). Do not read Figma instructions or cache guidance for reviews without a reference.

Save screenshots, measurements, reasons for skips, and standalone HTML in a separate artifact directory. Without a design, call the result a responsive review and do not claim design conformity. Support findings with measurements and visual inspection. Do not fix application code, publish results, or change the baseline as part of the review.

After saving and checking the report, close browser resources created for the review as described in the browser session cleanup section of [workflow.md](references/workflow.md). Preserve the user's original tabs; leave the session open when explicitly requested or while awaiting user action.
