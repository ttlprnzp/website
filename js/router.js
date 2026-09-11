/* =============================================================
   Page router
   Progressively enhances normal <a href="page.html"> navigation
   into an AJAX content swap, with working back/forward support.

   If this script fails to load or run, the site still works —
   every link is a real path to a real, complete page.
 * ============================================================= */
(function () {
  'use strict';

  var main = document.getElementById('main');
  if (!main) { return; }

  var navLinks = Array.prototype.slice.call(document.querySelectorAll('#nav a, .logo'));

  function pathOf(href) {
    return new URL(href, window.location.origin).pathname;
  }

  function setActiveLink(path) {
    navLinks.forEach(function (link) {
      if (!link.closest('#nav')) { return; }
      var isActive = pathOf(link.getAttribute('href')) === path;
      link.parentElement.classList.toggle('active', isActive);
    });
  }

  function loadPage(url, pushHistory) {
    fetch(url)
      .then(function (response) {
        if (!response.ok) { throw new Error('HTTP ' + response.status); }
        return response.text();
      })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var newMain = doc.getElementById('main');
        if (!newMain) { throw new Error('No #main in ' + url); }

        // Swap the whole <main> element, not just its inner content --
        // this carries over per-page classes like "main--landing"
        // (the empty, unpadded home page) so they don't linger onto
        // the next page after an in-app navigation.
        main.className = newMain.className;
        main.innerHTML = newMain.innerHTML;

        var newTitle = doc.querySelector('title');
        if (newTitle) { document.title = newTitle.textContent; }

        setActiveLink(pathOf(url));
        window.scrollTo(0, 0);

        if (pushHistory) {
          history.pushState({ url: url }, '', url);
        }
      })
      .catch(function (err) {
        console.error('Page load failed:', err);
        main.className = 'main';
        main.innerHTML =
          '<div id="content"><section><h1>Something went wrong</h1>' +
          '<p>Sorry, that page could not be loaded. ' +
          '<a href="' + url + '">Try opening it directly</a>.</p></section></div>';
      });
  }

  navLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      // Let modifier-key clicks (open in new tab, etc.) behave normally
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) { return; }
      e.preventDefault();
      var href = link.getAttribute('href');
      if (pathOf(href) === window.location.pathname) { return; }
      loadPage(href, true);
    });
  });

  window.addEventListener('popstate', function () {
    loadPage(window.location.pathname, false);
  });

  // Make sure the correct nav item is highlighted on a fresh page load
  setActiveLink(window.location.pathname);
})();
