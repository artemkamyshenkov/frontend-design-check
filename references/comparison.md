# Comparison with the design

## 4. Compare and document findings

Compare matching states and regions at the same viewport width. Do not stretch a desktop design to mobile. If a reference is unavailable for a width, check integrity and known rules without inventing expected geometry.

Prioritize significant problems: incorrect composition, overlaps, missing elements, clipped text and substantial spacing differences. The initial adjustable spacing filter is |actual−expected| ≥ 4 CSS px AND a relative difference ≥ 20%. When expected=0, use only the absolute threshold. This is a skill heuristic, not a design-system standard. Do not apply it mechanically to fonts, icons or functional failures. By default, small differences below the filter do not clutter the main findings.

For each finding specify width/state, element, expected and actual values, source (Figma node or PNG), evidence (measurement/screenshot), impact and confidence. DOM values are measurements; PNG values are visual estimates unless measured separately. Figma reference code can aid analysis but is not application code and may contain rounding. Ignore hidden design layers.

Do not treat live prices, dates or data-dependent marker positions as defects without a comparable scenario. An unrelated popup is not a feature defect until a verified attempt has been made to close it normally. If using permitted fixtures or masks, preserve the original screenshot, list altered regions and do not mask the geometry under review. Pixel difference is a signal; do not declare pass/fail based on a pixel percentage alone.

For each secondary browser, separately assess conformity to the reference and differences from Google Chrome under matching conditions. Identify the source of each difference. Do not treat font antialiasing or subpixel rasterization noise as a separate defect unless geometry, wrapping or readability is affected.
