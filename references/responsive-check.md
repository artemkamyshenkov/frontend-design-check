# Responsive review

Without a reference, do not guess correct spacing, font sizes or the point where the layout should change. Check observable issues: document overflow, inaccessible controls, clipped text, unintended overlaps, content escaping its container, and inability to open or close the feature.

Take breakpoints from the available project and styles actually applied. Check b−1/b (also b+1 for full). If breakpoints are unknown, use 360/768/1024/1440 unless the user supplied widths. A layout change between widths is not itself a defect.

For each width record viewport, state, target presence and visibility, overflow, screenshot, browser and limitations. Automated overflow and hit tests are signals for inspection, not verdicts: carousels, dropdowns and ellipsis clipping may be intentional. For a finding, provide the element, reproduction, actual result, expected accessible behavior and evidence. Base the expectation on an observable problem or user requirement, not an invented design.

Wait for fonts, images and stable geometry. Inspect complex asynchronous states with a browser tool. Check the main controls inside a feature; a container hit test does not establish that all its buttons work.
