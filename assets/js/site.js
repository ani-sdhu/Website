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

  /* ---------- the figure: age in MMBtu, drawn like a base R plot ---------- */
  var chunk = $("#chunk"), holder = $("#plot");
  var DAY = 864e5, MMBTU_PER_DAY = 2000 * 4184 / 1.055056e9;   // 2,000 kcal a day
  var born = new Date(chunk.getAttribute("data-born") + "T00:00:00Z");
  var today = new Date();
  var marks = [
    { at: "2025-05-15", label: "B.S.", side: "up" },
    { at: "2026-05-15", label: "M.I.P.", side: "up" },
    { at: "2026-08-15", label: "Ph.D. begins", side: "down" },
    { at: "2031-05-15", label: "Ph.D. (expected)", side: "up", open: true }
  ];
  function mmbtu(d) { return (d - born) / DAY * MMBTU_PER_DAY; }
  function utc(str) { return new Date(str + "T00:00:00Z"); }

  function draw() {
    var W = Math.max(280, holder.clientWidth), small = W < 560, H = small ? 250 : 300;
    var m = { l: 54, r: 18, t: 12, b: 30 };
    var t0 = utc("2024-01-01"), t1 = utc("2032-01-01");
    var y0 = Math.floor(mmbtu(t0) / 5) * 5, y1 = Math.ceil(mmbtu(t1) / 5) * 5;
    var X = function (d) { return m.l + (d - t0) / (t1 - t0) * (W - m.l - m.r); };
    var Y = function (v) { return H - m.b - (v - y0) / (y1 - y0) * (H - m.t - m.b); };
    var r = function (n) { return Math.round(n * 10) / 10; };
    var now = Math.min(Math.max(today, t0), t1);
    var o = "";

    o += '<rect class="frame" x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '"/>';
    for (var yr = 2024; yr <= 2032; yr += small ? 2 : 1) {
      var x = r(X(utc(yr + "-01-01")));
      o += '<path class="tick" d="M' + x + " " + (H - m.b) + 'v6"/><text x="' + x + '" y="' + (H - m.b + 21) + '" text-anchor="middle">' + yr + "</text>";
    }
    for (var v = y0; v <= y1; v += 5) {
      var y = r(Y(v));
      o += '<path class="tick" d="M' + m.l + " " + y + 'h-6"/><text transform="translate(' + (m.l - 11) + " " + y + ') rotate(-90)" text-anchor="middle">' + v + "</text>";
    }
    o += '<text transform="translate(13 ' + r((m.t + H - m.b) / 2) + ') rotate(-90)" text-anchor="middle">Energy metabolized (MMBtu)</text>';

    o += '<path class="curve" d="M' + r(X(t0)) + " " + r(Y(mmbtu(t0))) + "L" + r(X(now)) + " " + r(Y(mmbtu(now))) + '"/>';
    o += '<path class="plan" d="M' + r(X(now)) + " " + r(Y(mmbtu(now))) + "L" + r(X(t1)) + " " + r(Y(mmbtu(t1))) + '"/>';

    marks.forEach(function (k) {
      var d = utc(k.at), px = r(X(d)), py = r(Y(mmbtu(d))), up = k.side === "up";
      o += '<circle class="pt' + (k.open ? " open" : "") + '" cx="' + px + '" cy="' + py + '" r="3.5"/>';
      o += '<text x="' + (px + (up ? -8 : 8)) + '" y="' + (py + (up ? -8 : 17)) + '" text-anchor="' + (up ? "end" : "start") + '">' + k.label + "</text>";
    });

    var nx = r(X(now)), ny = r(Y(mmbtu(now)));
    o += '<path class="now-line" d="M' + nx + " " + ny + "V" + (m.t + 1) + '"/>';
    o += '<circle class="pt now" cx="' + nx + '" cy="' + ny + '" r="4.5"/>';
    o += '<text class="now-text" x="' + (nx + 7) + '" y="' + (m.t + 17) + '">today</text>';

    holder.innerHTML = '<svg viewBox="0 0 ' + W + " " + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="Line chart of energy metabolized since birth at 2,000 kilocalories a day, in MMBtu, from 2024 to 2032. Points mark the B.S. in 2025, the Master of International Policy in 2026, the start of the Ph.D. in 2026, and the expected Ph.D. in 2031. Today the value is ' + mmbtu(today).toFixed(1) + ' MMBtu.">' + o + "</svg>";
  }

  if (!isNaN(born)) {
    chunk.hidden = false;
    $("#born-out").textContent = chunk.getAttribute("data-born");
    $("#age-out").textContent = mmbtu(today).toFixed(1);
    draw();
    var redraw = null;
    window.addEventListener("resize", function () { clearTimeout(redraw); redraw = setTimeout(draw, 120); });
  }

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
