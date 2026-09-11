# Concerts: complete archive from the CSV (latest)

Rebuilt `concerts.html` from the full CSV export instead of the row-capped web view. This is the
real, complete dataset:

- **447 shows, 2012–2025** (no shows in 2020), across **six** bands — the sheet also tracks a band
  called **Ancst** that isn't currently on your Music page, in case that's an oversight rather than
  intentional.
- Organized as one table per year, most recent first, with a jump-to-year nav at the top of the
  page so a 447-row archive is still easy to navigate.
- City includes the country when the show was outside Germany (e.g. "Zürich CH", "London UK") —
  blank means Germany, matching the sheet's own convention.
- Shows with two bands sharing a bill on the same night (there are a handful, mostly Ancst +
  Henry Fonda) show both band names.

**A parsing bug I caught and fixed before shipping this**: my first pass carried the country code
down across rows the same way it carries the date/city down for multi-show entries on one date.
That's correct for date/city (the sheet leaves them blank to mean "same as the row above") but
wrong for country — it was leaving cities like Dresden and Leipzig incorrectly tagged with the
country of whatever foreign show happened to precede them in the sheet. Fixed so country is only
read from its own row, never inherited.

**One remaining discrepancy, transparently**: the sheet's own per-year tallies (e.g. "55" for 2012)
add up to 445 total, but counting actual data rows gives 447. This is the same off-by-a-couple gap
as before, now spread slightly differently across years, and I still can't tell you which specific
row(s) it comes from — most likely one or two instances of the "blank date = same show, not a new
one" ambiguity I flagged previously (a small number of rows share a date with the row above but
list a different venue). I've kept every row as its own show rather than silently dropping any,
since I'd rather show slightly too much real data than guess wrong about what to cut.

# Nav update: Technical removed, Concerts added (previous pass)

**Removed** the Technical tab and `engineering.html` entirely, and updated the nav on every page.

**Added `concerts.html`**, a show-history table pulled from the "All the Shows" spreadsheet you
linked. Important limitation: that sheet is view-only and not published to the web, so the only
way I could read it was Google's no-JavaScript fallback rendering — which caps out at 100 rows.
That gave me the complete, real 2012 season (56 shows, sorted chronologically, with date/city/venue/
band/support pulled directly from the sheet) and the start of 2013, which I left out rather than
ship a visibly incomplete year. The sheet's own summary cell says 445 shows total across many more
years for five bands (Afterlife Kids, Flyktpunkt, Henry Fonda, Yacht Communism, Kara Delik) — I
could not reach the other ~390.

To get the rest onto the page, either:
- **File → Share → Publish to web** on the sheet (Google's publish view isn't row-limited the way
  the plain share link is), and send me that link, or
- Export it yourself (File → Download → CSV) and paste/attach the data directly.

Either way I can drop the remaining years straight into the same table structure — it's built to
extend, just add another `<section class="concerts-section">` block per year.

One data note: the sheet's own tally cell says 55 shows for 2012, but I count 56 distinct
date+venue+support combinations in the raw rows. A couple of rows share a date with the row above
(blank date cell, e.g. two Berlin shows both dated 02.03.) — I read that as "two separate shows,
same date" rather than one row being an error, since each has its own distinct venue and support
acts, but I can't rule out that one of those was meant to be a merged cell for a single show. Worth
a quick check against the original if the exact count matters to you.

# Animation, layout & font pass (previous pass)

**The animation was scribbly because it was drawing the wrong thing.** Connecting each iteration
of a chaotic attractor map to the next with a straight line will always look jagged — consecutive
points don't move smoothly, so a polyline through them reads as scribble. Real strange-attractor
renders (the smooth, glowing, looping ones) plot every iterated point as a tiny soft dot; over tens
of thousands of points the dots overlap into the smooth lobes where the trajectory spends most of
its time — informally, the "centers of gravity" you asked for. I rewrote `canvas.js` around that:

- Switched from connected line segments to a dot/density render — each dot is a small
  low-alpha circle (inherently anti-aliased, no jagged edges at all).
- Picked a fixed, hand-verified de Jong parameter set that settles into a small number of clear
  looping lobes, instead of the old randomized parameters (which could just as easily produce an
  ugly diffuse scatter as a nice shape — regenerated on every page load with no quality control).
- Added a slow, continuous rotation of the whole point cloud around the canvas center, so the
  shape visibly drifts in slow loops rather than sitting static or jittering.
- **Pre-warms** ~220,000 points instantly on load (a tight synchronous loop, well under a second)
  so the full attractor shape is there immediately, then continues adding a small batch of points
  each frame afterward. Frame interval slowed to 60ms with a very light fade, so the shape lingers
  and evolves gently rather than repeatedly flickering back to blank.

**Why other pages seemed to "cover" the animation — the real bug.** `body` had its own explicit
white `background` in the CSS. Per how CSS actually paints stacking contexts, an element's own
background can end up layered *above* a negative-`z-index` descendant like the canvas, for
whatever height that element's box extends to. On pages with a lot of content, body's box was
often taller than what fit on screen, so the canvas peeked through only in the empty margin at the
bottom (which is what made it look like each page was "cutting off" the animation at different
points). On the new empty landing page, `main--landing`'s `min-height: 100vh` made body's box
cover the *entire* viewport, hiding the canvas completely — which is what you were seeing.
Removing the background from `body` (keeping it only on `html`, which doesn't have this problem)
fixes it everywhere at once, consistently, with no per-page workaround needed.

**Homepage is now empty.** `index.html` is a bare landing page (header + nav + the animation,
`<div id="content"></div>` with nothing in it) so the full attractor is visible uninterrupted. The
bio content that used to live there moved to a real `bio.html`, and every page's "Bio" nav link now
points there instead of at the homepage. The router was updated to swap the whole `<main>` element
(not just its inner content) so the `main--landing` class — which removes padding for the landing
page — correctly comes and goes as you navigate between the empty homepage and the content pages
via the in-app AJAX router, instead of leaving stale padding behind.

**Font: switched to Satoshi.** I can't download the actual Satoshi font files from this sandbox (no
outbound network access on my end), so this uses Fontshare's official CDN link in each page's
`<head>` — the same approach already used for Font Awesome. Your visitors' browsers fetch it
directly; nothing needs to be self-hosted. This also directly solves "bolder menu and titles": the
previous font (Space Grotesk) only shipped one weight in your repo's font files, so headings and
nav were stuck looking the same regardless of `font-weight`. Satoshi's CDN bundle includes a real
700 (bold) weight, now applied to the logo, nav links, `h1`, and `h3`. The unused, self-hosted
Space Grotesk font files have been removed from this package since nothing references them anymore.

I rendered every page (including in-app AJAX navigation between the empty landing page and content
pages, and the mobile menu) with a headless browser before finalizing this, rather than checking
the CSS/JS by eye alone — that's how the body-background bug above was actually caught.

# Visual redesign (previous pass)

Switched the whole site from the dark full-bleed canvas look to a white, sans-serif, editorial
layout. Specifics:

**Color & type** — white background, near-black ink (`#14151A`) for text, one accent color
(`#C7365F`, a deep raspberry-red — a darkened, more saturated version of the salmon-pink `#ff9b9b`
already used for links, not a new brand). Headings, the logo, and nav now use **Space Grotesk** —
which was already sitting unused in `css/fonts/` — self-hosted via `@font-face`, with body text in
the system sans-serif stack. Only the regular weight of Space Grotesk exists in the font files, so
heading hierarchy is carried by size and letter-spacing rather than bold weight.

**Layout** — text pages use a single centered column capped at a comfortable reading width. The
`works.html` gallery was rebuilt from floated divs with a hard 400px-tall cropped box into a proper
CSS grid with alternating image/text sides and `object-fit: cover` on the images — while doing
this I also fixed duplicate `id="pic1"`/`id="pic2"`/`id="info"` attributes repeated across multiple
sections on the same page, which is invalid HTML (IDs must be unique per page); these are now
classes (`.entry-media`, `.entry-text`, with a `.flip` modifier for alternating sides).
`music.html`'s 15 Bandcamp players moved from manual `<br>` line breaks into a responsive CSS grid
(`.player-grid`) that reflows based on available width instead of a fixed manual layout.

**The background animation** — recolored for the light theme (soft raspberry lines, faint ink
dots, instead of white pixels on black), given rounded line caps/joins and a soft shadow blur for
smoother edges, scaled for `devicePixelRatio` so it isn't jagged on retina screens, and slowed from
a 66ms to a 130ms frame interval (roughly half speed). Overall opacity was also reduced so it reads
as a quiet texture behind the content rather than competing with it.

**Fixed while in there**: a broken `a:active` CSS rule that had no `{ }` block of its own and got
silently absorbed into the following `a:hover` selector as an unintended compound selector; and a
mobile-header layout bug where the hamburger toggle and the nav panel (also a flex child of
`header`, since `display:flex` overrides the old float-based layout) could push the logo text onto
two lines and overlap the toggle button — fixed by giving the logo `flex: 0 0 auto; white-space:
nowrap` and explicit `order` values on the header's children.

I rendered every page with a headless browser at desktop and mobile widths (including opening the
mobile menu) to check this before handing it over, rather than only checking the CSS/JS by eye.

# The core bug (previous pass)

Your site's navigation was fundamentally broken, and it wasn't in the file I looked at last time —
it was in `js/canvas.js`, at the very bottom:

```js
$(document).ready(function() {
    $('#main').load('/landing.html');
    $('#nav a').click(function(e) {
      e.preventDefault();
      $("#main").load(e.target.href);
    })
});
```

Three separate problems here:

1. **`landing.html` is a 0-byte empty file.** Every visitor lands on a blank page until they click
   something.
2. **The nav links point to `/bio`, `/works`, etc. — no `.html`.** The real files are `bio.html`,
   `works.html`. Every click fetches a URL that doesn't exist, fails silently, and nothing happens.
3. **`fixed-responsive-nav.js` throws an error on every page load**, because it tries
   `document.getElementById("/bio").offsetTop` — no element has that ID, so `getElementById`
   returns `null`, and calling `.offsetTop` on `null` crashes the script. That error aborts
   everything *after* it in that file, which includes the code that lets you tap outside the
   mobile menu to close it. (This file's logic was written for a single, long page with in-page
   anchors like `#bio` — the version of this template it was adapted from. It was never fully
   converted when the site moved to separate `bio.html`/`works.html`/etc. files.)

I rebuilt the navigation properly instead of patching around it — see below.

# What changed

## Architecture: real pages + progressive enhancement
Every page (`index.html`, `works.html`, `music.html`, `engineering.html`, `contact.html`) is now
a **complete, valid, styled HTML document** with its actual content — not a bare fragment. This
means:
- Visiting any URL directly works and looks right, with no JavaScript required.
- Search engines and screen readers see real content immediately, not an empty `<div>`.
- If a script fails to load, the site still fully works — links are just normal links.

`bio.html` now redirects to `index.html` (the homepage *is* the bio page now, since a separate
empty `landing.html` was serving no purpose). This avoids duplicate content while still working
for anyone who has the old URL bookmarked.

## New file: `js/router.js`
Replaces the broken jQuery `.load()` snippet. On nav click, it `fetch()`es the target page,
extracts its `#content`, swaps it in, updates the active nav highlight, and pushes real browser
history — so back/forward buttons work correctly. If a fetch fails, it shows a friendly message
with a direct link instead of silently doing nothing.

## `js/canvas.js`
Stripped down to just the background animation (navigation logic moved to `router.js`). Also fixed
two real bugs while I was in there:
- **Dropped jQuery entirely.** It was only used for `.load()` and `.ready()`, both trivial in
  vanilla JS — this removes a whole ~90KB dependency and a CDN request.
- **Fixed a cumulative-transform bug**: `resizeCanvas()` called `ctx.translate(x, y)` on every
  resize, but `translate()` is additive — each resize nudged the drawing origin further off-center
  instead of recentering it. Switched to `ctx.setTransform()`, which sets an absolute transform.
- Removed the duplicate `initialize()`/`resizeCanvas()` function declarations (the file defined
  each twice; the second silently overwrote the first — harmless in practice but confusing).

## `js/fixed-responsive-nav.js`
Removed the single-page anchor scroll-spy code that was crashing on load (see "core bug" above).
What's left is what this file's name actually suggests: FastClick, the mobile hamburger toggle,
and the tap-the-background-to-close-menu behavior — which now actually runs, since nothing crashes
before reaching it.

## `css/styles2.css`
- **Fixed a broken `a:active` rule.** It previously had no `{ }` block at all and got silently
  absorbed into the next selector, so `a:active a:hover { outline: 0; }` was actually one unintended
  compound selector — `a:active` had no styling of its own. Split back into two real rules.
- **Scoped the fixed `height: 400px; overflow: hidden` to a new `.gallery-item` class**, applied
  only to the works/sound entries. Previously this applied to *every* `<section>` on the site,
  which could clip the bio or contact text if it ran longer than 400px tall.
- Applied the `Lora` font (declared via `@font-face` but never actually assigned to anything) to
  `body`. Easy to remove if you'd rather keep the default font — just delete the
  `font-family: 'lora', serif;` line.

## HTML fixes (carried over from the earlier pass, now applied to full pages)
- Valid markup throughout (`<html lang="en">`, no orphaned `</style>` tag, no invalid `</br>`).
- One `<h1>` per page instead of multiple.
- `contact.html`'s email is now a clickable `mailto:` link.
- `loading="lazy"` on all images and the 15 Bandcamp iframes on `music.html` (previously all 15
  loaded eagerly on page load).
- `title` attributes added to the iframes (accessibility requirement).
- Better, more descriptive `alt` text on images.
- `rel="noopener noreferrer"` on external links.
- Font Awesome bumped 4.7.0 → 6.5.2, loaded with a Subresource Integrity hash.

# Files to delete from the repo (safe — confirmed unused)

- **`landing.html`** — empty (0 bytes), no longer referenced.
- **`css/style.css`** and **`css/styles.css`** — neither is linked from any HTML page; only
  `styles2.css` is actually used.
- **`js/scroll.js`** — a smooth-scroll library for in-page anchors that doesn't apply to this
  site's page-based navigation. It was also firing on every nav click and throwing a
  `SyntaxError` internally (`document.querySelector('/bio')` isn't a valid selector), silently
  swallowed by the browser but polluting the console.
- **`fixed-nav-master/`** (the entire folder) — this is an unmodified copy of the original vendor
  template you built the site from. Everything in it either has an already-adapted copy at the
  repo root (`css/`, `js/`) or was never used.

# Things I noticed but didn't touch

- **`css/fonts/space-grotesk-v6-latin-regular.*`** (5 files) and **`css/fonts/Lora.zip`** — none of
  these are referenced by any `@font-face` rule. Either wire up Space Grotesk somewhere if you
  meant to use it, or delete the files.
- **`img/zahnräder.jpg`** — the umlaut in the filename got mangled by the zip tool when I unpacked
  your upload (came through as `zahnr#U00e4der.jpg`), which is a live demonstration of exactly the
  cross-platform filename risk I flagged earlier. I left the actual reference as `zahnräder.jpg`
  (matching the real file in your repo) rather than guess at a rename — if you want to rename it to
  something ASCII-safe, do that in the repo directly and update the one `<img src>` in `works.html`
  to match.
- Files still have Windows-style CRLF line endings in a few places (e.g. the original `index.html`).
  Harmless, just worth normalizing to LF at some point via your editor or a `.gitattributes` file
  if you ever collaborate with others on this.

# How to apply this

I don't have push access to your GitHub repo, so these are files for you to drop in. The folder
structure mirrors your repo exactly — copy everything over the top of your existing files (and
delete the ones listed above), commit, and push.
