# Prepare the result

## 5. Deliver the result

Use English for the report by default, or Russian when the user requests it. Set `language` to `en` or `ru` and write the title, findings, notes, limitations and other agent-authored text in that language. If another language is requested, explain that report interface labels currently support English and Russian and ask which to use.

Create `report.json` using [report-format.md](report-format.md), then run:

```sh
node <skill-dir>/scripts/build_report.cjs <package>/report.json <package>/report.html
```

The generator embeds PNG/JPEG images and produces side-by-side comparisons, switchable overlays and a visual difference view. It does not access the network, capture the browser or decide whether a difference is a defect. Set `cssWidth` metadata from measurement/export to preserve the relationship of original CSS sizes at @1x/@2x; the report scales display down to the container width. If scale is unknown, use null: the report shows images side by side without an overlay. Do not adjust actual width to fit the reference.

Open the HTML with an available tool and check image visibility, table readability and mode switching when available. If visual verification is impossible, say so. Do not claim complete success with an empty matrix or unavailable source.

After checking the HTML, clean up the browser session as described in [workflow.md](workflow.md), then deliver the result.

In fast mode, first give a short result: link, up to four main findings if any, control screenshots and coverage. If there are no findings, say so and specify the checked scope. Still save the full HTML locally. Label widths checked geometrically without screenshots as `measured`. In full mode, include the full browser table and limitations.

Do not fix application code or designs during a design check. Publishing the report externally or updating an approved baseline requires a separate request.

Without a design, title the result “Responsive review of page/feature” or its equivalent in the selected language. Use `no-reference` for screenshots, or `review` when issues are confirmed; use `measured` for measurements without screenshots. Never use `matched` without a reference. State that design conformity was not checked. Record missing, hidden or ambiguous targets as `blocked` with reason, width and state. List untested widths separately; do not present an interrupted run as complete.
