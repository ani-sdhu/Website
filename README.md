# Academic website (R console theme)

A one-page academic site styled like an RStudio session. Visitors navigate by
clicking objects in the **Environment** pane, using the buttons under the
console, or typing commands such as `research()` or `help()`. Pages open in the
**Viewer** pane. A **plain view** (`plain()` or the button in the top bar) shows
everything as a classic, printable page.

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
| `View(x)`, `print(x)`, `str(x)`, `summary(x)` | inspect any object |
| `ls()` | list the objects |
| `library(pkg)` | check whether a tool is in your toolkit |
| `plain()` | switch to the plain view |
| `theme()` | switch light and dark |
| `citation()` | APA citation for the site |
| `clear()` or Ctrl+L | clear the console |

Direct links work too: `#/research`, `#/teaching`, `#/plain`, and so on.
