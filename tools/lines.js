#!/usr/bin/env node
/*
  Draws the masthead figure: a transmission line receding toward the horizon.
  The conductors are true catenaries, y = a * cosh((x - x0) / a) + c.

  Usage:  node tools/lines.js
  Rewrites the SVG between the "lines:start" and "lines:end" markers in index.html.
*/
"use strict";
const fs = require("fs");
const path = require("path");

const f = (n) => Math.round(n * 10) / 10;

// Half-width of the tower body at relative height t (0 = ground, 1 = peak).
function hw(t) {
  if (t <= 0.55) return 0.13 + (0.04 - 0.13) * (t / 0.55);
  if (t <= 0.97) return 0.04 + (0.022 - 0.04) * ((t - 0.55) / 0.42);
  return 0.022 * (1 - (t - 0.97) / 0.03);
}

// A lattice tower with base centre (x, y) and height h.
// Returns the path and the seven points where conductors attach.
function tower(x, y, h) {
  let d = "";
  const att = [];
  const P = (dx, t) => f(x + dx * h) + " " + f(y - t * h);
  const seg = (a, b) => { d += "M" + a + "L" + b; };

  d += "M" + P(-0.13, 0) + "L" + P(-0.04, 0.55) + "L" + P(-0.022, 0.97) + "L" + P(0, 1) +
       "L" + P(0.022, 0.97) + "L" + P(0.04, 0.55) + "L" + P(0.13, 0);

  const levels = h > 110
    ? [0, 0.15, 0.28, 0.39, 0.48, 0.55, 0.64, 0.72, 0.8, 0.88, 0.97]
    : [0, 0.2, 0.38, 0.55, 0.69, 0.83, 0.97];
  for (let i = 0; i < levels.length - 1; i++) {
    const a = levels[i], b = levels[i + 1];
    if (i > 0) seg(P(-hw(a), a), P(hw(a), a));
    seg(P(-hw(a), a), P(hw(b), b));
    seg(P(hw(a), a), P(-hw(b), b));
  }

  // three cross-arms, each with an insulator string at the tip
  [[0.62, 0.27], [0.76, 0.215], [0.9, 0.16]].forEach(([t, len]) => {
    [-1, 1].forEach((s) => {
      d += "M" + P(s * hw(t), t) + "L" + P(s * len, t) + "L" + P(s * hw(t + 0.06), t + 0.06);
      seg(P(s * len, t), P(s * len, t - 0.045));
      att.push([x + s * len * h, y - (t - 0.045) * h]);
    });
  });
  att.push([x, y - h]); // earth wire at the peak
  return { d, att };
}

// Catenary through two points. SVG y grows downward, so work in flipped y.
function catenary(p, q, slack) {
  const x1 = p[0], x2 = q[0], y1 = -p[1], y2 = -q[1];
  const span = x2 - x1, a = span * slack;
  const x0 = (x1 + x2) / 2 - a * Math.asinh((y2 - y1) / (2 * a * Math.sinh(span / (2 * a))));
  const c = y1 - a * Math.cosh((x1 - x0) / a);
  const n = Math.max(12, Math.round(span / 14));
  let d = "";
  for (let i = 0; i <= n; i++) {
    const x = x1 + (span * i) / n;
    d += (i ? "L" : "M") + f(x) + " " + f(-(a * Math.cosh((x - x0) / a) + c));
  }
  return d;
}

function build() {
  const W = 1200, H = 252, AXIS = 240;
  // [x, ground y, height]; the first tower stands off the left edge
  const spec = [[-210, 236, 236], [118, 226, 176], [408, 219, 132], [640, 214, 100], [822, 210.5, 76],
                [962, 208, 58], [1070, 206.2, 44], [1152, 205, 34], [1216, 204, 26]];
  const ts = spec.map((s) => tower(s[0], s[1], s[2]));
  let wires = "", live = "";
  for (let i = 0; i < ts.length - 1; i++) {
    for (let j = 0; j < 7; j++) {
      const d = catenary(ts[i].att[j], ts[i + 1].att[j], j === 6 ? 2.6 : 1.7);
      wires += d;
      if (j === 1) live += d.replace(/^M/, i ? "L" : "M");
    }
  }
  let ticks = "";
  for (let x = 40; x < W; x += 80) ticks += "M" + x + " " + AXIS + "v6";
  return [
    '<svg class="lines" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="xMinYMax slice" aria-hidden="true" focusable="false">',
    '<path class="ln-wire" d="' + wires + '"/>',
    '<path class="ln-tower" d="' + ts.map((t) => t.d).join("") + '"/>',
    '<path class="ln-live" pathLength="1000" d="' + live + '"/>',
    '<path class="ln-axis" d="M0 ' + AXIS + "H" + W + ticks + '"/>',
    "</svg>"
  ].join("\n      ");
}

const file = path.join(__dirname, "..", "index.html");
const html = fs.readFileSync(file, "utf8");
const re = /(<!-- lines:start -->)[\s\S]*?(<!-- lines:end -->)/;
if (!re.test(html)) { console.error("markers not found in index.html"); process.exit(1); }
fs.writeFileSync(file, html.replace(re, "$1\n      " + build() + "\n      $2"));
console.log("index.html updated");
