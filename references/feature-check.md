# Individual feature

Use scope: feature and a CSS selector, for example [data-ti="filters"] or [data-testid="search-form"]. The attribute must already exist in the DOM; do not add one to the application for the review. Without a selector, find the block by role, text or DOM and record the chosen locator.

At a control width, wait for loading and check the number of matches. Zero is missing; multiple matches are ambiguous. Do not use first() to choose arbitrarily. Narrow the selector by container; after inspecting the DOM, hidden desktop/mobile copies can be distinguished with an explicit visible locator.

If the block is hidden, follow the stated opening scenario with its normal control. Batch capture supports openControl with selector or role/name and optional widths. Open only when the target is not already visible. Use an available browser tool for complex scenarios; do not put arbitrary page JavaScript in the config.

After opening, check visibility, nonzero size, overlaps and availability of key actions. A hidden block is hidden; one missing after waiting is missing. These block the review and are not a successful design check. If the behavior is expected at a width, record the rule and separately verify the intended access method, such as a mobile button.

At other widths, repeat presence and state checks. Capture the feature and its context when needed. For a long feature, scroll to inspect its top and bottom; nine points in the visible area do not cover the entire content.
