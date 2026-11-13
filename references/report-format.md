# Report format

The agent assembles the JSON; the user does not need to fill in the schema.

Minimal example (paths are relative to the JSON directory):

```json
{
  "title": "Filters design check",
  "target": "[data-ti=filters]",
  "environment": "macOS, DPR 1, viewport height 1000, ru-RU, 2026-01-01",
  "provenance": "Test URL; Figma node links; capture date; opening actions; animations disabled",
  "limitations": ["Live prices differ; their values were not checked"],
  "findings": [
    {
      "title": "Internal padding",
      "severity": "major",
      "browser": "Google Chrome",
      "viewport": 360,
      "state": "opened",
      "expected": "16 CSS px",
      "actual": "24 CSS px",
      "evidence": "DOM computed padding-left; screenshot in the 360 px section",
      "source": "Figma: node link and paddingLeft property",
      "impact": "Less space for text",
      "confidence": "High: both values measured"
    }
  ],
  "checks": [
    {
      "browser": "Google Chrome",
      "browserVersion": "version reported by the browser tool",
      "engine": "Blink",
      "viewport": 360,
      "state": "opened",
      "status": "review",
      "notes": "Spacing differences found",
      "actual": {"path": "actual-360.png", "cssWidth": 328},
      "reference": {"path": "reference-360.png", "cssWidth": 328}
    }
  ]
}
```

`cssWidth` is the natural width of the depicted region in CSS px, not the viewport or necessarily the PNG width. For example, a 656 px @2x PNG of a 328 px card gets `cssWidth: 328`. Preserve proportions: the generator uses the original aspect ratio. Record the original scale in provenance. If unknown, pass `cssWidth: null`: the generator shows both images side by side with a warning and disables overlay. Clarify export details for precise comparison; do not guess width.

Each `checks` entry requires `browser`. Use specific names: `Google Chrome`, `WebKit`, `Safari`, `Yandex Browser`. Do not call Playwright WebKit Safari. `browserVersion` and `engine` are optional but should be filled when the tool reports them. For a cross-browser finding, also specify `browser` in `findings` and state in evidence whether behavior was compared with the reference or the primary Chrome screenshot.

Statuses:
- `matched`: compared with reference, no significant differences found; both images required.
- `review`: differences found or result requires review; actual required.
- `no-reference`: actual obtained but no suitable reference.
- `measured`: target successfully checked via DOM measurements and hit-test without a screenshot; actual unnecessary, key measurements go in notes.
- `blocked`: target state could not be obtained; explain in notes, screenshot optional.
- `skipped`: browser or runtime unavailable, or permission to run missing; explain in notes, screenshot unnecessary. Continue other checks.

In `provenance`, record the source of each reference (local MCP, plugin, cache or user image), node and capture date. For cached data add to `limitations`: “Figma reference freshness was not checked.” If a fresh request failed, record that separately; an old capture does not establish conformity to the current design. Use existing fields; no generator changes needed.

The generator does not calculate `findings`: the agent adds only evidenced findings and explicitly identified assumptions. An empty list is not an automatic PASS.

Local PNG/JPEG images up to 30 MB each are supported. Place them alongside the JSON or in its subdirectory. Absolute paths, `..` escapes and network URLs are rejected. The report embeds images, so one HTML file suffices for sharing. JSON and original images are needed to rebuild; a local reference package is for subsequent runs.

Run:

```sh
node <skill-dir>/scripts/build_report.cjs <run-dir>/report.json <run-dir>/report.html
```

Existing output HTML is not overwritten; choose a new name or directory to rebuild.

When opening the report check images, browser grouping, coverage table, limitations and the difference button when scale is known and the button is available. CSS difference is an interactive visualization, not a pixel diff file or similarity metric. The first version does not generate a binary diff file.

Images fit their containers while preserving aspect ratio. On narrow screens the pair stacks vertically; the overlay reduces both images by the same factor. `cssWidth` remains original-scale metadata rather than the image's displayed width in the report.
