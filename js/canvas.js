/* =============================================================
   Background: a de Jong strange attractor, rendered mostly as a
   dense point cloud with an occasional connecting line.

   Connecting every consecutive iteration of a chaotic map with
   straight lines is what produced the "jagged" look in the old
   version -- each step can jump in a different direction, so a
   full polyline through them reads as scribble. Plotting only
   soft dots (as this file used to) loses all of that traced,
   wiry motion. Drawing a line every so often -- most points as
   dots, a thin stroke every LINE_EVERY-th step -- keeps the
   smooth glowing lobes but still shows the trajectory being
   traced through them.

   The parameter set (A/B/C/D) is re-randomized around a
   hand-picked, known-good center on every page load, so the
   shape varies between visits without wandering into the fully
   diffuse, unrecognizable territory a wide-open random range can
   produce.
 * ============================================================= */
(function () {
  'use strict';

  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');

  var styles = getComputedStyle(document.documentElement);
  var inkColor = (styles.getPropertyValue('--color-ink') || '#14151a').trim();
  var accentColor = (styles.getPropertyValue('--color-accent') || '#6f1d31').trim();

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var width = 0;
  var height = 0;

  function jitter(center, spread) {
    return center + (Math.random() * spread - spread / 2);
  }

  // Hand-picked de Jong center that settles into a small number of
  // clear looping lobes, jittered by +/-0.5 per axis so each page
  // load gets its own variant without straying into diffuse noise.
  var A = jitter(1.40, 1.0);
  var B = jitter(-2.30, 1.0);
  var C = jitter(2.40, 1.0);
  var D = jitter(-2.10, 1.0);

  var x = 0.1;
  var y = 0.1;
  var angle = 0; // slow global rotation, so the whole cloud drifts
  var lastRx = null; // previous rotated point, for the occasional
  var lastRy = null; // connecting line

  function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
  }
  window.addEventListener('resize', resizeCanvas, false);
  resizeCanvas();

  // Map attractor space to a comfortable fraction of the shorter
  // viewport dimension, so the loop and wingtips stay inside the
  // visible area on both narrow and wide screens.
  function scaleFor() {
    return Math.min(width, height) * 0.32;
  }

  function step() {
    var xNew = Math.sin(A * y) - Math.cos(B * x);
    var yNew = Math.sin(C * x) - Math.cos(D * y);
    x = xNew;
    y = yNew;
  }

  function plot(px, py, color, alpha, radius) {
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function connect(fromX, fromY, toX, toY, color, alpha) {
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
  }

  var LINE_EVERY = 17; // draw a connecting stroke on roughly 1 in 17 points

  function drawBatch(count) {
    var scale = scaleFor();
    var cos = Math.cos(angle);
    var sin = Math.sin(angle);

    for (var i = 0; i < count; i++) {
      step();

      var px = x * scale;
      var py = y * scale;
      // Slow rotation of the whole point cloud around the canvas
      // centre -- this is what gives the "slow loops" motion; the
      // attractor's own shape stays fixed, the view of it drifts.
      var rx = px * cos - py * sin;
      var ry = px * sin + py * cos;

      // Mostly ink-colored dots with an occasional accent dot,
      // for a little depth without turning the whole thing pink.
      var useAccent = (i % 9) === 0;
      plot(rx, ry, useAccent ? accentColor : inkColor, useAccent ? 0.16 : 0.09, 1.1);

      // Every so often, trace the step just taken with a thin line
      // instead of only a dot -- a hint of the old wiry look without
      // going back to a full scribble of connected jumps.
      if (lastRx !== null && (i % LINE_EVERY) === 0) {
        connect(lastRx, lastRy, rx, ry, accentColor, 0.1);
      }
      lastRx = rx;
      lastRy = ry;
    }
  }

  function frameSetup() {
    // Shift the origin up from dead-center: this attractor's loop
    // sits below its own origin, so nudging up keeps both the
    // wingtips and the loop comfortably inside typical viewports.
    ctx.setTransform(dpr, 0, 0, dpr, (width / 2) * dpr, (height * 0.42) * dpr);
  }

  // Pre-warm: plot many points instantly on load so the full
  // attractor shape is visible immediately on every page, rather
  // than slowly accumulating from a blank canvas each time you
  // navigate to a fresh page.
  function prewarm() {
    frameSetup();
    for (var i = 0; i < 400; i++) { step(); } // discard transient
    drawBatch(220000);
  }

  var ROTATION_SPEED = 0.00035; // radians per frame -- slow drift
  var FADE_ALPHA = 0.012;       // very light fade so the shape lingers
  var POINTS_PER_FRAME = 400;
  var FRAME_INTERVAL = 60;

  function fade() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = FADE_ALPHA;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1;
  }

  function drawLoop() {
    fade();
    frameSetup();
    drawBatch(POINTS_PER_FRAME);
    angle += ROTATION_SPEED;
    ctx.globalAlpha = 1;
    setTimeout(drawLoop, FRAME_INTERVAL);
  }

  resizeCanvas();
  prewarm();
  drawLoop();
})();
