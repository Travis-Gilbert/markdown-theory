# tasks-footnotes

Task lists and footnotes, both common in uncurated docs, must render with correct
apparatus and stay within the measure.

## Roadmap

- [x] Ship the proportion engine[^1]
- [x] Ship the render surface
- [ ] Ship the showcase[^2]
- [ ] Publish to npm

Some running text that references a footnote mid-sentence[^3] and then continues
long enough to wrap at least once across the reading column.

[^1]: The engine computes proportion from axes rather than reading a theme file.
[^2]: Deferred deliberately; not a blocker for the core package.
[^3]: Footnotes render in a default section unless a sidenote enhancement is on.
