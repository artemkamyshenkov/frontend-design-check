# Figma file cache

The agent manages the cache with ordinary filesystem tools. No separate MCP, background process or database is needed. The cache stores references between runs; each run directory contains copies and results for that review.

## Directory and lookup

Use the user-specified directory. Otherwise choose `${XDG_CACHE_HOME}/frontend-design-check/figma` if XDG_CACHE_HOME is absolute, or `~/.cache/frontend-design-check/figma`. If writing there is unavailable, use a persistent `frontend-design-check-cache/figma` within an allowed workspace artifacts directory. Tell the user the chosen absolute path for future tasks. Do not change environment permissions for the cache or store it in the installed skill directory.

Create subdirectories for each file or branch and normalized node. Safe names can be SHA-256 hashes of the file/branch identifier and node ID. Record the node itself in the manifest as `112:123`. A branch is a separate source: do not substitute the main file. Use identifiers according to connector rules.

Example structure:

```text
<cache-root>/<file-or-branch-hash>/<node-hash>/<snapshot-id>/
  reference-manifest.json
  reference.png
  measurements.json       # only when properties were actually obtained
```

`snapshot-id` is a unique capture name, e.g. UTC time with microseconds, not a Figma version. Save each new fetch as a separate snapshot without overwriting older ones. Do not mix old properties with a new image unless their shared version is confirmed.

Before a network request read manifests for the required node only. Match file/branch, node, state, region and export parameters. Use the version or package specified by the user if any. Otherwise select the latest compatible usable snapshot. Age alone does not trigger a network refresh.

Verify that the image is readable, its size matches the manifest and required measurements exist. Missing measurements do not prevent visual comparison but do not permit claims about exact layer properties. Unknown scale permits side-by-side comparison; overlay requires known scale. Resolve paths only inside the snapshot directory, without `..` escapes, absolute paths or outward symlinks.

## What to save

Example snapshot record (values must come from the tool or actual observed data):

```json
{
  "schemaVersion": 1,
  "capturedAt": "2026-01-01T12:00:00Z",
  "source": "figma-desktop",
  "fileKey": "file-or-branch-key-from-tool",
  "nodeId": "112:123",
  "version": null,
  "items": [
    {
      "path": "reference.png",
      "viewport": 360,
      "cssWidth": 328,
      "state": "default",
      "region": "filter card",
      "export": {"format": "png", "pixelWidth": 656, "pixelHeight": 400, "scale": 2},
      "measurementsPath": null
    }
  ]
}
```

`source` is `figma-desktop` or `figma-plugin`; mark reuse as `cache` in the report while preserving original provenance. `version`, `viewport`, `cssWidth` and `scale` may be `null` if unknown. Do not infer viewport width from component width. Save only obtained properties, units and associated nodes in measurements.json; do not present visual estimates as Figma properties.

Save files first, then the manifest. Do not consider a directory without a readable manifest a complete entry. Do not store full Figma file dumps, tokens, cookies or temporary signed URLs. A temporary link without a local image is not a cached reference. If the tool cannot save an image, explicitly say that no durable cache was created for that part.

## When to call Figma

- Suitable data is absent or a required file is corrupted: fetch only what is missing using the order in [references.md](references.md).
- The user requested a refresh or a check against the current design: fetch fresh data and save a new snapshot. Do not rely solely on the old cache.
- The user requested a repeat using saved references: use them without Figma calls.
- Otherwise use a compatible cache, report its date and explicitly state: “Figma reference freshness was not checked.”

Do not request a version on every run merely to check freshness or promise Figma synchronization. On rate limit, save what was obtained. If fresh data is required, report that checking the current design is incomplete; an older capture is suitable only for explicitly identified comparison against the saved version.

## Passing data to the report

Copy used images and measurements into the new run directory; do not reference an external cache from report.json. Add original dates, nodes, versions and provenance to the package manifest and report provenance. Preserve each snapshot's date separately. Copying does not refresh its Figma capture date.

The cache is not an approved baseline and does not turn an implementation screenshot into a reference. Save user-provided local PNG/JPEG images in the portable package with their own provenance; do not assign them a Figma version or node without confirmation.

If live Figma access is blocked, do not silently substitute cache: show its date and await the user's decision. This exception overrides default cache reuse.
