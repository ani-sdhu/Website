/* app.js: the R-console interface. Content lives in content.js. */
(function () {
  "use strict";

  var S = window.SITE || {};
  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  var out = $("#console-out");
  var consoleEl = $("#console");
  var input = $("#console-input");
  var form = $("#console-form");
  var viewer = $("#viewer-body");
  var viewerMeta = $("#viewer-meta");
  var statusObj = $("#status-obj");

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isNarrow = function () { return window.matchMedia("(max-width: 900px)").matches; };

  var history = [];
  var histIdx = -1;
  var current = "about";

  /* ---------------------------------------------------------------
     Helpers
     --------------------------------------------------------------- */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function strip(html) {
    var d = document.createElement("div");
    d.innerHTML = String(html == null ? "" : html);
    return d.textContent || "";
  }
  function trunc(s, n) { s = String(s); return s.length > n ? s.slice(0, n - 1) + "…" : s; }
  function pad(s, n) { s = String(s); return s + new Array(Math.max(0, n - s.length) + 1).join(" "); }
  function list(a) { return Array.isArray(a) ? a : []; }
  function linksHtml(links) {
    return list(links).map(function (l) {
      var ext = /^https?:/.test(l.url) ? ' target="_blank" rel="noopener"' : "";
      return '<a href="' + esc(l.url) + '"' + ext + ">" + esc(l.label) + "</a>";
    }).join("");
  }
  function rstr(s) { return '<span class="str">"' + esc(strip(s)) + '"</span>'; }

  /* Format rows as an R-style printed data.frame (text only). */
  function frame(rows, cols, label) {
    if (!rows.length) return '<span class="note"># ' + label + ": 0 rows</span>";
    var max = isNarrow() ? 22 : 30;
    var cells = rows.map(function (r) {
      return cols.map(function (c) { return trunc(strip(r[c] || ""), max); });
    });
    var widths = cols.map(function (c, i) {
      return Math.max(c.length, Math.max.apply(null, cells.map(function (r) { return r[i].length; })));
    });
    var idxW = String(rows.length).length;
    var head = pad("", idxW) + " " + cols.map(function (c, i) { return pad(c, widths[i]); }).join("  ");
    var body = cells.map(function (r, k) {
      return pad(String(k + 1), idxW) + " " + r.map(function (v, i) { return pad(v, widths[i]); }).join("  ");
    });
    return '<span class="note"># ' + label + ": " + rows.length + " × " + cols.length + "</span>\n" +
      esc(head) + "\n" + esc(body.join("\n"));
  }

  /* R-style character vector print */
  function chrvec(arr) {
    var items = arr.map(function (x) { return '"' + strip(x) + '"'; });
    var lines = [], line = "", idx = 1, width = isNarrow() ? 40 : 60;
    items.forEach(function (it, i) {
      var tag = "[" + idx + "] ";
      if (!line) line = tag;
      if ((line + it).length > width && line !== tag) {
        lines.push(line.trimEnd());
        idx = i + 1;
        line = "[" + idx + "] ";
      }
      line += it + " ";
    });
    if (line) lines.push(line.trimEnd());
    return esc(lines.join("\n")).replace(/&quot;([^&]*)&quot;/g, '<span class="str">"$1"</span>');
  }

  function rlist(obj) {
    return Object.keys(obj).map(function (k) {
      return '<span class="hl">$' + esc(k) + "</span>\n[1] " + rstr(obj[k]);
    }).join("\n\n");
  }

  /* ---------------------------------------------------------------
     Objects in the "Global Environment"
     --------------------------------------------------------------- */
  var OBJ = {
    about: {
      kind: "list", type: function () { return "list [" + 5 + "]"; },
      value: function () { return S.role + ", " + S.institution; },
      print: function () {
        return rlist({ name: S.name, role: S.role, institution: S.institution, location: S.location, focus: S.tagline });
      },
      render: renderAbout
    },
    research: {
      kind: "df",
      type: function () { return "data.frame"; },
      value: function () { return list(S.research).length + " obs. of 4 variables"; },
      print: function () { return frame(list(S.research), ["title", "status", "method"], "A data.frame"); },
      render: renderResearch
    },
    publications: {
      kind: "df",
      type: function () { return "tibble"; },
      value: function () { return list(S.publications).length + " × 2"; },
      print: function () {
        return frame(list(S.publications).map(function (p) { return { citation: p.apa }; }), ["citation"], "A tibble");
      },
      render: renderPublications
    },
    methods: {
      kind: "chr",
      type: function () { return "chr [" + list(S.methods).length + "]"; },
      value: function () { return list(S.methods).map(function (m) { return '"' + m.area + '"'; }).join(" "); },
      print: function () { return chrvec(list(S.methods).map(function (m) { return m.area; })); },
      render: renderMethods
    },
    teaching: {
      kind: "df",
      type: function () { return "data.frame"; },
      value: function () { return list(S.teaching).length + " obs. of 4 variables"; },
      print: function () { return frame(list(S.teaching), ["role", "course", "term"], "A data.frame"); },
      render: renderTeaching
    },
    cv: {
      kind: "chr",
      type: function () { return "pdf"; },
      value: function () { return '"' + (S.cvUrl || "files/cv.pdf") + '"'; },
      print: function () {
        return "[1] " + rstr(S.cvUrl || "files/cv.pdf") + '\n<span class="note"># download: </span><a href="' +
          esc(S.cvUrl || "files/cv.pdf") + '" target="_blank" rel="noopener">open the PDF</a>';
      },
      render: renderCV
    },
    contact: {
      kind: "list",
      type: function () { return "list [" + (1 + list(S.links).length) + "]"; },
      value: function () { return S.email; },
      print: function () {
        var o = { email: S.email };
        list(S.links).forEach(function (l) {
          if (!/^mailto:/.test(l.url)) o[l.label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/_$/, "")] = l.url;
        });
        return rlist(o);
      },
      render: renderContact
    }
  };
  if (list(S.news).length) {
    OBJ.news = {
      kind: "df",
      type: function () { return "data.frame"; },
      value: function () { return list(S.news).length + " obs. of 2 variables"; },
      print: function () { return frame(list(S.news), ["date", "text"], "A data.frame"); },
      render: renderNews
    };
  }
  var ORDER = Object.keys(OBJ);

  /* ---------------------------------------------------------------
     Viewer renderers (also reused by the plain view)
     --------------------------------------------------------------- */
  function kicker(cmd, plain) { return plain ? "" : '<p class="kicker">' + esc(cmd) + "</p>"; }

  function renderAbout(plain) {
    var img = S.photo ? '<img src="' + esc(S.photo) + '" alt="Portrait of ' + esc(strip(S.name)) + '">' : "";
    var news = list(S.news).length && !plain
      ? "<h3>Recent</h3><ul>" + list(S.news).slice(0, 3).map(function (n) {
          return '<li><span class="meta">' + esc(n.date) + "</span> &nbsp;" + n.text + "</li>";
        }).join("") + "</ul>"
      : "";
    return '<div class="doc">' + kicker("View(about)", plain) +
      '<div class="hero">' + img + "<div>" +
      "<h1>" + esc(S.name) + "</h1>" +
      '<p class="sub">' + esc(S.role) + " &middot; " + esc(S.institution) +
      (S.pronouns ? " &middot; " + esc(S.pronouns) : "") + "</p>" +
      "</div></div>" +
      '<p class="lede">' + S.tagline + "</p>" +
      list(S.bio).map(function (p) { return "<p>" + p + "</p>"; }).join("") +
      "<h3>Research interests</h3>" +
      '<ul class="tags">' + list(S.interests).map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" +
      '<div class="linkrow">' + linksHtml(S.links) + "</div>" +
      news + "</div>";
  }

  function renderResearch(plain) {
    var d = S.dissertation || {};
    var diss = d.title
      ? '<div class="card"><span class="status alt">Dissertation</span>' +
        "<h3>" + d.title + "</h3><p>" + (d.summary || "") + "</p>" +
        (d.committee ? '<p class="meta">Committee: ' + d.committee + "</p>" : "") + "</div>"
      : "";
    var items = list(S.research).map(function (r) {
      return '<div class="card"><span class="status">' + esc(r.status) + "</span>" +
        (r.method ? '<span class="meta">' + esc(r.method) + "</span>" : "") +
        "<h3>" + r.title + "</h3>" +
        (r.coauthors ? '<p class="meta">' + r.coauthors + "</p>" : "") +
        "<p>" + (r.abstract || "") + "</p>" +
        (list(r.links).length ? '<div class="linkrow">' + linksHtml(r.links) + "</div>" : "") +
        "</div>";
    }).join("");
    return '<div class="doc">' + kicker("View(research)", plain) + "<h2>Research</h2>" + diss +
      (items ? "<h3>Working papers and projects</h3>" + items : "") + "</div>";
  }

  function renderPublications(plain) {
    var pubs = list(S.publications);
    var body = pubs.length
      ? pubs.map(function (p) {
          return '<p class="apa">' + p.apa + "</p>" +
            (list(p.links).length ? '<div class="linkrow" style="margin-left:2em">' + linksHtml(p.links) + "</div>" : "");
        }).join("")
      : "<p>Publications will be listed here.</p>";
    return '<div class="doc">' + kicker("View(publications)", plain) + "<h2>Publications</h2>" + body + "</div>";
  }

  function renderMethods(plain) {
    var rows = list(S.methods).map(function (m) {
      return "<tr><td><strong>" + esc(m.area) + "</strong></td><td>" + m.detail + "</td></tr>";
    }).join("");
    var pk = list(S.packages).map(function (p) { return "<li>" + esc(p.name) + "</li>"; }).join("");
    return '<div class="doc">' + kicker("View(methods)", plain) + "<h2>Methods</h2>" +
      "<p>Energy politics raises causal questions that are hard to answer with simple comparisons. " +
      "These are the tools I use to make them answerable.</p>" +
      '<table class="rtable"><thead><tr><th>area</th><th>what I use</th></tr></thead><tbody>' + rows + "</tbody></table>" +
      (pk ? "<h3>Software I work in</h3><ul class=\"tags\">" + pk + "</ul>" : "") +
      (plain ? "" : '<p class="meta">See the Packages tab for notes on each tool.</p>') +
      "</div>";
  }

  function renderTeaching(plain) {
    var rows = list(S.teaching).map(function (t) {
      return "<tr><td>" + t.course + '<div class="meta">' + esc(t.role) + "</div></td><td class=\"mono\">" +
        esc(t.term) + "</td><td>" + esc(t.place) + "</td></tr>";
    }).join("");
    return '<div class="doc">' + kicker("View(teaching)", plain) + "<h2>Teaching</h2>" +
      '<table class="rtable"><thead><tr><th>course</th><th>term</th><th>institution</th></tr></thead><tbody>' +
      rows + "</tbody></table></div>";
  }

  function renderCV(plain) {
    var ed = list(S.education).map(function (e) {
      return "<tr><td>" + esc(e.degree) + "</td><td>" + esc(e.school) + "</td></tr>";
    }).join("");
    var aw = list(S.awards).map(function (a) { return "<li>" + a + "</li>"; }).join("");
    return '<div class="doc">' + kicker("View(cv)", plain) + "<h2>Curriculum Vitae</h2>" +
      '<div class="linkrow"><a href="' + esc(S.cvUrl || "files/cv.pdf") + '" target="_blank" rel="noopener">Download full CV (PDF)</a></div>' +
      (ed ? '<h3>Education</h3><table class="rtable"><tbody>' + ed + "</tbody></table>" : "") +
      (aw ? "<h3>Fellowships and awards</h3><ul>" + aw + "</ul>" : "") +
      "</div>";
  }

  function renderContact(plain) {
    return '<div class="doc">' + kicker("View(contact)", plain) + "<h2>Contact</h2>" +
      '<p>The best way to reach me is by email: <a href="mailto:' + esc(S.email) + '">' + esc(S.email) + "</a>.</p>" +
      (S.location ? "<p>" + esc(S.institution) + ", " + esc(S.location) + "</p>" : "") +
      '<div class="linkrow">' + linksHtml(S.links) + "</div></div>";
  }

  function renderNews(plain) {
    return '<div class="doc">' + kicker("View(news)", plain) + "<h2>News</h2><ul>" +
      list(S.news).map(function (n) {
        return '<li><span class="meta">' + esc(n.date) + "</span> &nbsp;" + n.text + "</li>";
      }).join("") + "</ul></div>";
  }

  /* Extra viewer tabs */
  function renderFiles() {
    var files = [{ name: "cv.pdf", url: S.cvUrl || "files/cv.pdf", note: "full curriculum vitae" }];
    list(S.research).concat(list(S.publications)).forEach(function (r) {
      list(r.links).forEach(function (l) {
        if (l.url && l.url !== "#") files.push({ name: l.label, url: l.url, note: trunc(strip(r.title || r.apa), 60) });
      });
    });
    return '<div class="doc"><p class="kicker">~/phd/files</p><h2>Files</h2><ul class="files-list">' +
      files.map(function (f) {
        return '<li><span class="ficon">&#9638;</span><a href="' + esc(f.url) + '" target="_blank" rel="noopener">' +
          esc(f.name) + '</a><span class="meta">' + esc(f.note) + "</span></li>";
      }).join("") + "</ul></div>";
  }

  function renderPackages() {
    return '<div class="doc"><p class="kicker">library()</p><h2>Packages</h2>' +
      "<p>The tools attached in this session, and what I use each one for.</p>" +
      '<ul class="pkg-list">' + list(S.packages).map(function (p) {
        return '<li><span class="box" aria-hidden="true">&#9745;</span><span class="pname">' + esc(p.name) +
          '</span><span class="pnote">' + esc(p.note) + "</span></li>";
      }).join("") + "</ul></div>";
  }

  var HELP = [
    ["about()", "who I am and what I study"],
    ["research()", "dissertation and working papers"],
    ["publications()", "published work, in APA style"],
    ["methods()", "the methods and tools I use"],
    ["teaching()", "courses I have taught"],
    ["cv()", "CV highlights and the full PDF"],
    ["contact()", "email and profiles"],
    ["ls()", "list everything in the environment"],
    ["View(x)", "open any object in the Viewer"],
    ["print(x) or x", "print an object in the console"],
    ["str(x), summary(x)", "describe an object"],
    ["plain()", "switch to a classic, printable page"],
    ["theme()", "switch between dark and light"],
    ["citation()", "how to cite this site"],
    ["clear()", "clear the console (or Ctrl+L)"]
  ];
  function renderHelp() {
    return '<div class="doc helpdoc"><p class="kicker">help(package = "energypolitics")</p><h2>Help</h2>' +
      "<p>You do not need to know R to use this site. Click any object in the Environment pane, " +
      "use the buttons under the console, or type one of these commands. " +
      "Up and down arrows recall earlier commands, and Tab completes names.</p><dl>" +
      HELP.map(function (h) { return "<dt>" + esc(h[0]) + "</dt><dd>" + esc(h[1]) + "</dd>"; }).join("") +
      "</dl><p>Prefer a regular page? <a href=\"#/plain\">Open the plain view</a>.</p></div>";
  }

  /* ---------------------------------------------------------------
     Viewer + Environment state
     --------------------------------------------------------------- */
  function setVTab(tab) {
    $$("[data-vtab]").forEach(function (b) {
      var on = b.getAttribute("data-vtab") === tab;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
  }

  function showTab(tab) {
    setVTab(tab);
    if (tab === "viewer") return openObj(current, { quiet: true });
    var html = tab === "files" ? renderFiles() : tab === "packages" ? renderPackages() : renderHelp();
    viewer.innerHTML = html;
    viewer.scrollTop = 0;
    viewerMeta.textContent = tab;
  }

  function openObj(name, opts) {
    opts = opts || {};
    var o = OBJ[name];
    if (!o) return;
    current = name;
    setVTab("viewer");
    viewer.innerHTML = o.render(false);
    viewer.scrollTop = 0;
    viewerMeta.textContent = name;
    statusObj.textContent = name;
    $$("#env-table tr").forEach(function (tr) { tr.classList.toggle("active", tr.getAttribute("data-obj") === name); });
    var hash = name === "about" ? "" : "#/" + name;
    if (location.hash !== hash && !(hash === "" && !location.hash)) {
      history_replace(hash || location.pathname + location.search);
    }
    if (opts.scroll && isNarrow()) $(".pane-viewer").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  function history_replace(h) {
    try { window.history.replaceState(null, "", h); } catch (e) { /* file:// or sandbox */ }
  }

  function buildEnv() {
    var tb = $("#env-table tbody");
    tb.innerHTML = ORDER.map(function (k) {
      var o = OBJ[k];
      return '<tr data-obj="' + k + '"><td class="name"><span class="env-icon ' + o.kind + '" aria-hidden="true"></span>' +
        '<button type="button" aria-label="Open ' + k + '">' + k + "</button></td>" +
        '<td class="type">' + esc(o.type()) + "</td>" +
        '<td class="val" title="' + esc(strip(o.value())) + '">' + esc(strip(o.value())) + "</td></tr>";
    }).join("");
    $$("#env-table tr").forEach(function (tr) {
      tr.addEventListener("click", function () { run("View(" + tr.getAttribute("data-obj") + ")", { scroll: true }); });
    });
  }

  function renderHistory() {
    $("#history-list").innerHTML = history.map(function (h) { return "<li>" + esc(h) + "</li>"; }).join("");
    $$("#history-list li").forEach(function (li) {
      li.addEventListener("click", function () { input.value = li.textContent; input.focus(); });
    });
  }

  /* ---------------------------------------------------------------
     Console output
     --------------------------------------------------------------- */
  function print(html, cls) {
    var div = document.createElement("div");
    div.className = "line " + (cls || "out");
    div.innerHTML = html;
    out.appendChild(div);
    consoleEl.scrollTop = consoleEl.scrollHeight;
    return div;
  }
  function echo(cmd) { print(esc(cmd), "cmd"); }
  function clear() { out.innerHTML = ""; }

  function cmdLink(cmd) {
    return '<button type="button" class="inline-cmd" data-cmd="' + esc(cmd) + '">' + esc(cmd) + "</button>";
  }

  /* ---------------------------------------------------------------
     Command interpreter (a tiny, forgiving subset of R)
     --------------------------------------------------------------- */
  var FUNS = ["about", "research", "publications", "pubs", "methods", "teaching", "cv", "contact", "news",
    "help", "ls", "View", "print", "str", "summary", "head", "clear", "plain", "theme", "citation",
    "sessionInfo", "library", "require", "install.packages", "Sys.time", "date", "q", "quit", "history",
    "getwd", "whoami", "email"];

  function parseArgs(s) {
    var args = [], cur = "", depth = 0, q = null;
    for (var i = 0; i < s.length; i++) {
      var ch = s[i];
      if (q) { if (ch === q) q = null; cur += ch; continue; }
      if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; }
      if (ch === "(") depth++;
      if (ch === ")") depth--;
      if (ch === "," && depth === 0) { args.push(cur.trim()); cur = ""; continue; }
      cur += ch;
    }
    if (cur.trim()) args.push(cur.trim());
    return args.map(function (a) {
      var kv = a.match(/^([\w.]+)\s*=\s*(.+)$/);
      if (kv) a = kv[2];
      return a.replace(/^["'](.*)["']$/, "$1");
    });
  }

  function notFound(name) {
    var guess = ORDER.concat(FUNS).filter(function (n) {
      return n.toLowerCase().indexOf(name.toLowerCase().slice(0, 3)) === 0;
    })[0];
    print("Error: object '" + esc(name) + "' not found" +
      (guess ? '\n<span class="note">Did you mean </span>' + cmdLink(OBJ[guess] ? guess + "()" : guess + "()") + '<span class="note">?</span>' : ""),
      "err");
  }

  function section(name, opts) {
    print(OBJ[name].print());
    print('<span class="note"># opened in Viewer →</span>', "note");
    openObj(name, opts);
  }

  function exec(raw, opts) {
    var cmd = raw.trim().replace(/;+$/, "");
    if (!cmd) return;
    if (/^#/.test(cmd)) return;

    if (/^\?{1,2}\s*[\w.]+$/.test(cmd)) { cmd = "help(" + cmd.replace(/^\?+\s*/, "") + ")"; }
    if (/<-|->|^[\w.]+\s*=[^=]/.test(cmd)) {
      print('<span class="note"># This workspace is read only, but I like the instinct.</span>', "note");
      return;
    }

    var m = cmd.match(/^([\w.]+)\s*\(([\s\S]*)\)$/);
    if (!m) {
      if (/^[\w.]+$/.test(cmd)) {
        if (OBJ[cmd]) return print(OBJ[cmd].print());
        if (FUNS.indexOf(cmd) >= 0) {
          return print('<span class="note"># ' + esc(cmd) + " is a function. Try </span>" + cmdLink(cmd + "()"), "note");
        }
        return notFound(cmd);
      }
      return print("Error: unexpected symbol in \"" + esc(trunc(cmd, 40)) + "\"", "err");
    }

    var fn = m[1], args = parseArgs(m[2]), a0 = args[0];

    switch (fn) {
      case "about": case "whoami": return section("about", opts);
      case "research": return section("research", opts);
      case "publications": case "pubs": return section("publications", opts);
      case "methods": return section("methods", opts);
      case "teaching": return section("teaching", opts);
      case "cv": return section("cv", opts);
      case "contact": case "email": return section("contact", opts);
      case "news":
        if (OBJ.news) return section("news", opts);
        return notFound("news");

      case "View":
        if (!a0) return print("Error in View(): argument \"x\" is missing, with no default", "err");
        if (!OBJ[a0]) return notFound(a0);
        openObj(a0, opts);
        return;

      case "print": case "head":
        if (!a0) return print("Error: argument \"x\" is missing, with no default", "err");
        if (!OBJ[a0]) return notFound(a0);
        return print(OBJ[a0].print());

      case "str":
        if (!OBJ[a0]) return notFound(a0 || "x");
        return print(esc(OBJ[a0].type()) + " : " + esc(trunc(strip(OBJ[a0].value()), 60)));

      case "summary":
        if (!OBJ[a0]) return notFound(a0 || "x");
        return print('<span class="note">   Length  Class   Mode</span>\n' + esc(pad(a0, 10)) + " " +
          esc(OBJ[a0].type()) + "\n" + '<span class="note"># View(' + esc(a0) + ") for the readable version</span>");

      case "ls": case "objects":
        return print(chrvec(ORDER));

      case "help":
        if (a0 && OBJ[a0]) {
          print('<span class="note"># help for ' + esc(a0) + ": opening it in the Viewer</span>", "note");
          return openObj(a0, opts);
        }
        print("Commands you can run (or just click an object on the right):\n" +
          HELP.slice(0, 8).map(function (h) { return "  " + cmdLink(h[0].split(" ")[0]) + '<span class="note">  ' + esc(h[1]) + "</span>"; }).join("\n") +
          '\n<span class="note">  full list in the Help tab →</span>');
        return showTab("help");

      case "clear": return clear();
      case "cat":
        if (/\\014/.test(m[2])) return clear();
        return print(esc(a0 || ""));

      case "plain": return setPlain(true);
      case "q": case "quit":
        print("Save workspace image? [y/n/c]: n", "out");
        print('<span class="note"># Switching to the plain view. Click "back to console" to return.</span>', "note");
        return setTimeout(function () { setPlain(true); }, reduceMotion ? 0 : 500);

      case "theme": {
        var next = a0 === "light" || a0 === "dark" ? a0 : (document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
        setTheme(next);
        return print('<span class="note"># theme set to "' + next + '"</span>', "note");
      }

      case "citation": {
        var y = new Date().getFullYear();
        return print("To cite this website in APA style:\n\n  " +
          esc(strip(S.name)) + " (" + y + "). <em>" + esc(strip(S.name)) + ": Academic website</em>. " +
          esc(location.origin === "null" ? "[URL]" : location.origin + location.pathname));
      }

      case "sessionInfo":
        return print("R session, energy politics edition\nPlatform: political-science/energy\n\n" +
          '<span class="note">attached packages:</span>\n' + chrvec(list(S.packages).map(function (p) { return p.name; })));

      case "library": case "require": {
        if (!a0) return print(chrvec(list(S.packages).map(function (p) { return p.name; })));
        var hit = list(S.packages).filter(function (p) { return p.name.toLowerCase() === a0.toLowerCase(); })[0];
        if (hit) return print('<span class="ok">✔</span> ' + esc(hit.name) + ' is attached <span class="note"># ' + esc(hit.note) + "</span>");
        if (a0 === "energypolitics") return print('<span class="note"># already loaded</span>', "note");
        return print("Error in library(" + esc(a0) + "): there is no package called ‘" + esc(a0) + "’", "err");
      }

      case "install.packages":
        return print('<span class="note"># Everything this session needs is already installed. See the Packages tab.</span>', "note");

      case "Sys.time": case "date":
        return print("[1] " + rstr(new Date().toString().replace(/ \(.+\)$/, "")));

      case "getwd": return print("[1] " + rstr("~/phd/" + strip(S.shortName || "")));
      case "setwd": return print('<span class="note"># Staying right here.</span>', "note");

      case "history":
        switchEnvTab("history");
        return print('<span class="note"># see the History tab</span>', "note");

      default:
        print("Error in " + esc(fn) + "(): could not find function \"" + esc(fn) + "\"", "err");
        print('<span class="note"># type </span>' + cmdLink("help()") + '<span class="note"> to see what this console understands</span>', "note");
    }
  }

  function run(cmd, opts) {
    echo(cmd);
    history.push(cmd);
    histIdx = history.length;
    renderHistory();
    try { exec(cmd, opts || {}); }
    catch (e) { print("Error: something went wrong running that command", "err"); }
  }

  /* ---------------------------------------------------------------
     Input handling
     --------------------------------------------------------------- */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var v = input.value;
    input.value = "";
    if (!v.trim()) { echo(""); return; }
    run(v, { scroll: false });
  });

  input.addEventListener("keydown", function (e) {
    if (e.key === "ArrowUp") {
      if (histIdx > 0) { histIdx--; input.value = history[histIdx]; }
      e.preventDefault();
    } else if (e.key === "ArrowDown") {
      if (histIdx < history.length - 1) { histIdx++; input.value = history[histIdx]; }
      else { histIdx = history.length; input.value = ""; }
      e.preventDefault();
    } else if (e.key === "Tab") {
      var v = input.value;
      var mm = v.match(/([\w.]*)$/);
      var stem = mm ? mm[1] : "";
      if (!stem) return;
      var opts = ORDER.concat(FUNS).filter(function (n, i, a) { return n.indexOf(stem) === 0 && a.indexOf(n) === i; });
      e.preventDefault();
      if (opts.length === 1) {
        var before = v.slice(0, v.length - stem.length);
        var isFn = FUNS.indexOf(opts[0]) >= 0 && !/\($/.test(before);
        input.value = before + opts[0] + (isFn ? "()" : "");
      } else if (opts.length > 1) {
        echo(v);
        print(esc(opts.join("   ")), "note");
      }
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault(); clear();
    }
  });

  consoleEl.addEventListener("click", function (e) {
    if (window.getSelection && String(window.getSelection())) return;
    if (e.target.closest("a, button")) return;
    input.focus({ preventScroll: true });
  });

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-cmd]");
    if (!b) return;
    e.preventDefault();
    finishIntro();
    run(b.getAttribute("data-cmd"), { scroll: true });
  });

  $$("[data-vtab]").forEach(function (b) {
    b.addEventListener("click", function () { showTab(b.getAttribute("data-vtab")); });
  });

  function switchEnvTab(t) {
    $$("[data-envtab]").forEach(function (b) {
      var on = b.getAttribute("data-envtab") === t;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    $("#env-body").classList.toggle("hidden", t !== "env");
    $("#history-body").classList.toggle("hidden", t !== "history");
  }
  $$("[data-envtab]").forEach(function (b) {
    b.addEventListener("click", function () { switchEnvTab(b.getAttribute("data-envtab")); });
  });

  /* ---------------------------------------------------------------
     Theme + plain view
     --------------------------------------------------------------- */
  function setTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem("theme", t); } catch (e) { /* storage blocked */ }
  }

  function buildPlain() {
    var nav = ORDER.map(function (k) {
      return '<a href="#sec-' + k + '" data-jump="' + k + '">' + k + "</a>";
    }).join("");
    $("#plain").innerHTML =
      '<div class="plain-top"><nav aria-label="Sections">' + nav + "</nav>" +
      '<button type="button" class="tb-btn" data-theme-toggle>theme</button>' +
      '<button type="button" class="tb-btn tb-primary" data-back>&#8592; back to console</button></div>' +
      '<div class="plain-inner">' +
      ORDER.map(function (k) { return '<section id="sec-' + k + '">' + OBJ[k].render(true) + "</section>"; }).join("") +
      "</div>";
    $("#plain [data-back]").addEventListener("click", function () { setPlain(false); });
    $("#plain [data-theme-toggle]").addEventListener("click", function () {
      setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
    $$("#plain [data-jump]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var el = document.getElementById("sec-" + a.getAttribute("data-jump"));
        if (el) el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      });
    });
  }

  function setPlain(on) {
    $("#ide").classList.toggle("hidden", on);
    $("#plain").classList.toggle("hidden", !on);
    if (on) {
      history_replace("#/plain");
      window.scrollTo(0, 0);
    } else {
      history_replace(current === "about" ? location.pathname + location.search : "#/" + current);
      openObj(current, { quiet: true });
    }
  }

  /* ---------------------------------------------------------------
     Startup
     --------------------------------------------------------------- */
  var introTimer = null, introQueue = [];

  function banner() {
    print('<span class="banner"><b>R</b> session &middot; energy politics edition &middot; "Load Following"\n' +
      "Platform: political-science/energy\n\n" +
      "This console is the menu for my academic website.\n" +
      "Click any object in the <b>Environment</b> pane, use the buttons below,\n" +
      "or type a command. New to R? Type " + cmdLink("help()") + ".</span>", "banner");
    print("", "out");
  }

  function startupOutput() {
    print('<span class="note">Loading required package: grid</span>', "note");
    print('<span class="ok">✔</span> research agenda loaded    <span class="ok">✔</span> methods toolkit attached (' +
      list(S.packages).length + " packages)", "out");
  }

  function whoamiOutput() {
    print("<b>" + esc(strip(S.name)) + "</b>\n" + esc(S.role) + " · " + esc(S.institution) + "\n" +
      '<span class="note">' + esc(strip(S.tagline)) + "</span>", "out");
  }

  function typeLine(text, done) {
    var div = print("", "cmd");
    if (reduceMotion) { div.textContent = text; return done(); }
    var i = 0;
    (function tick() {
      div.textContent = text.slice(0, ++i);
      if (i < text.length) introTimer = setTimeout(tick, 32);
      else introTimer = setTimeout(done, 220);
    })();
  }

  function finishIntro() {
    if (!introQueue.length) return;
    clearTimeout(introTimer);
    clear();
    banner();
    echo("library(energypolitics)"); startupOutput();
    echo("whoami()"); whoamiOutput();
    introQueue = [];
  }

  function intro() {
    banner();
    introQueue = [
      function (next) { typeLine("library(energypolitics)", function () { startupOutput(); next(); }); },
      function (next) { typeLine("whoami()", function () { whoamiOutput(); next(); }); }
    ];
    (function step() {
      var f = introQueue.shift();
      if (f) return f(step);
      if (!isNarrow()) input.focus({ preventScroll: true });
    })();
  }

  function routeFromHash() {
    var h = (location.hash || "").replace(/^#\/?/, "");
    if (h === "plain") { setPlain(true); return; }
    if (OBJ[h]) { current = h; }
  }

  function init() {
    try {
      var saved = localStorage.getItem("theme");
      if (saved === "light" || saved === "dark") document.documentElement.setAttribute("data-theme", saved);
    } catch (e) { /* storage blocked */ }

    var who = strip(S.name);
    document.title = who + " | " + S.role;
    $("#title-path").textContent = "~/phd/" + strip(S.shortName || "") + "  ·  " + who;
    $("#console-meta").innerHTML = "R 4.5 &middot; ~/phd/";

    buildEnv();
    buildPlain();
    routeFromHash();
    openObj(current, { quiet: true });
    intro();

    input.addEventListener("keydown", finishIntro);
    window.addEventListener("hashchange", function () {
      var h = (location.hash || "").replace(/^#\/?/, "");
      if (h === "plain") setPlain(true);
      else if (OBJ[h]) { if (!$("#plain").classList.contains("hidden")) setPlain(false); openObj(h); }
    });
  }

  init();
})();
