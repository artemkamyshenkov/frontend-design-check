# Whole page

Use scope: page; no selector is needed. Verify that the URL opened the intended page, not an error, login or placeholder. HTTP 200 alone is insufficient. Wait for the main content; supply readySelector when necessary.

Capture fullPage at each control width. Inspect the top, middle and bottom, including sticky/fixed elements while scrolling. A full-page screenshot alone does not establish that nothing overlaps: also inspect the viewport at problem locations. Check main content, navigation and availability of primary actions without submitting forms that have external effects.

Pages may contain intentional horizontal carousels. Distinguish them from document overflow. The absence of horizontal scrolling does not establish that text is not clipped or elements do not overlap.
