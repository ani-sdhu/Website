/*
  content.js
  ----------
  This is the only file you need to edit to update the site.
  Text fields can contain simple HTML, like <em>italics</em> or <a href="...">links</a>.
  Everything here comes from the CV in files/cv.pdf.
*/

window.SITE = {
  // ---- Identity -----------------------------------------------------------
  name: "Anitesh Sandhu",
  shortName: "asandhu",
  role: "Ph.D. Student, Political Science & International Affairs",
  institution: "University of Georgia",
  location: "Athens, GA",
  email: "sandhuanitesh@gmail.com",
  photo: "assets/img/headshot.jpg",

  tagline:
    "I study energy markets and the politics that govern them: how natural gas prices react to shocks, " +
    "how state utility commissions make decisions, and how states use rhetoric. " +
    "My work is quantitative, built on volatility models, panel regressions, and text as data.",

  bio: [
    "I am a Ph.D. student in Political Science and International Affairs at the University of Georgia, " +
      "on the methodology track with an emphasis on energy. I also hold a Master of International Policy (Honors) " +
      "and a B.S. in Political Science and International Affairs (<em>cum laude</em>), both from UGA.",
    "I am an Energy Analyst at UGA's Benson-Bertsch Center for International Trade and Security, where I build " +
      "price forecasting models, R tools for collecting U.S. Energy Information Administration (EIA) data, " +
      "and short public briefs on energy resources.",
    "Before graduate school I worked in the energy industry, advising on LNG and oil market risk and supporting " +
      "a project to refurbish land drilling rigs. I bring that experience to questions about markets and the " +
      "institutions that govern them."
  ],

  interests: [
    "Energy economics and policy",
    "Natural gas markets and price volatility",
    "Public utility commission decision-making",
    "Strategic rhetoric and political violence",
    "Text as data",
    "Quantitative methods"
  ],

  links: [
    { label: "Email", url: "mailto:sandhuanitesh@gmail.com" },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/anisandhu/" },
    { label: "GitHub", url: "https://github.com/ani-sdhu" }
  ],
  cvUrl: "files/cv.pdf",

  // ---- Research -----------------------------------------------------------
  research: [
    {
      title: "Partisanship and decision-making on state public service commissions",
      status: "In progress",
      method: "Vote-level regression, vote fixed effects",
      abstract:
        "A multi-state design comparing three kinds of commissions: elected partisan commissions, appointed " +
        "commissions with party-balance rules, and appointed commissions without them. Vote-level regressions " +
        "with vote fixed effects estimate the partisan gap."
    },
    {
      title: "Weather shocks and natural gas price volatility: a five-state panel",
      status: "In progress",
      method: "EGARCH, EGARCH-X, HAR-RV",
      abstract:
        "EGARCH and EGARCH-X models for Delaware, Florida, Georgia, Maryland, and Ohio, with heating and cooling " +
        "degree day surprises as outside (exogenous) regressors, plus a companion HAR-RV model using daily " +
        "Henry Hub spot prices."
    },
    {
      title: "The strategic deployment of rhetoric by states",
      status: "In progress",
      method: "Natural language processing",
      abstract:
        "Uses natural language processing to measure how states use rhetoric strategically, and whether that " +
        "rhetoric helps predict political violence."
    }
  ],

  capstone: {
    title: "The Impact of Communication on U.S.-Saudi Gas Market Shock and Interaction",
    note: "Master of International Policy capstone, University of Georgia, 2026"
  },

  presentations: [
    { kind: "Policy report", title: "V for Voting: An Analysis of Democratic Backsliding in South America",
      venue: "U.S. Department of State, Foreign Service Institute", year: "2024" },
    { kind: "Policy report", title: "DPRK: Forced Labor and Supply Chain Analysis",
      venue: "U.S. Department of State, Bureau of East Asian and Pacific Affairs", year: "2024" },
    { kind: "Conference", title: "Strategic Deployment of Rhetoric by States",
      venue: "Southeast Undergraduate Research Conference, Athens, GA", year: "2023" }
  ],

  // ---- Software and data products ----------------------------------------
  software: [
    {
      name: "Energy and Economic Data Explorer",
      kind: "Dash / Plotly app",
      desc: "A public web app on Hugging Face Spaces that combines EIA and FRED data for the Benson-Bertsch " +
        "Center's energy research program.",
      links: []   // add { label: "Open app", url: "https://huggingface.co/spaces/..." }
    },
    {
      name: "GridTranslate",
      kind: "Crosswalk dataset",
      desc: "A crosswalk of more than 10,000 entries linking every U.S. balancing authority to its NERC " +
        "Regional Entity and to the counties it serves.",
      links: []
    },
    {
      name: "EIA data tools",
      kind: "R",
      desc: "R tools for collecting EIA data, a pipeline that maps the electricity sources serving U.S. military " +
        "installations, and a scraper for state energy legislation.",
      links: []
    },
    {
      name: "Residential electrification tracker",
      kind: "Data framework",
      desc: "A framework for tracking residential electrification, built on the EIA State Energy Data System (SEDS).",
      links: []
    }
  ],

  // ---- Experience ---------------------------------------------------------
  experience: [
    {
      title: "Energy Analyst",
      org: "Benson-Bertsch Center for International Trade and Security, University of Georgia",
      place: "Athens, GA",
      dates: "Aug. 2025 to present",
      bullets: [
        "Designed the research architecture for a team of 10+ turning large datasets into policy- and consumer-oriented briefs",
        "Built price forecasting models, plant implementation plans, and other industry-specific analyses",
        "Author standardized two-page briefs on energy resources (capacity factor, efficiency) for general audiences, built on 2024 EIA data"
      ]
    },
    {
      title: "CIO and Strategy Consultant",
      org: "Scanoleum",
      place: "Milpitas, CA",
      dates: "Jan. 2020 to present",
      bullets: [
        "Advise on LNG and oil market risk, export controls, and commercial contracts valued up to $3M",
        "Support commercial strategy through market analysis, risk management, and reporting, contributing to over $400K in sales",
        "Coordinated generator shipments to support civilian needs during wartime conflict"
      ]
    },
    {
      title: "Training Project Engineer",
      org: "Phronteseas",
      place: "Remote",
      dates: "Feb. 2023 to Dec. 2023",
      bullets: [
        "Supported a $140M project refurbishing 11 land drilling rigs (750 to 2000 HP) for Kuwait Drilling Company over 11 months",
        "Led specification gathering, data visualization, and contract review with vendors and global manufacturers"
      ]
    },
    {
      title: "Creation and Technology Lab Manager",
      org: "Georgia State University",
      place: "Atlanta, GA",
      dates: "Oct. 2022 to May 2023",
      bullets: [
        "Managed technical equipment for campus events and trained students in safe lab use across multiple Atlanta-area campuses"
      ]
    }
  ],

  // ---- Teaching -----------------------------------------------------------
  teaching: [
    {
      role: "Teaching Assistant",
      course: "POLS 1101: American Government",
      term: "Fall 2026",
      place: "University of Georgia",
      note: "Instructor: Dr. Michael Lynch. I lead breakout sessions that connect lecture concepts to real-world examples."
    }
  ],

  // ---- Methods and tools --------------------------------------------------
  methods: [
    { area: "Volatility modeling", detail: "EGARCH, EGARCH-X, HAR-RV" },
    { area: "Panel regression", detail: "Fixed effects designs across states and votes" },
    { area: "Text as data", detail: "Natural language processing" },
    { area: "Data pipelines", detail: "API collection, scrapers, crosswalks" },
    { area: "Visualization", detail: "Interactive Dash/Plotly apps, Power BI" }
  ],

  // Shown as library(): the languages and software you work in.
  tools: [
    { name: "R", note: "EIA data tools and pipelines" },
    { name: "Python", note: "Dash/Plotly apps" },
    { name: "Quarto", note: "" },
    { name: "LaTeX", note: "" },
    { name: "JavaScript", note: "" },
    { name: "HTML", note: "" },
    { name: "Power BI", note: "" },
    { name: "Adobe Creative Suite", note: "" }
  ],

  // Shown as data(): the data sources you work with.
  data: [
    { name: "EIA", note: "API v2, State Energy Data System (SEDS)" },
    { name: "FRED", note: "Federal Reserve Economic Data" },
    { name: "BEA", note: "Bureau of Economic Analysis" },
    { name: "Census", note: "U.S. Census Bureau" },
    { name: "NOAA/NCEI", note: "weather and climate records" }
  ],

  // ---- CV highlights ------------------------------------------------------
  education: [
    { degree: "Ph.D., Political Science & International Affairs", school: "University of Georgia", year: "2026 to 2031 (expected)", note: "Methodology track, energy emphasis" },
    { degree: "Master of International Policy, Honors", school: "University of Georgia", year: "May 2026", note: "" },
    { degree: "B.S., Political Science and International Affairs, cum laude", school: "University of Georgia", year: "May 2025", note: "" }
  ],
  certifications: [
    "Certificate in Data Analysis and Policy, University of Georgia, 2027 (expected)"
  ],
  languages: "English (native), Spanish (professional), Hindi (conversational), Punjabi (conversational)",

  // ---- News (shown in the History tab) ------------------------------------
  news: [
    { date: "Fall 2026", text: "Teaching assistant for POLS 1101: American Government at UGA." },
    { date: "May 2026", text: "Completed the Master of International Policy (Honors) at UGA." },
    { date: "Aug. 2025", text: "Joined the Benson-Bertsch Center for International Trade and Security as an Energy Analyst." }
  ]
};
