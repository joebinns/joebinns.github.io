# CV PDFs

Both PDFs come from `cv-joe-binns.typ` and the bundled fonts and vector icons.
The palette follows `styles.css`: cream `#f8f0e3`, ink `#090909`, muted dark-mode
text `#b2b2b2`, and royal-blue links `#4169e1`. Icon RGB channels are clamped
between ink and cream, matching the website's darken/lighten tint overlays.

Regenerate both versions with Typst:

```sh
typst compile --font-path documents/cv/assets/fonts --input theme=light documents/cv/cv-joe-binns.typ documents/cv/cv-joe-binns.pdf
typst compile --font-path documents/cv/assets/fonts --input theme=dark documents/cv/cv-joe-binns.typ documents/cv/cv-joe-binns-dark.pdf
```

Keep `cv-joe-binns.pdf` as the light version for existing links and visitors
without JavaScript. Website CV links open in a new tab with `target="_blank"`
and `rel="noopener"`, without a forced download. They use `data-theme-dark`;
`registerThemeLinks()` in `src/Theme.js` selects the PDF using the same
`prefers-color-scheme: light` query as the stylesheet and updates it when the
browser/system preference changes.
