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

  /* ---------- the figure: my energy as a power line ----------
     A(t) is the line, with t in decimal years. It must match the R code
     printed above the plot. The poles stand at the turning points, and a
     pulse travels along the line from birth to today. */
  var chunk = $("#chunk"), holder = $("#plot");
  var BORN = 2002.58, END = 2032;
  function plogis(x) { return 1 / (1 + Math.exp(-x)); }
  function bump(t, at, w, h) { return h * Math.exp(-Math.pow((t - at) / w, 2)); }
  function rest(t) { return 1 - 0.3 * Math.pow(Math.max(0, Math.cos(2 * Math.PI * (t - 0.54))), 3); }
  function A(t) {
    return rest(t) * (0.3 + 0.7 * plogis(5 * (t - 2008.75)) +
      0.25 * plogis(6 * (t - 2020)) + 0.5 * plogis(8 * (t - 2026.6)) +
      bump(t, 2025.9, 0.4, 0.7) + bump(t, 2026.75, 0.25, 0.9) +
      bump(t, 2028.3, 0.1, 1.3) + bump(t, 2031.3, 0.2, 1.2));
  }
  function yearNow() {
    var d = new Date(), y = d.getUTCFullYear(), s = Date.UTC(y, 0, 1);
    return y + (d - s) / (Date.UTC(y + 1, 0, 1) - s);
  }
  // poles: where the line turns. "wide" labels are dropped on narrow screens.
  var poles = [
    { at: 2009.3, text: "moved to the U.S., age 6", brief: "U.S., age 6", anchor: "start" },
    { at: 2020.3, text: "first job, age 17", anchor: "end", wide: true },
    { at: 2025.9, text: "master's", anchor: "end", wide: true },
    { at: 2026.75, text: "Ph.D. begins", brief: "Ph.D.", anchor: "end" },
    { at: 2028.3, text: "comps", anchor: "middle", wide: true },
    { at: 2031.3, text: "defense", anchor: "end", wide: true }
  ];
  var view = null, moving = !calm, visible = true, head = BORN - 1.5;

  function draw() {
    var W = Math.max(280, holder.clientWidth), small = W < 560, H = small ? 270 : 330;
    var m = { l: 56, r: 14, t: 14, b: 30 }, pw = W - m.l - m.r, ph = H - m.t - m.b;
    var top = 3.75, now = Math.min(yearNow(), END);
    var X = function (t) { return m.l + (t - BORN) / (END - BORN) * pw; };
    var T = function (x) { return BORN + (x - m.l) / pw * (END - BORN); };
    var Y = function (v) { return m.t + ph - v / top * ph; };
    var f1 = function (n) { return Math.round(n * 10) / 10; };
    var o = "", x, y;

    o += '<rect class="frame" x="' + m.l + '" y="' + m.t + '" width="' + pw + '" height="' + ph + '"/>';
    for (var yr = 2005; yr < END; yr += small ? 10 : 5) {
      x = f1(X(yr));
      o += '<path class="tick" d="M' + x + " " + (m.t + ph) + 'v6"/><text x="' + x + '" y="' + (m.t + ph + 21) + '" text-anchor="middle">' + yr + "</text>";
    }
    [0, 1, 2, 3].forEach(function (v) {
      y = f1(Y(v));
      o += '<path class="tick" d="M' + m.l + " " + y + 'h-6"/><text transform="translate(' + (m.l - 11) + " " + y + ') rotate(-90)" text-anchor="middle">' + v + "</text>";
    });
    o += '<text transform="translate(13 ' + f1(m.t + ph / 2) + ') rotate(-90)" text-anchor="middle">Energy</text>';

    // distribution poles: a post, a crossarm, two insulators
    poles.forEach(function (p) {
      var px = f1(X(p.at)), py = f1(Y(A(p.at))), cls = p.at > now ? "pole ahead" : "pole";
      o += '<path class="' + cls + '" d="M' + px + " " + (m.t + ph) + "V" + py + "M" + (px - 7) + " " + (py + 6) + "h14M" + (px - 7) + " " + (py + 6) + "v-4M" + (px + 7) + " " + (py + 6) + 'v-4"/>';
      if (small && p.wide) return;
      var dx = p.anchor === "end" ? -6 : p.anchor === "start" ? 6 : 0;
      o += '<text class="note" x="' + f1(px + dx) + '" y="' + f1(py - 9) + '" text-anchor="' + p.anchor + '">' + (small && p.brief ? p.brief : p.text) + "</text>";
    });

    // the line: solid up to today, dotted after
    var past = "", ahead = "";
    for (x = m.l; x <= m.l + pw; x += 0.75) {
      var t = T(x), pt = f1(x) + " " + f1(Y(A(t)));
      if (t <= now) past += (past ? "L" : "M") + pt; else ahead += (ahead ? "L" : "M") + pt;
    }
    var nx = f1(X(now)), ny = f1(Y(A(now)));
    o += '<path class="line ahead" d="M' + nx + " " + ny + ahead.replace(/^M/, "L") + '"/><path class="line" d="' + past + '"/>';
    o += '<path class="charge" id="charge"/><circle class="here" id="here" cx="' + nx + '" cy="' + ny + '" r="4.5"/>';
    o += '<text class="now-text" x="' + (nx + 6) + '" y="' + (m.t + ph - 8) + '">today</text>';

    holder.innerHTML = '<svg viewBox="0 0 ' + W + " " + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="A line showing my energy from 2002 to 2032. It is low until 2008, rises sharply when I moved to the United States at six, steps up at a first job at 17, and peaks during the master\'s degree and the start of the Ph.D., with a dip every summer. After today the line is dotted, with planned peaks at comprehensive exams and the defense. A pulse travels along the line from birth to today.">' + o + "</svg>";
    view = { X: X, Y: Y, now: now, pxPerYear: pw / (END - BORN), charge: holder.querySelector("#charge"), here: holder.querySelector("#here") };
    $("#live-out").textContent = A(now).toFixed(2);
    if (!moving) pulse();
  }

  // a short burst of oscillation centred on `head`, riding on the line
  function pulse() {
    var v = view, half = 1.5, d = "", from = Math.max(BORN, head - half), to = Math.min(v.now, head + half);
    for (var t = from; t <= to; t += 0.75 / v.pxPerYear) {
      var wob = 0.34 * Math.exp(-Math.pow((t - head) / 0.6, 2)) * Math.sin(2 * Math.PI * 3.2 * (t - head));
      d += (d ? "L" : "M") + Math.round(v.X(t) * 10) / 10 + " " + Math.round(v.Y(A(t) + wob) * 10) / 10;
    }
    v.charge.setAttribute("d", d);
    var near = Math.max(0, 1 - Math.abs(head - v.now) / 0.7);
    v.here.setAttribute("r", (4.5 + 3.5 * near).toFixed(1));
  }

  chunk.hidden = false;
  draw();
  var last = 0;
  function frame(ts) {
    if (moving && visible && !document.hidden && ts - last > 33) {
      var dt = Math.min(100, ts - last) / 1000;
      last = ts;
      head += dt * (view.now - BORN + 3) / 5.5;            // one crossing takes about 5.5 seconds
      if (head > view.now + 3) head = BORN - 1.5;          // rest a moment, then start again
      pulse();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(holder);
  }
  var pauseBtn = $("#plot-pause");
  function showPause() {
    pauseBtn.textContent = moving ? "Pause" : "Play";
    pauseBtn.setAttribute("aria-pressed", moving ? "false" : "true");
  }
  showPause();
  pauseBtn.addEventListener("click", function () { moving = !moving; showPause(); });
  var redraw = null;
  window.addEventListener("resize", function () { clearTimeout(redraw); redraw = setTimeout(draw, 120); });

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
