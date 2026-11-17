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

  /* ---------- the figure: my Ph.D. as a load curve ----------
     Hours per week, stacked by what serves them, like a grid operator's
     dispatch stack. The functions below match the R code printed above
     the plot. Each band links to its section of the page. */
  var chunk = $("#chunk"), holder = $("#plot");
  var T0 = 2026.6, T1 = 2031.5, TOP = 90;
  var BANDS = ["methods", "teaching", "software", "research", "milestones"];
  var HREF = { methods: "#methods", teaching: "#teaching", software: "#software", research: "#research", milestones: "#education" };
  function plogis(x) { return 1 / (1 + Math.exp(-x)); }
  function term(t) { return 1 - 0.45 * Math.pow(Math.max(0, Math.cos(2 * Math.PI * (t - 0.54))), 4); }
  function peak(t, at, h, w) { return h * Math.exp(-Math.pow((t - at) / (w || 0.08), 2)); }
  function load(t) {
    var k = term(t);
    return {
      methods: k * (6 + 16 * plogis(-6 * (t - 2028.4))),
      teaching: k * 10,
      software: 4,
      research: k * (8 + 30 * plogis(2.5 * (t - 2028.6))),
      milestones: peak(t, 2028.3, 18) + peak(t, 2029.3, 12) + peak(t, 2031.3, 20, 0.1)
    };
  }
  var NOTES = [{ at: 2028.3, text: "comps" }, { at: 2029.3, text: "prospectus" }, { at: 2031.3, text: "defense" }];
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
    var W = Math.max(280, holder.clientWidth), small = W < 560, H = small ? 260 : 320;
    var m = { l: 56, r: 14, t: 14, b: 30 }, pw = W - m.l - m.r, ph = H - m.t - m.b, base = m.t + ph;
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

    var nx = f1(X(now)), o = "";
    o += '<defs><clipPath id="clip-past" class="' + (animate ? "reveal" : "") + '"><rect x="' + m.l + '" y="' + m.t + '" width="' + f1(nx - m.l) + '" height="' + ph + '"/></clipPath>' +
         '<clipPath id="clip-ahead" class="' + (animate ? "reveal" : "") + '"><rect x="' + m.l + '" y="' + m.t + '" width="' + pw + '" height="' + ph + '"/></clipPath>' +
         '<clipPath id="clip-right"><rect x="' + nx + '" y="' + m.t + '" width="' + f1(m.l + pw - nx) + '" height="' + ph + '"/></clipPath></defs>';
    o += '<g clip-path="url(#clip-ahead)"><g class="ahead" clip-path="url(#clip-right)">' + bands + '<path class="total ahead" d="' + total + '"/></g></g>';
    o += '<g clip-path="url(#clip-past)">' + bands + '<path class="total" d="' + total + '"/></g>';
    o += '<rect class="frame" x="' + m.l + '" y="' + m.t + '" width="' + pw + '" height="' + ph + '"/>';

    for (var yr = 2027; yr <= 2031; yr++) {
      var x = f1(X(yr));
      o += '<path class="tick" d="M' + x + " " + base + 'v6"/><text x="' + x + '" y="' + (base + 21) + '" text-anchor="middle">' + yr + "</text>";
    }
    [0, 20, 40, 60, 80].forEach(function (v) {
      var y = f1(Y(v));
      o += '<path class="tick" d="M' + m.l + " " + y + 'h-6"/><text transform="translate(' + (m.l - 11) + " " + y + ') rotate(-90)" text-anchor="middle">' + v + "</text>";
    });
    o += '<text transform="translate(13 ' + f1(m.t + ph / 2) + ') rotate(-90)" text-anchor="middle">Load (hours per week)</text>';
    NOTES.forEach(function (n) {
      var l = load(n.at), sum = 0;
      BANDS.forEach(function (b) { sum += l[b]; });
      o += '<text class="note" x="' + f1(X(n.at)) + '" y="' + f1(Y(sum) - 8) + '" text-anchor="middle">' + n.text + "</text>";
    });
    o += '<path class="today" d="M' + nx + " " + m.t + "V" + base + '"/>';
    o += '<text class="now-text" x="' + (nx + 6) + '" y="' + (m.t + 14) + '">today</text>';
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
