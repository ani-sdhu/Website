# Academic website (R console theme)

A one-page academic site styled after an RStudio session. It reads like a
normal academic website: a top menu, your photo, name, bio, and links up front,
and clear sections below. The R feel lives in the styling. Each section is an
RStudio-style pane, the hero has a clickable Environment pane, tables print like
data frames, and publications are numbered like an R vector.

An optional R console (the "Console" button, or Ctrl+2) lets curious visitors
type commands such as `research()` or `library(fixest)`. Nobody needs it to get around.

No build step. It is plain HTML, CSS, and JavaScript.

## Editing your content

Everything you write lives in one file: `assets/js/content.js`.
Replace anything in `[square brackets]`. Then replace `files/cv.pdf` with your CV.

Optional: add a headshot at `assets/img/headshot.jpg` and set `photo` in `content.js`.

## Previewing locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Publishing on GitHub Pages

1. Merge this branch into `main`.
2. In the repository, open Settings, then Pages.
3. Under "Build and deployment," choose "Deploy from a branch," pick `main` and `/ (root)`, and save.

## Console commands

| Command | What it does |
| --- | --- |
| `about()`, `research()`, `publications()`, `methods()`, `teaching()`, `cv()`, `contact()` | open a section |
| `View(x)`, `print(x)`, `summary(x)` | jump to any section |
| `ls()` | list the objects |
| `library(pkg)` | check whether a tool is in your toolkit |
| `theme()` | switch light and dark |
| `citation()` | APA citation for the site |
| `clear()` or Ctrl+L | clear the console |

Direct links work too: `#research`, `#teaching`, and so on.
