/*
  content.js
  ----------
  This is the only file you need to edit to update the site.
  Everything below shows up in three places at once:
    1. the Environment pane (the clickable objects on the right),
    2. the Viewer pane (the readable pages), and
    3. the plain view (a classic academic page for print or quick reading).

  Text fields can contain simple HTML, like <em>italics</em> or <a href="...">links</a>.
  Replace anything written in [square brackets].
*/

window.SITE = {
  // ---- Identity -----------------------------------------------------------
  name: "[Your Name]",
  shortName: "[yourname]",            // used in the window title and prompt path
  role: "PhD Candidate, Political Science",
  institution: "[University Name]",
  location: "[City, State]",
  email: "[you@university.edu]",
  pronouns: "",                       // optional, e.g. "she/her"
  photo: "",                          // optional, e.g. "assets/img/headshot.jpg"

  // One sentence that tells a reader what you study and how.
  tagline:
    "I study the politics of energy: who wins and who loses when energy systems change, " +
    "and how institutions shape those fights. My work leans on causal inference and careful measurement.",

  // A few short paragraphs. Plain language works best.
  bio: [
    "I am a PhD candidate in Political Science at [University Name]. My research sits where " +
      "comparative politics, American politics, and political economy meet the energy sector.",
    "[Second paragraph: the big question your dissertation asks, and why it matters outside academia.]",
    "[Third paragraph: the kinds of data and designs you use, for example administrative records, " +
      "text, spatial data, field or survey experiments.]"
  ],

  interests: [
    "Energy politics",
    "Climate and environmental policy",
    "Political economy of regulation",
    "Public opinion on energy transitions",
    "Causal inference",
    "Computational social science"
  ],

  links: [
    { label: "Email", url: "mailto:[you@university.edu]" },
    { label: "CV (PDF)", url: "files/cv.pdf" },
    { label: "Google Scholar", url: "[https://scholar.google.com/...]" },
    { label: "GitHub", url: "https://github.com/ani-sdhu" },
    { label: "LinkedIn", url: "[https://www.linkedin.com/in/...]" }
  ],

  // ---- Research -----------------------------------------------------------
  dissertation: {
    title: "[Dissertation title]",
    committee: "[Chair Name] (chair), [Member Name], [Member Name]",
    summary:
      "[Two to four sentences. What is the puzzle, what is your argument, and what evidence do you use?]"
  },

  // status examples: "Working paper", "Under review", "In progress", "R&R at [Journal]"
  research: [
    {
      title: "[Working paper title]",
      status: "Working paper",
      coauthors: "",
      method: "Difference-in-differences",
      abstract: "[One or two sentences on the question, the data, and the main finding.]",
      links: [{ label: "Draft", url: "#" }]
    },
    {
      title: "[Second project title]",
      status: "Under review",
      coauthors: "with [Coauthor Name]",
      method: "Regression discontinuity",
      abstract: "[One or two sentences on the question, the data, and the main finding.]",
      links: []
    },
    {
      title: "[Third project title]",
      status: "In progress",
      coauthors: "",
      method: "Text as data",
      abstract: "[One or two sentences on the question, the data, and the main finding.]",
      links: []
    }
  ],

  // Write each entry already formatted in APA style.
  publications: [
    {
      apa:
        "[Lastname, F. M.], &amp; [Coauthor, F. M.] ([Year]). [Article title in sentence case]. " +
        "<em>[Journal Name]</em>, <em>[Volume]</em>([Issue]), [pages]. https://doi.org/[doi]",
      links: [{ label: "PDF", url: "#" }, { label: "Replication", url: "#" }]
    }
  ],

  // ---- Methods ------------------------------------------------------------
  // Shown in the "methods" object and in the Packages tab.
  methods: [
    { area: "Causal inference", detail: "Difference-in-differences, regression discontinuity, synthetic control, instrumental variables" },
    { area: "Measurement", detail: "Survey design, item response theory, index construction" },
    { area: "Text as data", detail: "Topic models, supervised classification, embeddings" },
    { area: "Spatial analysis", detail: "Geocoding, spatial joins, distance and exposure measures" },
    { area: "Bayesian modeling", detail: "Multilevel models, MRP" },
    { area: "Reproducibility", detail: "Version control, literate programming, replication archives" }
  ],

  // R packages (or other tools) you actually use. These fill the Packages tab.
  packages: [
    { name: "tidyverse", note: "data wrangling and visualization" },
    { name: "fixest", note: "fixed effects and event study models" },
    { name: "did", note: "staggered difference-in-differences" },
    { name: "rdrobust", note: "regression discontinuity" },
    { name: "Synth", note: "synthetic control" },
    { name: "sf", note: "spatial data" },
    { name: "quanteda", note: "text analysis" },
    { name: "brms", note: "Bayesian multilevel models" },
    { name: "modelsummary", note: "tables for papers" },
    { name: "targets", note: "reproducible pipelines" }
  ],

  // ---- Teaching -----------------------------------------------------------
  teaching: [
    { role: "Instructor of record", course: "[Course number]: [Course title]", term: "[Term Year]", place: "[University Name]" },
    { role: "Teaching assistant", course: "[Course number]: Introduction to Quantitative Methods", term: "[Term Year]", place: "[University Name]" },
    { role: "Teaching assistant", course: "[Course number]: Environmental Politics", term: "[Term Year]", place: "[University Name]" }
  ],

  // ---- CV highlights ------------------------------------------------------
  cvUrl: "files/cv.pdf",
  education: [
    { degree: "PhD, Political Science (expected [Year])", school: "[University Name]" },
    { degree: "MA, Political Science", school: "[University Name], [Year]" },
    { degree: "BA, [Major]", school: "[University Name], [Year]" }
  ],
  awards: [
    "[Fellowship or grant name], [Year]",
    "[Award name], [Year]"
  ],

  // ---- News (optional; leave the array empty to hide) ---------------------
  news: [
    { date: "[Month Year]", text: "[Presented a paper at a conference, for example APSA or MPSA.]" },
    { date: "[Month Year]", text: "[New working paper posted.]" }
  ]
};
