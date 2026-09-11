/* =============================================================
   Content-aware header background.

   The header is transparent by default (see styles2.css) so the
   generative canvas shows through at the top of the page. Once the
   user scrolls far enough that actual page content is sitting
   under the fixed header, toggle a class that gives it a solid,
   blurred backing so nav text stays legible over text/images
   instead of relying on the text-shadow alone.

   Bound once to `window`/`header` rather than anything inside
   #main, so it keeps working across router.js's AJAX page swaps
   (which only replace #main's content, never <header>).
 * ============================================================= */
(function () {
  'use strict';

  var header = document.querySelector('header');
  if (!header) { return; }

  var SOLID_AFTER = 24; // px scrolled before content is under the header

  function update() {
    header.classList.toggle('header--solid', window.scrollY > SOLID_AFTER);
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
})();
