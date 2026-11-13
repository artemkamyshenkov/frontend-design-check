# Reference sources

## Figma

If the user supplied PNG/JPEG or specified a saved package, use it without connecting to Figma. For a link, first read [figma-cache.md](figma-cache.md) and look for suitable saved data. When required data is missing or a current design is requested, use this order:

1. **Local Figma Desktop MCP.** Find it among the current session's available tools and verify reading the required node with the first useful request. The server name depends on the client; do not assume a remote connector is local just because its name contains Figma. The server must be enabled in Figma Desktop and connected to the agent client. [Setup](https://developers.figma.com/docs/figma-mcp-server/local-server-installation/).
2. **Figma plugin in the agent client.** If local MCP is missing or cannot read the required data, briefly state why and use an available plugin. This means the agent client's integration, not an arbitrary plugin inside the design. Follow mandatory tool instructions. Do not install an integration or change client settings automatically.
3. **User screenshots.** If the plugin is absent or also cannot obtain the data, request images of the required states and screen widths, preferably PNG @1x. Use suitable references already obtained; request only what is missing. Do not start the main run without a reference before the user's decision.

Do not make one quota-consuming request to check access and then repeat it for data. Save useful responses immediately. For expired authorization, use a supported connection if available; if user action is required, explain the exact step and available fallback. Do not ask for tokens or secrets.

Inspect the connector's actual tools; names depend on the client. If `get_design_context` is required, first follow its mandatory instructions (in the official plugin, load the figma-design-to-code skill). This is a context-reading requirement, not permission to implement the design.

Extract file key and node-id from the link (112-123 → 112:123). Follow tool rules for branch URLs. For a link without a node, obtain the page list through a supported metadata API if possible; otherwise ask for a link to the selected frame. Do not guess IDs.

Fetch only missing data for the target feature: a screenshot and properties required for comparison. If an image or properties are already in cache or another tool response, do not request them again. Request code context only when needed to extract properties; do not load it automatically for a single screenshot. If a large screen yields only sparse structure, select and request the needed child node. Do not load every layer on the page. Metadata helps locate size variants, but frame names and proximity do not guarantee the same state: verify text/image.

Save screenshots locally using an allowed tool mechanism. A temporary asset URL is not a durable cache. If an inline image is available, save its returned bytes. Do not put temporary signed URLs or tokens in a distributable package.

Check the screenshot response for natural node size and PNG size: the tool may reduce the image to 1024 px. Exporting at natural size is preferable for comparison. If reduced or @2x, reflect the scale in cssWidth; do not directly compare pixels at different scales.

On an access error, check the account with whoami if available and useful. On an explicit rate limit, save acquired data, mark what is missing and offer cache or screenshots; wait for the user's choice before changing sources. Do not switch connectors to bypass quota or assume quotas are independent. Do not retry before the server's stated time; without a reset time, do not automatically retry in the current run. Transport unavailability and exhausted quota are different causes. Rates are not hard-coded in this skill: current guidance is https://developers.figma.com/docs/figma-mcp-server/rate-limits-access/.

## Local PNG/JPEG

Request exports of the specific frames, preferably PNG @1x, and corresponding viewport widths. Distinguish viewport width from component width: on a 360 px screen a card may be 328 px. If only the component image size is known, viewport width cannot be reliably reconstructed.

Determine each file's state, region and scale. Inspect images before making findings. Without layer structure, do not attribute token names or exact padding to the image. Major visual differences and measurements of the site itself remain available.

## Repeat run

Store used images and `reference-manifest.json` with the scenario in every run package. Manage persistent cross-run cache separately according to [figma-cache.md](figma-cache.md). A user's saved package takes precedence over searching the shared cache. Example package manifest:

```json
{
  "capturedAt": "2026-01-01T12:00:00Z",
  "source": "cache",
  "target": "feature name and stable selector if found",
  "entryUrl": "URL without secrets",
  "steps": ["Open the page", "Click Filters"],
  "featureFlags": {},
  "dataAssumptions": ["Nonempty results expected"],
  "viewportHeight": 1000,
  "dpr": 1,
  "widths": [360, 767, 768, 769, 1440],
  "browsers": [
    {"name": "Google Chrome", "scope": "full-matrix"},
    {"name": "WebKit", "scope": "control-widths"}
  ],
  "items": [
    {
      "path": "reference-mobile.png",
      "viewport": 360,
      "cssWidth": 328,
      "state": "default",
      "region": "filter card",
      "sourceUrl": "node link if available",
      "capturedAt": "2026-01-01T12:00:00Z",
      "source": "figma-desktop",
      "version": null
    }
  ]
}
```

Top-level `capturedAt` is the package assembly time; `items[].capturedAt` is when that reference was obtained. When copying from cache, preserve the item's original date. For an old package without it, use the known package date with an explanation. Do not call capture date a Figma version. If the version is unavailable, say so. Additionally save only used measurements and node links, without a full file dump.

Repeating a comparison with a saved package does not require Figma. In the report provide original reference dates and state that Figma freshness was not checked. Refresh the package on user request or when the current design is needed, keeping the previous package. An implementation screenshot becomes an approved baseline only after explicit approval.

The `browsers` list records run intent, not proof that browsers were tested. Actual coverage and versions belong in the new `report.json`; unavailable profiles are recorded there as `skipped`. On rerun retain the primary browser and control widths unless the user changed requirements. Details: [browsers.md](browsers.md).

For a rerun read reference-manifest.json and the previous report.json if present. Restore the scenario, matrix and data assumptions; a new user URL takes precedence. If the scenario was not recorded and cannot be inferred from code, ask for missing steps. Do not store secrets or authorization state in manifests. Copy used references into the new run directory so report.json paths remain within it. If PNG scale is unknown, use cssWidth: null and side-by-side view without overlay.

## Multiple nodes

A link to a parent frame or section and the name of the block under review are sufficient. Find required child nodes through metadata rather than requesting an image of every layer. Use separate labeled frames for different sizes and states. If the link contains another region, first check the parent's structure with an available tool; ask for clarification only when the intended design cannot be identified unambiguously.
