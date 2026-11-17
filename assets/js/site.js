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
     Hours per week, stacked by what serves them, the way a grid operator
     draws load by source. The model matches the R code under "see the code!".
     Each band links to its section of the page. */
  var chunk = $("#chunk"), holder = $("#plot"), tip = $("#plot-tip"), said = $("#plot-live");
  var T0 = 2021.66, T1 = 2031.42, TOP = 120, PHD = 2026.6, WEEK = 1 / 52;
  var BANDS = ["software", "coursework", "industry", "methods", "teaching", "research"];   // bottom of the stack first
  var HREF = { software: "#software", coursework: "#education", industry: "#experience", methods: "#methods", teaching: "#teaching", research: "#research" };
  var INK = { software: "#111", coursework: "#111", industry: "#111", methods: "#fff", teaching: "#111", research: "#111" };
  var Z = [-1.28, -0.674, 0.674, 1.28], SPREAD = 0.06;                                 // 80% and 50% intervals
  function plogis(x) { return 1 / (1 + Math.exp(-x)); }
  function on(t, a, b) { return plogis(40 * (t - a)) - plogis(40 * (t - (b === undefined ? Infinity : b))); }
  function peak(t, at, h, w) { return h * Math.exp(-Math.pow((t - at) / (w || 0.04), 2)); }
  function frac(t) { return t - Math.floor(t); }
  function summer(t) { var f = frac(t); return plogis(60 * (f - 0.38)) - plogis(60 * (f - 0.62)); }
  // a week off: distance around the calendar to a fixed time of year
  function gap(t, at, w) { var d = Math.abs(frac(t) - at); d = Math.min(d, 1 - d); return Math.exp(-Math.pow(d / w, 2)); }
  // Holiday-adjusted, like seasonally adjusted data: holiday weeks are marked under the axis, not dipped.
  // Term-time load is flat through the B.S., then rises steadily from the M.I.P. to the defense.
  function trend(t) { return 38 + 8 * on(t, 2023.1, 2023.95) + 14 * Math.min(1, Math.max(0, (t - 2024.6) / 6.7)); }
  function load(t) {
    var s = summer(t), phd = on(t, PHD);
    var l = {
      software: 4 * on(t, 2025.6),
      coursework: (1 - s) * (28 * on(t, 2021.6, 2024.6) + 22 * on(t, 2024.6, 2025.4) + 8 * on(t, 2025.4, 2028.4)),
      industry: 2 + 8 * on(t, 2023.1, 2023.95) + s * (46 * on(t, 2021.6, 2024.6) + 20 * on(t, 2024.6, PHD)),
      methods: (1 - 0.5 * s) * (3 * on(t, 2021.6, 2024.6) + 8 * on(t, 2024.6, 2025.4) + 12 * on(t, 2025.4, PHD) +
        10 * on(t, PHD, 2028.4) + 6 * on(t, 2028.4)),
      teaching: (1 - s) * 10 * phd
    };
    var target = trend(t) + s * (t < 2024.6 ? 14 : 12), used = 0;   // summers run heavier
    ["software", "coursework", "industry", "methods", "teaching"].forEach(function (b) { used += l[b]; });
    l.research = Math.max(2, target - used);                         // research takes up the rest
    l.coursework += peak(t, 2025.37, 31);                            // crunch weeks
    l.methods += peak(t, 2028.3, 44);
    l.research += peak(t, 2023.2, 14) + peak(t, 2026.3, 33) + peak(t, 2029.3, 42) + peak(t, 2031.3, 38);
    return l;
  }
  function holiday(t) {   // how far into a holiday week t falls, 0 to 1
    return Math.max(gap(t, 0.905, 0.012), gap(t, 0.995, 0.022), gap(t, 0.505, 0.012), gap(t, 0.58, 0.012));
  }
  var HOLIDAYS = [[0.505, 0.012], [0.58, 0.012], [0.905, 0.012], [0.995, 0.022]];   // July 4, July 31, Thanksgiving, winter break
  function total(l) { return BANDS.reduce(function (a, b) { return a + l[b]; }, 0); }

  // events: row 1 is the top line of labels. s* fields are the phone layout; brief "" hides the label there.
  var EVENTS = [
    { at: 2023.2, text: "First conference", row: 3, brief: "" },
    { at: 2024.6, text: "M.I.P. begins", row: 2, brief: "M.I.P." },
    { at: 2025.37, text: "B.S. graduation", row: 3, brief: "B.S." },
    { at: 2026.3, text: "M.I.P. capstone", row: 2, anchor: "end", brief: "" },
    { at: 2026.6, text: "Ph.D. begins", row: 1, anchor: "end", brief: "Ph.D." },
    { at: 2028.3, text: "Comprehensive exams", row: 2, brief: "comps" },
    { at: 2029.3, text: "Prospectus", row: 1, brief: "" },
    { at: 2031.3, text: "Defense", row: 1, anchor: "end", brief: "defense" }
  ];
  var MONTHS = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "June", "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."];
  function yearNow() {
    var d = new Date(), y = d.getUTCFullYear(), s0 = Date.UTC(y, 0, 1);
    return y + (d - s0) / (Date.UTC(y + 1, 0, 1) - s0);
  }
  function monthOf(t) { var y = Math.floor(t); return MONTHS[Math.min(11, Math.floor((t - y) * 12))] + " " + y; }
  function season(t) {
    var y = Math.floor(t), m = Math.floor((t - y) * 12);
    return (m < 5 ? "Spring " : m < 7 ? "Summer " : "Fall ") + y;
  }
  var view = null, now = Math.min(Math.max(yearNow(), T0), T1), cursorT = now;

  function draw(animate) {
    var W = Math.max(280, holder.clientWidth), small = W < 560, H = small ? 300 : 370;
    var m = { l: 56, r: small ? 10 : 34, t: 34, b: 30 }, pw = W - m.l - m.r, ph = H - m.t - m.b, base = m.t + ph;
    var X = function (t) { return m.l + (t - T0) / (T1 - T0) * pw; };
    var Y = function (v) { return base - v / TOP * ph; };
    var f1 = function (n) { return Math.round(n * 10) / 10; };
    var N = Math.round(pw), ts = [], cum = [];
    var span = (T1 - T0) / N;
    for (var i = 0; i <= N; i++) {
      var t = T0 + span * i, run = 0, row = {}, avg = {};
      BANDS.forEach(function (b) { avg[b] = 0; });
      for (var q = 0; q < 4; q++) {
        var lq = load(t + span * ((q + 0.5) / 4 - 0.5));
        BANDS.forEach(function (b) { avg[b] += lq[b] / 4; });
      }
      BANDS.forEach(function (b) { run += avg[b]; row[b] = run; });
      ts.push(t); cum.push(row);
    }
    var topBand = BANDS[BANDS.length - 1];
    function edge(k) { var d = ""; for (var j = 0; j <= N; j++) d += (j ? "L" : "M") + f1(X(ts[j])) + " " + f1(Y(cum[j][BANDS[k]])); return d; }
    function back(k) { var d = ""; for (var j = N; j >= 0; j--) d += "L" + f1(X(ts[j])) + " " + f1(Y(k >= 0 ? cum[j][BANDS[k]] : 0)); return d; }
    var bands = "";
    BANDS.forEach(function (b, k) {
      bands += '<a href="' + HREF[b] + '" tabindex="-1" data-band="' + b + '"><path class="band ' + b + '" d="' + edge(k) + back(k - 1) + 'Z"/></a>';
    });
    var stackArea = edge(BANDS.length - 1) + back(-1) + "Z";

    // forecast interval around the projected total
    var fan = function (z1, z2) {
      var up = "", dn = "";
      for (var j = 0; j <= N; j++) {
        if (ts[j] < now - 0.02) continue;
        var tot = cum[j][topBand], h = Math.max(0, ts[j] - now);
        up += (up ? "L" : "M") + f1(X(ts[j])) + " " + f1(Y(tot * Math.exp(z2 * SPREAD * Math.sqrt(h))));
        dn = "L" + f1(X(ts[j])) + " " + f1(Y(tot * Math.exp(z1 * SPREAD * Math.sqrt(h)))) + dn;
      }
      return up + dn + "Z";
    };
    var median = "";
    for (i = 0; i <= N; i++) if (ts[i] >= now - 0.02) median += (median ? "L" : "M") + f1(X(ts[i])) + " " + f1(Y(cum[i][topBand]));

    var nx = f1(X(now)), o = "", x, y;
    o += '<defs>' +
      '<clipPath id="clip-past" class="' + (animate ? "reveal" : "") + '"><rect x="' + m.l + '" y="0" width="' + f1(nx - m.l) + '" height="' + base + '"/></clipPath>' +
      '<clipPath id="clip-ahead" class="' + (animate ? "reveal" : "") + '"><rect x="' + m.l + '" y="0" width="' + pw + '" height="' + base + '"/></clipPath>' +
      '<clipPath id="clip-right"><rect x="' + nx + '" y="0" width="' + f1(m.l + pw - nx) + '" height="' + base + '"/></clipPath>' +
      '<pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path class="hatch" d="M0 0V6"/></pattern>' +
      "</defs>";

    o += '<rect class="proj" x="' + nx + '" y="' + m.t + '" width="' + f1(m.l + pw - nx) + '" height="' + ph + '"/>';
    [20, 40, 60, 80, 100, 120].forEach(function (v) { y = f1(Y(v)); o += '<path class="grid" d="M' + m.l + " " + y + "H" + (m.l + pw) + '"/>'; });
    o += '<g clip-path="url(#clip-ahead)"><g class="ahead" clip-path="url(#clip-right)">' + bands +
         '<path class="hatched" d="' + stackArea + '"/>' +
         '<path class="fan80" d="' + fan(Z[0], Z[3]) + '"/><path class="fan50" d="' + fan(Z[1], Z[2]) + '"/>' +
         '<path class="median" d="' + median + '"/></g></g>';
    o += '<g clip-path="url(#clip-past)">' + bands + '<path class="demand" d="' + edge(BANDS.length - 1) + '"/></g>';
    o += '<path class="axis" d="M' + m.l + " " + base + "H" + (m.l + pw) + '"/>';
    var rug = "";
    for (var hy = Math.floor(T0); hy <= Math.ceil(T1); hy++) {
      HOLIDAYS.forEach(function (hd) {
        var c = hy + hd[0], half = hd[1] * 1.6;
        if (c - half < T0 || c + half > T1) return;
        var a = X(c - half), b2 = X(c + half);
        rug += "M" + f1(a) + " " + (base + 2) + "H" + f1(Math.max(b2, a + 1.5)) + "v3H" + f1(a) + "z";
      });
    }
    o += '<path class="rug" d="' + rug + '"/>';

    [0, 20, 40, 60, 80, 100, 120].forEach(function (v) { o += '<text x="' + (m.l - 8) + '" y="' + f1(Y(v) + 4) + '" text-anchor="end">' + v + "</text>"; });
    o += '<text class="ytitle" transform="translate(14 ' + f1(m.t + ph / 2) + ') rotate(-90)" text-anchor="middle">Demand (hours per week)</text>';
    for (var yr = 2022; yr <= 2031; yr += small ? 2 : 1) {
      x = f1(X(yr));
      o += '<path class="tick" d="M' + x + " " + base + 'v5"/><text x="' + x + '" y="' + (base + 20) + '" text-anchor="middle">' + yr + "</text>";
    }
    if (!small) {
      var endT = cum[N][topBand], endH = Math.max(0, T1 - now);
      o += '<text class="fan-label" x="' + (m.l + pw + 4) + '" y="' + f1(Y(endT * Math.exp(1.28 * SPREAD * Math.sqrt(endH))) + 4) + '">80%</text>';
      o += '<text class="fan-label" x="' + (m.l + pw + 4) + '" y="' + f1(Y(endT * Math.exp(0.674 * SPREAD * Math.sqrt(endH))) + 4) + '">50%</text>';
    }

    // where observation ends
    o += '<path class="today" d="M' + nx + " " + (m.t - 6) + "V" + base + '"/>';
    o += '<text class="today-text" x="' + nx + '" y="' + (m.t - 10) + '" text-anchor="middle">' + monthOf(now) + "</text>";
    var rowY = function (r) { return m.t + 14 + (r - 1) * 16; };
    o += '<text class="proj-text" x="' + (nx + 6) + '" y="' + rowY(1) + '">projected →</text>';

    // events: a diamond on the top of the stack, a thin leader, and a label on its row
    EVENTS.forEach(function (ev) {
      var label = small ? ev.brief : ev.text, ahead = ev.at > now;
      var near = Math.max(0, Math.min(N, Math.round((ev.at - T0) / span))), win = cum[near][topBand];
      for (var d = -2; d <= 2; d++) { var jj = Math.max(0, Math.min(N, near + d)); win = Math.max(win, cum[jj][topBand]); }
      var ex = f1(X(ev.at)), ey = f1(Y(win)), anchor = ev.anchor || "middle";
      if (label) {
        var ly = rowY(ev.row), dx = anchor === "end" ? 3 : 0;
        o += '<path class="leader" d="M' + ex + " " + (ly + 4) + "V" + (ey - 6) + '"/>';
        o += '<text class="event' + (ahead ? " ev-ahead" : "") + '" x="' + f1(ex + dx) + '" y="' + ly + '" text-anchor="' + anchor + '">' + label + "</text>";
      }
      o += '<path class="diamond' + (ahead ? " ev-ahead" : "") + '" d="M' + ex + " " + (ey - 5) + "l4.5 5-4.5 5-4.5-5z" + '"/>';
    });

    // direct labels, on the solid side when the band fits there
    var cut = Math.round((nx - m.l) / pw * N);
    BANDS.forEach(function (b, k) {
      var half = Math.ceil((b.length * 6.6 + 10) / 2);
      function corridor(c) {   // highest floor and lowest ceiling across the label's width
        var lo = -Infinity, hi = Infinity;
        for (var j = c - half; j <= c + half; j++) {
          lo = Math.max(lo, k ? cum[j][BANDS[k - 1]] : 0);
          hi = Math.min(hi, cum[j][b]);
        }
        return { lo: lo, hi: hi, room: (hi - lo) / TOP * ph };
      }
      function search(from, to) {
        var best = null, bestR = 0;
        for (var c = Math.max(from, half + 4); c <= Math.min(to, N - half - 4); c += 2) {
          var r = corridor(c).room;
          if (r > bestR) { bestR = r; best = c; }
        }
        return bestR >= 14 ? best : null;
      }
      var at = search(0, cut - half - 2), past = at !== null;
      if (!past) at = search(cut + half + 2, N);
      if (at === null) return;
      var cr = corridor(at), mid = (cr.lo + cr.hi) / 2;
      o += '<text class="blabel" x="' + f1(X(ts[at])) + '" y="' + f1(Y(mid) + 4) + '" text-anchor="middle" style="fill:' +
        (past ? INK[b] : "var(--text)") + ";stroke:" + (past ? "var(--b-" + b + ")" : "var(--proj-bg)") + '">' + b + "</text>";
    });

    o += '<path class="cross" id="cross" d="" visibility="hidden"/><g id="dots"></g>';
    holder.innerHTML = '<svg viewBox="0 0 ' + W + " " + H + '" width="' + W + '" height="' + H + '" tabindex="0" role="img" aria-label="' +
      'Stacked area chart of my hours per week from fall 2021 to 2031, by what fills them, adjusted for holidays. School terms hold near 40 hours ' +
      'through the B.S., then rise steadily from the M.I.P. to the defense, to about 52. Summers run 50 to 60. Crunch weeks reach about 75 before the Ph.D. and about 90 during it. ' +
      'Everything after ' + monthOf(now) + ' is projected, with 50 and 80 percent intervals. Use the left and right arrow keys to read values.">' + o + "</svg>";
    view = { X: X, Y: Y, m: m, pw: pw, ph: ph, W: W, H: H, svg: holder.querySelector("svg") };
    wireSvg();

    var l0 = load(now), order = BANDS.slice().reverse(), vals = order.map(function (b) { return String(Math.round(l0[b])); });
    var w = order.map(function (n, j) { return Math.max(n.length, vals[j].length); });
    var padL = function (t, n) { return new Array(n - t.length + 1).join(" ") + t; };
    $("#live-out").textContent = "## " + order.map(function (n, j) { return padL(n, w[j]); }).join(" ") + "\n## " +
      vals.map(function (v, j) { return padL(v, w[j]); }).join(" ");
  }

  // highlight a band everywhere it appears (plot and legend)
  function focus(band) {
    holder.classList.toggle("focus", !!band);
    $$("#plot .band").forEach(function (p) { p.classList.toggle("on", !!band && p.classList.contains(band)); });
    $$(".legend a").forEach(function (a) { a.classList.toggle("on", a.getAttribute("data-band") === band); });
  }

  // crosshair, edge dots, and the tooltip for week t
  function readout(t, under, announce) {
    var v = view, l = load(t), x = v.X(t), run = 0, dots = "";
    BANDS.forEach(function (b) { run += l[b]; dots += '<circle class="dot ' + b + '" cx="' + x.toFixed(1) + '" cy="' + v.Y(run).toFixed(1) + '" r="3"/>'; });
    var cross = $("#cross");
    cross.setAttribute("d", "M" + x.toFixed(1) + " " + v.m.t + "V" + (v.m.t + v.ph));
    cross.setAttribute("visibility", "visible");
    $("#dots").innerHTML = dots;
    var ahead = t > now, head = season(t) + (ahead ? ' <em>projected</em>' : "");
    var rows = BANDS.slice().reverse().map(function (b) {
      return '<tr' + (b === under ? ' class="on"' : "") + '><td><span class="sw ' + b + '"></span>' + b + "</td><td>" + Math.round(l[b]) + "</td></tr>";
    }).join("");
    var tot = Math.round(run), band = "";
    if (ahead) {
      var h = Math.max(0, t - now);
      band = '<div class="tip-pi">80% interval ' + Math.round(run * Math.exp(Z[0] * SPREAD * Math.sqrt(h))) + " to " +
        Math.round(run * Math.exp(Z[3] * SPREAD * Math.sqrt(h))) + "</div>";
    }
    var hw = holiday(t) > 0.5 ? '<div class="tip-pi">holiday week, about ' + Math.round(run * 0.2) + " h actual</div>" : "";
    tip.innerHTML = '<div class="tip-h">' + head + "</div><table>" + rows + '</table><div class="tip-t">total<b>' + tot + " h/week</b></div>" + band + hw +
      (under ? '<div class="tip-f">click: ' + under + "</div>" : "");
    var r = v.svg.getBoundingClientRect(), k = r.width / v.W, left = x > v.m.l + v.pw * 0.55;
    tip.hidden = false;
    var px = x * k, tw = tip.offsetWidth;
    tip.style.left = Math.round(left ? px - tw - 12 : px + 12) + "px";
    tip.style.top = Math.round((v.m.t + 4) * k) + "px";
    if (announce) said.textContent = season(t) + (ahead ? ", projected" : "") + ": " + tot + " hours per week. " +
      BANDS.slice().reverse().map(function (b) { return b + " " + Math.round(l[b]); }).join(", ") + ".";
  }
  function hide() {
    if (!view) return;
    $("#cross").setAttribute("visibility", "hidden");
    $("#dots").innerHTML = "";
    tip.hidden = true;
  }
  function snap(t) { return T0 + Math.round((t - T0) / WEEK) * WEEK; }

  function wireSvg() {
    var svg = view.svg;
    svg.addEventListener("focus", function () { readout(cursorT, null, true); });
    svg.addEventListener("blur", hide);
    svg.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        cursorT = Math.min(T1, Math.max(T0, cursorT + (e.key === "ArrowLeft" ? -1 : 1) / 12));
        readout(cursorT, null, true);
        e.preventDefault();
      } else if (e.key === "Escape") { hide(); }
    });
  }

  function track(e) {
    var v = view, r = v.svg.getBoundingClientRect(), k = v.W / r.width;
    var px = (e.clientX - r.left) * k, py = (e.clientY - r.top) * k;
    if (px < v.m.l || px > v.m.l + v.pw || py < v.m.t || py > v.m.t + v.ph) { hide(); return; }
    var t = snap(T0 + (px - v.m.l) / v.pw * (T1 - T0)), l = load(t), val = (v.m.t + v.ph - py) / v.ph * TOP, run = 0, under = null;
    BANDS.forEach(function (b) { if (!under && val <= run + l[b]) under = b; run += l[b]; });
    readout(t, under, false);
  }

  chunk.hidden = false;
  draw(!calm);
  holder.addEventListener("pointerover", function (e) {
    var a = e.target.closest("[data-band]");
    focus(a ? a.getAttribute("data-band") : null);
  });
  holder.addEventListener("pointermove", track);
  holder.addEventListener("pointerleave", function () { focus(null); hide(); });
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
    redraw = setTimeout(function () { if (holder.clientWidth !== lastW) { lastW = holder.clientWidth; hide(); draw(false); } }, 120);
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
