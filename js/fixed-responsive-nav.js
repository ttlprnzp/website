/* =============================================
 *
 *   FIXED RESPONSIVE NAV (adapted)
 *
 *   (c) 2014 @adtileHQ, http://www.adtile.me
 *   Free to use under the MIT License.
 *
 *   The original template assumed one long page with in-page
 *   anchors (href="#bio" etc.) and scroll-spied which section was
 *   in view. This site instead swaps whole pages in via router.js,
 *   so that scroll-spy code has been removed — it referenced
 *   document.getElementById() on IDs that don't exist here and
 *   threw an error that silently broke the rest of this script,
 *   including the tap-outside-to-close behavior for the mobile menu.
 *
 *   What's left: FastClick, the responsive-nav toggle itself, and
 *   the tap-the-mask-to-close-menu behavior (now actually runs).
 * ============================================= */
(function () {
  'use strict';

  if (!('querySelector' in document && 'addEventListener' in window)) { return; }

  // Remove the 300ms tap delay on touch devices
  FastClick.attach(document.body);

  // Init the mobile hamburger nav
  var navigation = responsiveNav('.nav-collapse', {
    closeOnNavClick: true
  });

  // Create the dark overlay shown behind the open mobile menu
  var mask = document.createElement('div');
  mask.className = 'mask';
  document.body.appendChild(mask);

  // Disable mask transitions on Android to boost performance
  if (navigator.userAgent.match(/Android/i) !== null) {
    document.documentElement.className += ' android';
  }

  // Tapping the mask closes the menu
  mask.addEventListener('click', function (e) {
    e.preventDefault();
    navigation.close();
  }, false);
})();
