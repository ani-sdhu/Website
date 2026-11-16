/* app.js: builds the page from content.js and runs the optional R console. */
(function () {
  "use strict";

  var S = window.SITE || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- helpers ---------------- */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function strip(html) { var d = document.createElement("div"); d.innerHTML = String(html == null ? "" : html); return d.textContent || ""; }
  function list(a) { return Array.isArray(a) ? a : []; }
  function trunc(s, n) { s = String(s); return s.length > n ? s.slice(0, n - 1) + "…" : s; }
  function pad(s, n) { s = String(s); return s + new Array(Math.max(0, n - s.length) + 1).join(" "); }
  function isExt(u) { return /^https?:/.test(u || ""); }
  function a(url, label, cls) {
    return '<a' + (cls ? ' class="' + cls + '"' : "") + ' href="' + esc(url) + '"' +
      (isExt(url) || /\.pdf$/i.test(url || "") ? ' target="_blank" rel="noopener"' : "") + ">" + label + "</a>";
  }
  function linkRow(links) {
    links = list(links);
    return links.length ? '<div class="links">' + links.map(function (l) { return a(l.url, esc(l.label)); }).join("") + "</div>" : "";
  }
  var cvUrl = S.cvUrl || "files/cv.pdf";

  /* ---------------- sections (the "objects") ---------------- */
  var SECTIONS = [
    { id: "about", label: "about", kind: "list", type: "list [5]" },
    { id: "research", label: "research", kind: "df", type: "data.frame", dims: list(S.research).length + " obs. of 4 variables" },
    { id: "publications", label: "publications", kind: "df", type: "tibble", dims: list(S.publications).length + " × 2" },
    { id: "methods", label: "methods", kind: "chr", type: "chr [" + list(S.methods).length + "]" },
    { id: "teaching", label: "teaching", kind: "df", type: "data.frame", dims: list(S.teaching).length + " obs. of 4 variables" },
    { id: "cv", label: "cv", kind: "chr", type: "pdf" },
    { id: "contact", label: "contact", kind: "list", type: "list [" + (1 + list(S.links).length) + "]" }
  ];
  var IDS = SECTIONS.map(function (s) { return s.id; });
  function sec(id) { return SECTIONS.filter(function (s) { return s.id === id; })[0]; }

  function paneHead(id, extraMeta) {
    var s = sec(id);
    return '<div class="pane-tabs"><span class="pane-tab active">' + esc(s.label) + "</span>" +
      '<span class="pane-meta">' + esc(extraMeta || (s.type + (s.dims ? " · " + s.dims : ""))) + "</span></div>";
  }

  /* ---------------- render ---------------- */
  function renderHero() {
    var img = S.photo ? '<img src="' + esc(S.photo) + '" alt="Portrait of ' + esc(strip(S.name)) + '">' : "";
    var links = list(S.links).filter(function (l) { return !/cv/i.test(l.label); });
    var buttons = a(cvUrl, "↓ CV (PDF)", "btn primary") +
      links.map(function (l) { return a(l.url, esc(l.label), "btn"); }).join("");

    var env = SECTIONS.map(function (s) {
      return '<tr><td class="name"><a href="#' + s.id + '"><span class="env-icon k-' + s.kind + '" aria-hidden="true"></span>' +
        esc(s.label) + '</a></td><td class="type"><a href="#' + s.id + '" tabindex="-1" aria-hidden="true">' +
        esc(s.type) + "</a></td></tr>";
    }).join("");

    var news = list(S.news);
    var hist = news.length
      ? '<ul class="history">' + news.map(function (n) {
          return '<li><span class="meta">' + esc(n.date) + "</span>" + n.text + "</li>";
        }).join("") + "</ul>"
      : '<p class="meta" style="padding:12px 14px;margin:0">No news yet.</p>';

    return '<div class="grid hero">' +
      '<section class="pane hero-main" id="about" aria-labelledby="about-h">' + paneHead("about", "list [5] · " + strip(S.institution)) +
      '<div class="pane-body">' +
      '<p class="kicker">whoami()</p>' +
      '<div class="id">' + img + "<div>" +
      '<h1 id="about-h">' + esc(S.name) + "</h1>" +
      '<p class="role">' + esc(S.role) + " · " + esc(S.institution) + (S.pronouns ? " · " + esc(S.pronouns) : "") + "</p>" +
      "</div></div>" +
      '<p class="lede">' + S.tagline + "</p>" +
      list(S.bio).map(function (p) { return "<p>" + p + "</p>"; }).join("") +
      '<h3 class="sub-h">interests</h3><ul class="tags">' +
      list(S.interests).map(function (t) { return '<li class="str-tag">' + esc(t) + "</li>"; }).join("") + "</ul>" +
      '<div class="buttons">' + buttons + "</div>" +
      "</div></section>" +

      '<aside class="side" aria-label="Site overview">' +
      '<section class="pane" aria-label="Environment">' +
      '<div class="pane-tabs" role="tablist">' +
      '<button type="button" class="pane-tab active" role="tab" aria-selected="true" data-tab="env">Environment</button>' +
      '<button type="button" class="pane-tab" role="tab" aria-selected="false" data-tab="hist">History' + (news.length ? " (" + news.length + ")" : "") + "</button>" +
      '<span class="pane-meta">Global Environment</span></div>' +
      '<div data-panel="env"><div class="env-group">Values: click to jump</div><table class="env"><tbody>' + env + "</tbody></table></div>" +
      '<div data-panel="hist" hidden>' + hist + "</div>" +
      "</section>" +

      '<section class="mini-console" aria-label="Console preview">' +
      '<div class="pane-tabs"><span class="pane-tab active">Console</span><span class="pane-meta">~/phd/</span></div>' +
      '<div class="mini-body">' +
      '<span class="c">library(energypolitics)</span>\n' +
      '<span class="dim">Loading required package: grid</span>\n' +
      '<span class="ok">✔</span> research agenda loaded\n' +
      '<span class="ok">✔</span> methods toolkit attached (' + list(S.packages).length + " packages)" +
      "</div>" +
      '<button type="button" class="mini-open" data-open-console><span class="p">&gt;</span> type a command, e.g. research() <span class="cursor" aria-hidden="true"></span></button>' +
      "</section>" +
      "</aside></div>";
  }

  function renderResearch() {
    var d = S.dissertation || {};
    var diss = d.title
      ? '<div class="card"><div class="top"><span class="status alt">dissertation</span></div>' +
        "<h3>" + d.title + "</h3><p>" + (d.summary || "") + "</p>" +
        (d.committee ? '<p class="meta">committee: ' + d.committee + "</p>" : "") + "</div>"
      : "";
    var items = list(S.research).map(function (r) {
      return '<div class="card"><div class="top"><span class="status">' + esc(r.status) + "</span>" +
        (r.method ? '<span class="meta">' + esc(r.method) + "</span>" : "") + "</div>" +
        "<h3>" + r.title + "</h3>" +
        (r.coauthors ? '<p class="meta">' + r.coauthors + "</p>" : "") +
        "<p>" + (r.abstract || "") + "</p>" + linkRow(r.links) + "</div>";
    }).join("");
    return '<section class="pane" id="research" aria-labelledby="research-h">' + paneHead("research") +
      '<div class="pane-body"><p class="kicker">View(research)</p><h2 id="research-h">Research</h2>' +
      diss + (items ? '<h3 class="sub-h">working papers and projects</h3>' + items : "") + "</div></section>";
  }

  function renderPublications() {
    var pubs = list(S.publications);
    var body = pubs.length
      ? '<ol class="pubs">' + pubs.map(function (p, i) {
          return '<li><span class="idx">[' + (i + 1) + "]</span><div>" + p.apa + linkRow(p.links) + "</div></li>";
        }).join("") + "</ol>"
      : '<p class="note">Publications will appear here.</p>';
    return '<section class="pane" id="publications" aria-labelledby="pubs-h">' + paneHead("publications") +
      '<div class="pane-body"><p class="kicker">print(publications)</p><h2 id="pubs-h">Publications</h2>' + body + "</div></section>";
  }

  function renderMethods() {
    var rows = list(S.methods).map(function (m, i) {
      return '<tr><td class="row">' + (i + 1) + "</td><td><strong>" + esc(m.area) + '</strong><span class="detail">' + m.detail + "</span></td></tr>";
    }).join("");
    var pk = list(S.packages).map(function (p) {
      return '<li><span class="box" aria-hidden="true">☑</span><span>' + esc(p.name) + '</span><span class="pnote">' + esc(p.note) + "</span></li>";
    }).join("");
    return '<section class="pane" id="methods" aria-labelledby="methods-h">' + paneHead("methods") +
      '<div class="pane-body"><p class="kicker">summary(methods)</p><h2 id="methods-h">Methods</h2>' +
      '<p class="note">Questions about energy politics are often causal and hard to answer with simple comparisons. These are the tools I use to answer them.</p>' +
      '<div class="methods-grid"><div><h3 class="sub-h">approaches</h3><div class="df-wrap"><table class="df"><tbody>' + rows + "</tbody></table></div></div>" +
      '<div><h3 class="sub-h">library()</h3><ul class="pkgs">' + pk + "</ul></div></div>" +
      "</div></section>";
  }

  function renderTeaching() {
    var rows = list(S.teaching).map(function (t, i) {
      return '<tr><td class="row">' + (i + 1) + "</td><td>" + t.course + '<span class="meta">' + esc(t.role) + '</span><span class="meta m-only">' + esc(t.term) + " \u00b7 " + esc(t.place) + "</span></td>" +
        '<td class="mono d-only">' + esc(t.term) + '</td><td class="d-only">' + esc(t.place) + "</td></tr>";
    }).join("");
    return '<section class="pane" id="teaching" aria-labelledby="teaching-h">' + paneHead("teaching") +
      '<div class="pane-body"><p class="kicker">head(teaching)</p><h2 id="teaching-h">Teaching</h2>' +
      '<div class="df-wrap"><table class="df"><thead><tr><th></th><th>course</th><th class="d-only">term</th><th class="d-only">institution</th></tr></thead><tbody>' +
      rows + "</tbody></table></div></div></section>";
  }

  function renderCV() {
    var ed = list(S.education).map(function (e) {
      return "<tr><td>" + esc(e.degree) + '<span class="meta">' + esc(e.school) + "</span></td></tr>";
    }).join("");
    var aw = list(S.awards).map(function (x) { return "<li>" + x + "</li>"; }).join("");
    return '<section class="pane" id="cv" aria-labelledby="cv-h">' + paneHead("cv", "pdf · " + cvUrl) +
      '<div class="pane-body"><p class="kicker">cv()</p><h2 id="cv-h">CV</h2>' +
      (ed ? '<h3 class="sub-h">education</h3><table class="df"><tbody>' + ed + "</tbody></table>" : "") +
      (aw ? '<h3 class="sub-h">fellowships and awards</h3><ul class="plain-list">' + aw + "</ul>" : "") +
      '<div class="buttons">' + a(cvUrl, "↓ Download full CV", "btn primary") + "</div></div></section>";
  }

  function renderContact() {
    var rows = '<div><dt>$email</dt><dd><a href="mailto:' + esc(S.email) + '">' + esc(S.email) + "</a></dd></div>" +
      list(S.links).filter(function (l) { return !/^mailto:|\.pdf$/i.test(l.url); }).map(function (l) {
        var key = "$" + l.label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
        return "<div><dt>" + esc(key) + "</dt><dd>" + a(l.url, esc(l.label)) + "</dd></div>";
      }).join("") +
      (S.location ? "<div><dt>$office</dt><dd>" + esc(S.institution) + ", " + esc(S.location) + "</dd></div>" : "");
    return '<section class="pane" id="contact" aria-labelledby="contact-h">' + paneHead("contact") +
      '<div class="pane-body"><p class="kicker">contact()</p><h2 id="contact-h">Contact</h2>' +
      '<p class="note">Email is the best way to reach me.</p><dl class="rlist">' + rows + "</dl></div></section>";
  }

  function render() {
    $("#main").innerHTML = '<div class="wrap grid">' +
      renderHero() + renderResearch() + renderPublications() + renderMethods() + renderTeaching() +
      '<div class="two">' + renderCV() + renderContact() + "</div></div>";

    $("#nav").innerHTML = SECTIONS.map(function (s) { return '<a href="#' + s.id + '" data-nav="' + s.id + '">' + s.label + "</a>"; }).join("");
    $("#brand-name").textContent = strip(S.name);
    $("#footer-copy").textContent = "© " + new Date().getFullYear() + " " + strip(S.name);
    document.title = strip(S.name) + " | " + S.role;

    // Environment / History tabs
    $$("[data-tab]").forEach(function (b) {
      b.addEventListener("click", function () {
        var t = b.getAttribute("data-tab");
        $$("[data-tab]").forEach(function (x) {
          var on = x === b; x.classList.toggle("active", on); x.setAttribute("aria-selected", on ? "true" : "false");
        });
        $$("[data-panel]").forEach(function (p) { p.hidden = p.getAttribute("data-panel") !== t; });
      });
    });
  }

  /* ---------------- active nav while scrolling ---------------- */
  function watchSections() {
    var links = {}, nav = $("#nav"), pinned = null, pinTimer = null;
    $$("[data-nav]").forEach(function (l) {
      links[l.getAttribute("data-nav")] = l;
      l.addEventListener("click", function () {
        pinned = l.getAttribute("data-nav"); setActive(pinned);
        clearTimeout(pinTimer); pinTimer = setTimeout(function () { pinned = null; }, 1200);
      });
    });
    function setActive(id) {
      IDS.forEach(function (k) { if (links[k]) links[k].classList.toggle("active", k === id); });
      var el = links[id];
      if (el && nav.scrollWidth > nav.clientWidth) nav.scrollLeft = el.offsetLeft - nav.clientWidth / 2 + el.clientWidth / 2;
    }
    function update() {
      if (pinned) return;
      var line = $(".topbar").offsetHeight + 24, cur = IDS[0];
      IDS.forEach(function (id) {
        var el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) cur = id;
      });
      setActive(cur);
    }
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () { ticking = false; update(); });
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---------------- theme ---------------- */
  function setTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem("theme", t); } catch (e) { /* storage blocked */ }
  }
  function toggleTheme() { setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark"); }

  /* =========================================================
     Optional R console
     ========================================================= */
  var cEl = $("#console"), out = $("#console-out"), input = $("#console-input"), scroller = $("#console-scroll");
  var hist = [], hIdx = 0, greeted = false;

  function print(html, cls) {
    var d = document.createElement("div");
    d.className = cls || "out"; d.innerHTML = html;
    out.appendChild(d); scroller.scrollTop = scroller.scrollHeight;
  }
  function echo(c) { print(esc(c), "cmd"); }
  function go(cmd) { return '<button type="button" class="go" data-run="' + esc(cmd) + '">' + esc(cmd) + "</button>"; }
  function rstr(s) { return '<span class="str">"' + esc(strip(s)) + '"</span>'; }

  function chrvec(arr) {
    var lines = [], line = "", idx = 1, width = window.innerWidth < 720 ? 38 : 72;
    arr.forEach(function (x, i) {
      var it = '"' + strip(x) + '"', tag = "[" + idx + "] ";
      if (!line) line = tag;
      if ((line + it).length > width && line !== tag) { lines.push(line.trim()); idx = i + 1; line = "[" + idx + "] "; }
      line += it + " ";
    });
    if (line) lines.push(line.trim());
    return esc(lines.join("\n")).replace(/&quot;([^&]*)&quot;/g, '<span class="str">"$1"</span>');
  }
  function frame(rows, cols) {
    if (!rows.length) return '<span class="dim"># 0 rows</span>';
    var max = window.innerWidth < 720 ? 18 : 32;
    var cells = rows.map(function (r) { return cols.map(function (c) { return trunc(strip(r[c] || ""), max); }); });
    var w = cols.map(function (c, i) { return Math.max(c.length, Math.max.apply(null, cells.map(function (r) { return r[i].length; }))); });
    var head = "  " + cols.map(function (c, i) { return pad(c, w[i]); }).join("  ");
    var body = cells.map(function (r, k) { return (k + 1) + " " + r.map(function (v, i) { return pad(v, w[i]); }).join("  "); });
    return esc(head + "\n" + body.join("\n"));
  }

  var PRINT = {
    about: function () {
      return ["name", "role", "institution"].map(function (k) { return '<span class="hl">$' + k + "</span>\n[1] " + rstr(S[k]); }).join("\n\n");
    },
    research: function () { return frame(list(S.research), ["title", "status", "method"]); },
    publications: function () { return list(S.publications).map(function (p, i) { return "[" + (i + 1) + "] " + esc(trunc(strip(p.apa), 90)); }).join("\n"); },
    methods: function () { return chrvec(list(S.methods).map(function (m) { return m.area; })); },
    teaching: function () { return frame(list(S.teaching), ["course", "term"]); },
    cv: function () { return "[1] " + rstr(cvUrl); },
    contact: function () { return '<span class="hl">$email</span>\n[1] ' + rstr(S.email); }
  };

  var HELP = [
    ["about()", "who I am"], ["research()", "dissertation and papers"], ["publications()", "published work"],
    ["methods()", "methods and tools"], ["teaching()", "courses"], ["cv()", "download my CV"],
    ["contact()", "how to reach me"], ["ls()", "list everything"], ["theme()", "light or dark"], ["clear()", "clear this console"]
  ];
  var FUNS = IDS.concat(["help", "ls", "View", "print", "str", "summary", "head", "clear", "theme", "library", "citation", "sessionInfo", "q", "quit", "pubs", "whoami"]);

  function jump(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
    try { history.replaceState(null, "", "#" + id); } catch (e) { /* ignore */ }
  }
  function showSection(id) {
    print(PRINT[id]());
    print('<span class="dim"># scrolled to ' + id + " ↑</span>", "dim");
    jump(id);
  }
  function notFound(name) {
    var guess = FUNS.filter(function (n) { return n.toLowerCase().indexOf(name.toLowerCase().slice(0, 3)) === 0; })[0];
    print("Error: object '" + esc(name) + "' not found" + (guess ? '\n<span class="dim">Did you mean </span>' + go(guess + "()") + '<span class="dim">?</span>' : ""), "err");
  }

  function exec(raw) {
    var cmd = raw.trim().replace(/;+$/, "");
    if (!cmd || /^#/.test(cmd)) return;
    if (/^\?+\s*[\w.]+$/.test(cmd)) cmd = "help()";
    if (/<-|->/.test(cmd)) return print('<span class="dim"># This workspace is read only, but I like the instinct.</span>', "dim");

    var m = cmd.match(/^([\w.]+)\s*\(\s*["']?([\w.]*)["']?\s*\)$/);
    if (!m) {
      if (/^[\w.]+$/.test(cmd)) {
        if (PRINT[cmd]) return print(PRINT[cmd]());
        return notFound(cmd);
      }
      return print('Error: unexpected symbol in "' + esc(trunc(cmd, 40)) + '"', "err");
    }
    var fn = m[1], arg = m[2];

    if (IDS.indexOf(fn) >= 0) {
      if (fn === "cv") { print("[1] " + rstr(cvUrl) + '\n<span class="dim"># </span><a href="' + esc(cvUrl) + '" target="_blank" rel="noopener">open the PDF</a>'); return jump("cv"); }
      return showSection(fn);
    }
    switch (fn) {
      case "pubs": return showSection("publications");
      case "whoami": return showSection("about");
      case "View": case "print": case "head": case "str": case "summary":
        if (!arg) return print("Error: argument \"x\" is missing, with no default", "err");
        if (IDS.indexOf(arg) < 0) return notFound(arg);
        return showSection(arg);
      case "ls": case "objects": return print(chrvec(IDS));
      case "help":
        return print("You can scroll the page or click the menu at the top. Or type one of these:\n" +
          HELP.map(function (h) { return "  " + go(h[0]) + '<span class="dim">  ' + esc(h[1]) + "</span>"; }).join("\n"));
      case "clear": out.innerHTML = ""; return;
      case "theme":
        if (arg === "light" || arg === "dark") setTheme(arg); else toggleTheme();
        return print('<span class="dim"># theme set to "' + document.documentElement.getAttribute("data-theme") + '"</span>', "dim");
      case "library": {
        if (!arg) return print(chrvec(list(S.packages).map(function (p) { return p.name; })));
        var hit = list(S.packages).filter(function (p) { return p.name.toLowerCase() === arg.toLowerCase(); })[0];
        if (hit) return print('<span class="ok">✔</span> ' + esc(hit.name) + ' is attached <span class="dim"># ' + esc(hit.note) + "</span>");
        if (arg === "energypolitics") return print('<span class="dim"># already loaded</span>', "dim");
        return print("Error in library(" + esc(arg) + "): there is no package called ‘" + esc(arg) + "’", "err");
      }
      case "citation":
        return print("To cite this site in APA style:\n\n  " + esc(strip(S.name)) + " (" + new Date().getFullYear() + "). <em>" +
          esc(strip(S.name)) + "</em> [Personal academic website]. " + esc(location.protocol === "file:" ? "[URL]" : location.origin + location.pathname));
      case "sessionInfo":
        return print("R session, energy politics edition\nPlatform: political-science/energy\n\n" + '<span class="dim">attached packages:</span>\n' +
          chrvec(list(S.packages).map(function (p) { return p.name; })));
      case "q": case "quit":
        print("Save workspace image? [y/n/c]: n", "out");
        return setTimeout(closeConsole, reduceMotion ? 0 : 400);
      default:
        print("Error in " + esc(fn) + '(): could not find function "' + esc(fn) + '"', "err");
        print('<span class="dim"># type </span>' + go("help()") + '<span class="dim"> to see what works here</span>', "dim");
    }
  }

  function run(c) {
    echo(c); hist.push(c); hIdx = hist.length;
    try { exec(c); } catch (e) { print("Error: something went wrong running that command", "err"); }
  }

  function openConsole() {
    cEl.hidden = false;
    document.body.classList.add("console-open");
    $("#console-btn").setAttribute("aria-expanded", "true");
    if (!greeted) {
      greeted = true;
      print('<span class="dim">R session · energy politics edition · "Load Following"\n' +
        "This console is optional. Commands scroll the page to a section.\n</span>" +
        "Try " + go("research()") + ", " + go("methods()") + ", " + go("ls()") + ", or " + go("help()") + ".\n", "out");
    }
    input.focus({ preventScroll: true });
  }
  function closeConsole() {
    cEl.hidden = true;
    document.body.classList.remove("console-open");
    $("#console-btn").setAttribute("aria-expanded", "false");
    $("#console-btn").focus({ preventScroll: true });
  }
  function toggleConsole() { if (cEl.hidden) openConsole(); else closeConsole(); }

  function wireConsole() {
    $("#console-btn").addEventListener("click", toggleConsole);
    $("#console-close").addEventListener("click", closeConsole);
    $("#theme-btn").addEventListener("click", toggleTheme);
    document.addEventListener("click", function (e) {
      var r = e.target.closest("[data-run]");
      if (r) { e.preventDefault(); run(r.getAttribute("data-run")); input.focus({ preventScroll: true }); return; }
      if (e.target.closest("[data-open-console]")) openConsole();
    });
    $("#console-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var v = input.value; input.value = "";
      if (v.trim()) run(v); else echo("");
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowUp") { if (hIdx > 0) input.value = hist[--hIdx]; e.preventDefault(); }
      else if (e.key === "ArrowDown") { if (hIdx < hist.length - 1) input.value = hist[++hIdx]; else { hIdx = hist.length; input.value = ""; } e.preventDefault(); }
      else if (e.key === "Escape") closeConsole();
      else if (e.key === "l" && e.ctrlKey) { e.preventDefault(); out.innerHTML = ""; }
      else if (e.key === "Tab") {
        var v = input.value, mm = v.match(/([\w.]*)$/), stem = mm ? mm[1] : "";
        if (!stem) return;
        e.preventDefault();
        var opts = FUNS.filter(function (n, i, arr) { return n.indexOf(stem) === 0 && arr.indexOf(n) === i; });
        var before = v.slice(0, v.length - stem.length);
        if (opts.length === 1) input.value = before + opts[0] + (/\($/.test(before) ? "" : "()");
        else if (opts.length > 1) { echo(v); print(esc(opts.join("   ")), "dim"); }
      }
    });
    scroller.addEventListener("click", function (e) {
      if (!e.target.closest("a, button") && !String(window.getSelection())) input.focus({ preventScroll: true });
    });
    document.addEventListener("keydown", function (e) {
      if (e.ctrlKey && e.key === "2") { e.preventDefault(); openConsole(); }
    });
  }

  render();
  watchSections();
  wireConsole();
})();
