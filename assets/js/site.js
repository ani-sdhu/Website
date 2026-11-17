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

  /* ---------- the figure: my life as a power line ----------
     One tower per stretch of life, as tall as the energy in it. Every wire
     is a catenary through two attachment points, computed by wire(), which
     is the same function printed as R above the plot. */
  var chunk = $("#chunk"), holder = $("#plot");
  var T0 = 2002, T1 = 2032.4, TOP = 3.9, BORN = 2002.58;
  // wide: skipped on narrow screens. quiet: label hidden on narrow screens.
  var LIFE = [
    { t: 2002.58, e: 0.5 }, { t: 2005.6, e: 0.5 }, { t: 2008.6, e: 0.55, wide: true },
    { t: 2009.6, e: 1, text: "moved to the U.S., age 6", brief: "U.S., age 6", anchor: "start" },
    { t: 2013, e: 1 }, { t: 2016.5, e: 1 },
    { t: 2020, e: 1.25, text: "first job, age 17", anchor: "end", quiet: true },
    { t: 2023, e: 1.25 },
    { t: 2025.9, e: 1.95, text: "master's", anchor: "end", wide: true },
    { t: 2026.75, e: 2.55, text: "Ph.D. begins", brief: "Ph.D.", anchor: "end" },
    { t: 2028.3, e: 3.05, text: "comps", anchor: "middle", quiet: true },
    { t: 2029.8, e: 1.75, wide: true },
    { t: 2031.3, e: 2.95, text: "defense", anchor: "end", quiet: true },
    { t: 2033, e: 2 }
  ];

  // the catenary through p and q, each [year, energy]
  function wire(p, q, slack) {
    var a = (slack || 2) * (q[0] - p[0]);
    var x0 = (p[0] + q[0]) / 2 - a * Math.asinh((q[1] - p[1]) / (2 * a * Math.sinh((q[0] - p[0]) / (2 * a))));
    var c = p[1] - a * Math.cosh((p[0] - x0) / a);
    return function (x) { return a * Math.cosh((x - x0) / a) + c; };
  }
  function yearNow() {
    var d = new Date(), y = d.getUTCFullYear(), s = Date.UTC(y, 0, 1);
    return y + (d - s) / (Date.UTC(y + 1, 0, 1) - s);
  }
  var view = null, moving = !calm, visible = true, head = BORN - 1.5;

  // a lattice tower standing at (x, ground) with its peak at (x, top)
  function tower(x, ground, top, k, slim) {
    var h = ground - top, bw = Math.min(0.1 * h, 13 * k + 3) * (slim ? 0.6 : 1), tw = 2.2 * k, d = "", att = [];
    var f1 = function (n) { return Math.round(n * 10) / 10; };
    var half = function (y) { return tw + (bw - tw) * (y - top) / h; };   // body half-width at height y
    d += "M" + f1(x - bw) + " " + ground + "L" + f1(x - tw) + " " + f1(top + 2 * k) + "L" + f1(x) + " " + f1(top) + "L" + f1(x + tw) + " " + f1(top + 2 * k) + "L" + f1(x + bw) + " " + ground;
    var n = Math.max(2, Math.round(h / 20)), y0 = top + 36 * k;
    if (y0 < ground - 6) {
      for (var i = 0; i < n; i++) {
        var ya = y0 + (ground - y0) * i / n, yb = y0 + (ground - y0) * (i + 1) / n;
        d += "M" + f1(x - half(ya)) + " " + f1(ya) + "L" + f1(x + half(yb)) + " " + f1(yb) + "M" + f1(x + half(ya)) + " " + f1(ya) + "L" + f1(x - half(yb)) + " " + f1(yb);
        d += "M" + f1(x - half(ya)) + " " + f1(ya) + "H" + f1(x + half(ya));
      }
    }
    [[9, 10], [21, 13], [33, 16]].forEach(function (arm) {
      var y = top + arm[0] * k, L = arm[1] * k;
      d += "M" + f1(x - L) + " " + f1(y) + "H" + f1(x + L) + "M" + f1(x - L) + " " + f1(y) + "L" + f1(x) + " " + f1(y - 6 * k) + "L" + f1(x + L) + " " + f1(y);
      d += "M" + f1(x - L) + " " + f1(y) + "v" + f1(4 * k) + "M" + f1(x + L) + " " + f1(y) + "v" + f1(4 * k);
      att.push([x - L, y + 4 * k], [x + L, y + 4 * k]);
    });
    att.push([x, top]);            // the shield wire rides on the peak
    return { d: d, att: att };
  }

  function draw() {
    var W = Math.max(280, holder.clientWidth), small = W < 560, H = small ? 280 : 350;
    var m = { l: 56, r: 14, t: 14, b: 30 }, pw = W - m.l - m.r, ph = H - m.t - m.b, ground = m.t + ph;
    var now = Math.min(yearNow(), 2032);
    var X = function (t) { return m.l + (t - T0) / (T1 - T0) * pw; };
    var Tx = function (x) { return T0 + (x - m.l) / pw * (T1 - T0); };
    var Y = function (e) { return ground - e / TOP * ph; };
    var Ey = function (y) { return (ground - y) / ph * TOP; };
    var f1 = function (n) { return Math.round(n * 10) / 10; };
    var list = LIFE.filter(function (p) { return !(small && p.wide); });
    var o = "", x, y;

    o += '<clipPath id="plot-clip"><rect x="' + m.l + '" y="' + m.t + '" width="' + pw + '" height="' + ph + '"/></clipPath>';
    for (var yr = 2005; yr <= 2030; yr += small ? 10 : 5) {
      x = f1(X(yr));
      o += '<path class="tick" d="M' + x + " " + ground + 'v6"/><text x="' + x + '" y="' + (ground + 21) + '" text-anchor="middle">' + yr + "</text>";
    }
    [0, 1, 2, 3].forEach(function (v) {
      y = f1(Y(v));
      o += '<path class="tick" d="M' + m.l + " " + y + 'h-6"/><text transform="translate(' + (m.l - 11) + " " + y + ') rotate(-90)" text-anchor="middle">' + v + "</text>";
    });
    o += '<text transform="translate(13 ' + f1(m.t + ph / 2) + ') rotate(-90)" text-anchor="middle">Energy</text>';

    var built = list.map(function (p) {
      var top = Y(p.e), k = Math.min(1, Math.max(0.35, (ground - top) / 150)) * (small ? 0.62 : 1);
      return tower(X(p.t), ground, top, k, small);
    });

    // wires: seven per span, each a catenary in (year, energy) space
    var past = "", ahead = "", live = [], peak = [];
    for (var i = 0; i < built.length - 1; i++) {
      for (var j = 0; j < 7; j++) {
        var P = built[i].att[j], Q = built[i + 1].att[j];
        var fn = wire([Tx(P[0]), Ey(P[1])], [Tx(Q[0]), Ey(Q[1])], j === 6 ? 3 : 2);
        var a = "", b = "";
        for (x = P[0]; x < Q[0] + 1.5; x += 1.5) {
          var xx = Math.min(x, Q[0]), t = Tx(xx), pt = f1(xx) + " " + f1(Y(fn(t)));
          if (t <= now) a += (a ? "L" : "M") + pt; else b += (b ? "L" : "M") + pt;
        }
        past += a; ahead += b;
        if (j === 1) live.push({ from: Tx(P[0]), to: Tx(Q[0]), fn: fn });
        if (j === 6) peak.push({ from: list[i].t, to: list[i + 1].t, fn: wire([list[i].t, list[i].e], [list[i + 1].t, list[i + 1].e]) });
      }
    }
    var at = function (segs, t) {
      for (var s = 0; s < segs.length; s++) if (t >= segs[s].from && t <= segs[s].to) return segs[s].fn(t);
      return null;
    };

    o += '<g clip-path="url(#plot-clip)"><path class="wire ahead" d="' + ahead + '"/><path class="wire" d="' + past + '"/>';
    built.forEach(function (b, n) { o += '<path class="tower' + (list[n].t > now ? " ahead" : "") + '" d="' + b.d + '"/>'; });
    o += '<path class="charge" id="charge"/></g>';
    o += '<rect class="frame" x="' + m.l + '" y="' + m.t + '" width="' + pw + '" height="' + ph + '"/>';

    list.forEach(function (p) {
      if (!p.text || (small && p.quiet)) return;
      var dx = p.anchor === "end" ? -5 : p.anchor === "start" ? 5 : 0;
      o += '<text class="note" x="' + f1(X(p.t) + dx) + '" y="' + f1(Y(p.e) - 8) + '" text-anchor="' + p.anchor + '">' + (small && p.brief ? p.brief : p.text) + "</text>";
    });
    var nx = f1(X(now)), ny = f1(Y(at(live, now)));
    o += '<circle class="here" id="here" cx="' + nx + '" cy="' + ny + '" r="4.5"/>';
    o += '<text class="now-text" x="' + (nx + 9) + '" y="' + (ny + 4) + '">today</text>';

    holder.innerHTML = '<svg viewBox="0 0 ' + W + " " + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="A power line drawn across a chart of my life from 2002 to 2032. Each transmission tower is as tall as my energy at that time. The towers are short until 2008, rise sharply after I moved to the United States at six, step up at a first job at 17, and are tallest at the master\'s degree and the start of the Ph.D. Wires sag between the towers. After today the towers and wires are dotted, with tall towers planned for comprehensive exams and the defense. A pulse travels along a wire from birth to today.">' + o + "</svg>";
    view = { X: X, Y: Y, now: now, live: live, at: at, pxPerYear: pw / (T1 - T0), charge: holder.querySelector("#charge"), here: holder.querySelector("#here") };
    $("#live-out").textContent = at(peak, now).toFixed(2);
    pulse();
  }

  // a short burst of oscillation centred on `head`, riding on one conductor
  function pulse() {
    var v = view, d = "", from = Math.max(BORN, head - 1.5), to = Math.min(v.now, head + 1.5);
    for (var t = from; t <= to; t += 0.75 / v.pxPerYear) {
      var base = v.at(v.live, t);
      if (base === null) continue;
      var wob = 0.2 * Math.exp(-Math.pow((t - head) / 0.6, 2)) * Math.sin(2 * Math.PI * 3.2 * (t - head));
      d += (d ? "L" : "M") + Math.round(v.X(t) * 10) / 10 + " " + Math.round(v.Y(base + wob) * 10) / 10;
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
