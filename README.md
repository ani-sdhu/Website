# anitesh sandhu: academic website

A one-page academic site laid out like an R help page: a documentation strip at
the top, monospace headings, a two-column "arguments" table for structured
facts, and the Environment list as the contents menu. The masthead figure is a
transmission line whose conductors are plotted as catenaries.

It is plain HTML and CSS with a small script. There is no build step, and the
page reads fine with JavaScript turned off.

## Files

| File | What it is |
| --- | --- |
| `index.html` | All of the text. Edit this to change what the site says. |
| `assets/css/style.css` | Layout, type, and the light and dark themes. |
| `assets/js/site.js` | Theme switch, contents menu, and the optional R console. |
| `assets/img/headshot.jpg` | Portrait. |
| `files/cv.pdf` | CV. Replace this file when the CV changes. |
| `tools/lines.js` | Generates the transmission line figure. |

## Editing

Open `index.html` and change the text. Each section is a `<section>` with an
`id`. If you add or remove a section, also update the list inside
`<nav class="env">`. The small numbers in that list are counts of entries; keep
them in step with the page.

To redraw the figure (tower positions, sag, number of towers), edit
`tools/lines.js` and run:

```bash
node tools/lines.js
```

## Previewing locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Publishing on GitHub Pages

1. Merge this branch into `main`.
2. In the repository, open Settings, then Pages.
3. Under "Build and deployment," choose "Deploy from a branch," pick `main` and `/ (root)`, and save.

## The R console

"R console" in the contents menu opens a small console. Each section is an
object: `research()`, `View(methods)`, `ls()`, `help()`, `theme()`, `clear()`,
`q()`. It is an extra; nothing on the site depends on it.
