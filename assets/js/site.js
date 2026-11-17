/* site.js: theme switch, contents rail, and the optional R console.
   The page works without this file; it only adds conveniences. */
(function () {
  "use strict";

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var root = document.documentElement;
  var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- theme ---------- */
  function setTheme(t) {
    root.setAttribute("data-theme", t);
    try { localStorage.setItem("theme", t); } catch (e) { /* storage unavailable */ }
    $$("[data-theme-toggle]").forEach(function (b) { b.textContent = t === "dark" ? "Light theme" : "Dark theme"; });
  }
  function flipTheme() { setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark"); }
  setTheme(root.getAttribute("data-theme") === "dark" ? "dark" : "light");
  $$("[data-theme-toggle]").forEach(function (b) { b.addEventListener("click", flipTheme); });

  /* ---------- the figure: my time as a load curve ----------
     Hours per week, stacked by what serves them, like a grid operator's
     dispatch stack. The functions below match the R code printed above
     the plot. Each band links to its section of the page. */
  var chunk = $("#chunk"), holder = $("#plot");
  var T0 = 2021.6, T1 = 2031.5, TOP = 90;
  var BANDS = ["coursework", "methods", "teaching", "software", "research", "milestones"];
  var HREF = { coursework: "#education", methods: "#methods", teaching: "#teaching", software: "#software", research: "#research", milestones: "#education" };
  function plogis(x) { return 1 / (1 + Math.exp(-x)); }
  function term(t) { return 1 - 0.45 * Math.pow(Math.max(0, Math.cos(2 * Math.PI * (t - 0.54))), 4); }
  function peak(t, at, h, w) { return h * Math.exp(-Math.pow((t - at) / (w || 0.08), 2)); }
  function on(t, a, b) { return plogis(40 * (t - a)) - plogis(40 * (t - (b === undefined ? Infinity : b))); }
  function load(t) {
    var k = term(t);
    return {
      coursework: k * (22 * on(t, 2021.6, 2024.6) + 18 * on(t, 2024.6, 2025.4) + 8 * on(t, 2025.4, 2028.4)),
      methods: k * (2 * on(t, 2021.6, 2024.6) + 7 * on(t, 2024.6, 2025.4) + 10 * on(t, 2025.4, 2026.6) +
        16 * on(t, 2026.6, 2028.4) + 6 * on(t, 2028.4)),
      teaching: k * 15 * on(t, 2026.6),
      software: 4 * on(t, 2025.6),
      research: k * (2 * on(t, 2021.6, 2024.6) + 12 * on(t, 2024.6, 2025.4) + 18 * on(t, 2025.4, 2026.6) +
        on(t, 2026.6) * (10 + 26 * plogis(2.5 * (t - 2028.6)))),
      milestones: peak(t, 2023.2, 5) + peak(t, 2025.37, 8) + peak(t, 2026.3, 12) +
        peak(t, 2028.3, 18) + peak(t, 2029.3, 12) + peak(t, 2031.3, 20, 0.1)
    };
  }
  // row: 1 is the top line of labels, 3 the lowest. brief: the label on phones.
  var EVENTS = [
    { at: 2023.2, text: "First conference", brief: "1st conf.", row: 3, anchor: "middle" },
    { at: 2024.6, text: "M.I.P. begins", brief: "M.I.P.", row: 3, anchor: "middle" },
    { at: 2025.37, text: "B.S. graduation", brief: "B.S.", row: 2, anchor: "middle" },
    { at: 2026.3, text: "M.I.P. capstone", brief: "capstone", row: 1, anchor: "end" },
    { at: 2026.6, text: "Ph.D. begins", brief: "Ph.D.", row: 2, anchor: "start" }
  ];
  function yearNow() {
    var d = new Date(), y = d.getUTCFullYear(), s0 = Date.UTC(y, 0, 1);
    return y + (d - s0) / (Date.UTC(y + 1, 0, 1) - s0);
  }
  function season(t) {
    var y = Math.floor(t), m = Math.floor((t - y) * 12);
    return (m < 5 ? "Spring " : m < 7 ? "Summer " : "Fall ") + y;
  }
  var view = null;

  function draw(animate) {
    var W = Math.max(280, holder.clientWidth), small = W < 560, H = small ? 280 : 340;
    var m = { l: 40, r: 10, t: 24, b: 30 }, pw = W - m.l - m.r, ph = H - m.t - m.b, base = m.t + ph;
    var now = Math.min(Math.max(yearNow(), T0), T1);
    var X = function (t) { return m.l + (t - T0) / (T1 - T0) * pw; };
    var Y = function (v) { return base - v / TOP * ph; };
    var f1 = function (n) { return Math.round(n * 10) / 10; };
    var N = Math.round(pw / 2), ts = [], cum = [];
    for (var i = 0; i <= N; i++) {
      var t = T0 + (T1 - T0) * i / N, l = load(t), run = 0, row = {};
      BANDS.forEach(function (b) { run += l[b]; row[b] = run; });
      ts.push(t); cum.push(row);
    }
    // one polygon per band: the top edge of this band, then back along the top of the one below
    function bandPath(k) {
      var top = "", bot = "";
      for (var j = 0; j <= N; j++) top += (j ? "L" : "M") + f1(X(ts[j])) + " " + f1(Y(cum[j][BANDS[k]]));
      for (j = N; j >= 0; j--) bot += "L" + f1(X(ts[j])) + " " + f1(Y(k ? cum[j][BANDS[k - 1]] : 0));
      return top + bot + "Z";
    }
    var bands = "";
    BANDS.forEach(function (b, k) {
      bands += '<a href="' + HREF[b] + '" tabindex="-1" data-band="' + b + '"><path class="band ' + b + '" d="' + bandPath(k) + '"/></a>';
    });
    var total = "";
    for (i = 0; i <= N; i++) total += (i ? "L" : "M") + f1(X(ts[i])) + " " + f1(Y(cum[i].milestones));

    var nx = f1(X(now)), o = "", x, y;
    o += '<defs><clipPath id="clip-past" class="' + (animate ? "reveal" : "") + '"><rect x="' + m.l + '" y="' + m.t + '" width="' + f1(nx - m.l) + '" height="' + ph + '"/></clipPath>' +
         '<clipPath id="clip-ahead" class="' + (animate ? "reveal" : "") + '"><rect x="' + m.l + '" y="' + m.t + '" width="' + pw + '" height="' + ph + '"/></clipPath>' +
         '<clipPath id="clip-right"><rect x="' + nx + '" y="' + m.t + '" width="' + f1(m.l + pw - nx) + '" height="' + ph + '"/></clipPath></defs>';

    // projected region first, then gridlines, then the stack on top
    o += '<rect class="proj" x="' + nx + '" y="' + m.t + '" width="' + f1(m.l + pw - nx) + '" height="' + ph + '"/>';
    [20, 40, 60, 80].forEach(function (v) {
      y = f1(Y(v));
      o += '<path class="grid" d="M' + m.l + " " + y + "H" + (m.l + pw) + '"/>';
    });
    o += '<g clip-path="url(#clip-ahead)"><g class="ahead" clip-path="url(#clip-right)">' + bands + '<path class="total ahead" d="' + total + '"/></g></g>';
    o += '<g clip-path="url(#clip-past)">' + bands + '<path class="total" d="' + total + '"/></g>';
    o += '<path class="axis" d="M' + m.l + " " + base + "H" + (m.l + pw) + '"/>';

    [0, 20, 40, 60, 80].forEach(function (v) {
      o += '<text x="' + (m.l - 8) + '" y="' + f1(Y(v) + 4) + '" text-anchor="end">' + v + "</text>";
    });
    o += '<text class="units" x="' + (m.l - 8) + '" y="' + (m.t - 8) + '">hours per week</text>';
    for (var yr = 2022; yr <= 2031; yr += small ? 2 : 1) {
      x = f1(X(yr));
      o += '<path class="tick" d="M' + x + " " + base + 'v5"/><text x="' + x + '" y="' + (base + 20) + '" text-anchor="middle">' + yr + "</text>";
    }

    // the projection boundary, labelled once, the way EIA marks a forecast
    o += '<path class="today" d="M' + nx + " " + m.t + "V" + base + '"/>';
    o += '<text class="proj-text" x="' + (nx + 6) + '" y="' + (m.t + 14) + '">projected</text>';

    // events: a label on its row, and a thin leader down to the top of the stack
    var rowY = function (r) { return m.t + 14 + (r - 1) * 16; };
    EVENTS.forEach(function (ev) {
      var l = load(ev.at), sum = 0;
      BANDS.forEach(function (b) { sum += l[b]; });
      var ex = f1(X(ev.at)), ly = rowY(ev.row), dx = ev.anchor === "end" ? 3 : ev.anchor === "start" ? -3 : 0;
      o += '<path class="leader" d="M' + ex + " " + (ly + 4) + "V" + f1(Y(sum) - 2) + '"/>';
      o += '<text class="event" x="' + f1(ex + dx) + '" y="' + ly + '" text-anchor="' + ev.anchor + '">' + (small ? ev.brief : ev.text) + "</text>";
    });
    // direct labels: each band's name sits where that band is thickest across the label's width.
    // Prefer the observed side, where the fill is solid; fall back to the projected side.
    var INK = { coursework: "#111", methods: "#fff", teaching: "#111", software: "#111", research: "#111" };
    var cut = Math.round((nx - m.l) / pw * N);
    BANDS.forEach(function (b, k) {
      if (b === "milestones") return;
      var half = Math.ceil((b.length * 6.6 + 10) / 4);
      function search(from, to) {
        var best = null, bestT = 0;
        for (var c = Math.max(from, half + 4); c <= Math.min(to, N - half - 4); c++) {
          var thin = Infinity;
          for (var j = c - half; j <= c + half; j++) {
            var lo = k ? cum[j][BANDS[k - 1]] : 0;
            thin = Math.min(thin, (cum[j][b] - lo) / TOP * ph);
          }
          if (thin > bestT) { bestT = thin; best = c; }
        }
        return bestT >= 13 ? best : null;
      }
      var at = search(0, cut - half - 2), past = at !== null;
      if (!past) at = search(cut + half + 2, N);
      if (at === null) return;
      var lo = k ? cum[at][BANDS[k - 1]] : 0, mid = (lo + cum[at][b]) / 2;
      o += '<text class="blabel" x="' + f1(X(ts[at])) + '" y="' + f1(Y(mid) + 4) + '" text-anchor="middle" style="fill:' +
        (past ? INK[b] : "var(--text)") + '">' + b + "</text>";
    });
    o += '<path class="cross" id="cross" d="" visibility="hidden"/><text class="readout" id="readout" visibility="hidden"></text>';

    holder.innerHTML = '<svg viewBox="0 0 ' + W + " " + H + '" width="' + W + '" height="' + H + '" aria-hidden="true">' + o + "</svg>";
    view = { X: X, Y: Y, m: m, pw: pw, ph: ph, W: W, small: small, svg: holder.querySelector("svg") };

    var l0 = load(now), names = BANDS, vals = names.map(function (b) { return String(Math.round(l0[b])); });
    var w = names.map(function (n, i) { return Math.max(n.length, vals[i].length); });
    var padL = function (t, n) { return new Array(n - t.length + 1).join(" ") + t; };
    $("#live-out").textContent = "## " + names.map(function (n, i) { return padL(n, w[i]); }).join(" ") + "\n## " +
      vals.map(function (v, i) { return padL(v, w[i]); }).join(" ");
  }

  // highlight a band everywhere it appears (plot and legend)
  function focus(band) {
    holder.classList.toggle("focus", !!band);
    $$("#plot .band").forEach(function (p) { p.classList.toggle("on", !!band && p.classList.contains(band)); });
    $$(".legend a").forEach(function (a) { a.classList.toggle("on", a.getAttribute("data-band") === band); });
  }

  // crosshair and readout: season, total hours, and the band under the pointer
  function track(e) {
    var v = view, r = v.svg.getBoundingClientRect(), sx = v.W / r.width;
    var px = (e.clientX - r.left) * sx, py = (e.clientY - r.top) * sx;
    var cross = $("#cross"), out = $("#readout");
    if (px < v.m.l || px > v.m.l + v.pw || py < v.m.t || py > v.m.t + v.ph) {
      cross.setAttribute("visibility", "hidden"); out.setAttribute("visibility", "hidden"); return;
    }
    var t = T0 + (px - v.m.l) / v.pw * (T1 - T0), l = load(t), run = 0, under = null;
    var val = (v.m.t + v.ph - py) / v.ph * TOP;
    BANDS.forEach(function (b) { if (!under && val <= run + l[b]) under = b; run += l[b]; });
    cross.setAttribute("d", "M" + px + " " + v.m.t + "V" + (v.m.t + v.ph));
    cross.setAttribute("visibility", "visible");
    var text = season(t) + ": " + Math.round(run) + " h/week" + (under ? ", " + Math.round(l[under]) + " " + under : "");
    var left = px > v.m.l + v.pw * 0.55;
    out.setAttribute("x", left ? px - 8 : px + 8);
    out.setAttribute("y", v.m.t + v.ph - 10);
    out.setAttribute("text-anchor", left ? "end" : "start");
    out.textContent = text;
    out.setAttribute("visibility", "visible");
  }

  chunk.hidden = false;
  draw(!calm);
  holder.addEventListener("pointerover", function (e) {
    var a = e.target.closest("[data-band]");
    focus(a ? a.getAttribute("data-band") : null);
  });
  holder.addEventListener("pointermove", track);
  holder.addEventListener("pointerleave", function () {
    focus(null);
    $("#cross").setAttribute("visibility", "hidden");
    $("#readout").setAttribute("visibility", "hidden");
  });
  $$(".legend a").forEach(function (a) {
    var b = a.getAttribute("data-band");
    a.addEventListener("pointerenter", function () { focus(b); });
    a.addEventListener("pointerleave", function () { focus(null); });
    a.addEventListener("focus", function () { focus(b); });
    a.addEventListener("blur", function () { focus(null); });
  });
  var redraw = null, lastW = holder.clientWidth;
  window.addEventListener("resize", function () {
    clearTimeout(redraw);
    redraw = setTimeout(function () { if (holder.clientWidth !== lastW) { lastW = holder.clientWidth; draw(false); } }, 120);
  });

  /* ---------- contents rail ---------- */
  var env = $(".env"), toggle = $("#env-toggle"), now = $("#env-now");
  var links = $$(".env li a");
  var ids = links.map(function (a) { return a.getAttribute("href").slice(1); });
  var held = null, holdTimer = null;

  function setOpen(open) {
    env.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  }
  toggle.addEventListener("click", function () { setOpen(!env.classList.contains("open")); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && env.classList.contains("open")) { setOpen(false); toggle.focus(); }
  });

  function mark(id) {
    links.forEach(function (a) {
      if (a.getAttribute("href") === "#" + id) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    });
    now.textContent = id;
  }
  links.forEach(function (a) {
    a.addEventListener("click", function () {
      held = a.getAttribute("href").slice(1);
      mark(held);
      setOpen(false);
      clearTimeout(holdTimer);
      holdTimer = setTimeout(function () { held = null; }, 1000);
    });
  });
  function spy() {
    if (held) return;
    var line = window.innerWidth <= 860 ? 80 : 60, cur = ids[0];
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= line) cur = id;
    });
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) cur = ids[ids.length - 1];
    mark(cur);
  }
  var queued = false;
  window.addEventListener("scroll", function () {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; spy(); });
  }, { passive: true });
  window.addEventListener("resize", spy);
  spy();

  /* ---------- R console ---------- */
  var box = $("#console"), out = $("#console-out"), input = $("#console-input"), scroller = $("#console-scroll");
  var opener = null, past = [], at = 0, greeted = false;

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function say(html, cls) {
    var d = document.createElement("div");
    if (cls) d.className = cls;
    d.innerHTML = html;
    out.appendChild(d);
    scroller.scrollTop = scroller.scrollHeight;
  }
  function run(cmd) { return '<button type="button" data-run="' + esc(cmd) + '">' + esc(cmd) + "</button>"; }

  function titles(id) {
    return $$("#" + id + " h4, #" + id + " h3.title, #" + id + " .args dt").map(function (el) { return el.textContent.trim(); });
  }
  function show(id) {
    var t = titles(id);
    if (t.length) say(t.map(function (x, i) { return "[" + (i + 1) + '] "' + esc(x) + '"'; }).join("\n"));
    document.getElementById(id).scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });
    mark(id);
  }
  function missing(name) {
    var guess = ids.filter(function (n) { return n.indexOf(name.toLowerCase().slice(0, 3)) === 0; })[0];
    say("Error: object '" + esc(name) + "' not found" +
      (guess ? '\n<span class="dim">Did you mean </span>' + run(guess + "()") + '<span class="dim">?</span>' : ""), "err");
  }

  function evaluate(raw) {
    var cmd = raw.trim().replace(/;+$/, "");
    if (!cmd || cmd.charAt(0) === "#") return;
    if (/^\?/.test(cmd)) cmd = "help()";
    var m = cmd.match(/^([\w.]+)\s*\(\s*["']?([\w.]*)["']?\s*\)$/);
    if (!m) {
      if (/^[\w.]+$/.test(cmd)) return ids.indexOf(cmd) >= 0 ? show(cmd) : missing(cmd);
      return say('Error: unexpected input in "' + esc(cmd.slice(0, 40)) + '"', "err");
    }
    var fn = m[1], arg = m[2];
    if (ids.indexOf(fn) >= 0) return show(fn);
    switch (fn) {
      case "View": case "print": case "head": case "str": case "summary":
        if (!arg) return say('Error: argument "x" is missing, with no default', "err");
        return ids.indexOf(arg) >= 0 ? show(arg) : missing(arg);
      case "ls": case "objects":
        return say("[1] " + ids.map(function (i) { return '"' + i + '"'; }).join(" "));
      case "help":
        return say("Each section of the page is an object. Call one to go to it:\n  " +
          ids.map(function (i) { return run(i + "()"); }).join("  ") +
          '\n<span class="dim">Also: ls(), theme(), clear(), q()</span>');
      case "theme": flipTheme(); return;
      case "clear": out.innerHTML = ""; return;
      case "cv": return say('<a href="files/cv.pdf" style="color:#8fb4d6">files/cv.pdf</a>');
      case "q": case "quit": return closeConsole();
      default:
        say("Error in " + esc(fn) + '(): could not find function "' + esc(fn) + '"', "err");
    }
  }
  function submit(cmd) {
    say(esc(cmd), "in");
    past.push(cmd); at = past.length;
    evaluate(cmd);
  }

  function openConsole(from) {
    opener = from || null;
    box.hidden = false;
    document.body.classList.add("console-on");
    $$("[data-console-open]").forEach(function (b) { b.setAttribute("aria-expanded", "true"); });
    if (!greeted) {
      greeted = true;
      say('<span class="dim">Type a section name such as </span>' + run("research()") +
        '<span class="dim">, or </span>' + run("help()") + '<span class="dim">.</span>');
    }
    input.focus();
  }
  function closeConsole() {
    box.hidden = true;
    document.body.classList.remove("console-on");
    $$("[data-console-open]").forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
    if (opener) opener.focus();
  }

  $$("[data-console-open]").forEach(function (b) {
    b.addEventListener("click", function () { if (box.hidden) openConsole(b); else closeConsole(); });
  });
  $("#console-close").addEventListener("click", closeConsole);
  $("#console-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var v = input.value;
    input.value = "";
    if (v.trim()) submit(v);
  });
  out.addEventListener("click", function (e) {
    var b = e.target.closest("[data-run]");
    if (b) { submit(b.getAttribute("data-run")); input.focus(); }
  });
  input.addEventListener("keydown", function (e) {
    if (e.key === "ArrowUp") { if (at > 0) input.value = past[--at]; e.preventDefault(); }
    else if (e.key === "ArrowDown") {
      if (at < past.length - 1) input.value = past[++at]; else { at = past.length; input.value = ""; }
      e.preventDefault();
    }
    else if (e.key === "Escape") closeConsole();
  });
})();
