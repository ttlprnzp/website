/* =============================================================
   Click-to-play embeds inside the galleries (works/spaces/bio).

   A `.entry-media[data-youtube-id]` or `.entry-media[data-soundcloud-src]`
   (a thumbnail image, marked up as role="button"/tabindex="0") plays
   on click or Enter/Space, instead of navigating away. YouTube swaps
   the picture for a visible player; SoundCloud keeps the picture
   showing and plays the track behind it (see .audio-embed in CSS) --
   clicking it again toggles play/pause via the SoundCloud Widget API.

   Delegated on `document` rather than bound per-element: router.js
   swaps #main's innerHTML on in-app navigation, which destroys and
   recreates these elements, so a listener attached directly to one
   would stop working after the first AJAX page swap.
 * ============================================================= */
(function () {
  'use strict';

  var SELECTOR = '.entry-media[data-youtube-id], .entry-media[data-soundcloud-src]';
  var widgets = new WeakMap(); // media element -> SC.Widget instance
  var scApiCallbacks = null; // null = not loading, [] = loading, queued callbacks

  document.addEventListener('click', function (e) {
    var media = e.target.closest(SELECTOR);
    if (!media) { return; }

    var link = e.target.closest('a');
    if (link) { return; } // don't hijack an actual link inside the media

    e.preventDefault();
    trigger(media);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') { return; }
    var media = e.target.closest && e.target.closest(SELECTOR);
    if (!media) { return; }

    e.preventDefault();
    trigger(media);
  });

  function trigger(media) {
    if (media.hasAttribute('data-youtube-id')) {
      playYouTube(media);
    } else if (media.hasAttribute('data-soundcloud-src')) {
      toggleSoundCloud(media);
    }
  }

  function label(media, fallback) {
    var img = media.querySelector('img');
    return img ? img.alt : fallback;
  }

  function playYouTube(media) {
    if (media.querySelector('iframe')) { return; } // already playing

    var videoId = media.getAttribute('data-youtube-id');

    var iframe = document.createElement('iframe');
    // modestbranding trims YouTube's own branding in the controls --
    // note there's no supported param to hide the title/channel text
    // itself; YouTube dropped that (old "showinfo=0") in 2018 and now
    // ties it to the control bar, which we're keeping.
    iframe.src = 'https://www.youtube-nocookie.com/embed/' + videoId + '?autoplay=1&rel=0&modestbranding=1';
    iframe.title = label(media, 'YouTube video');
    iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('frameborder', '0');

    media.innerHTML = '';
    media.appendChild(iframe);

    // Hide the title/caption scrim once playing -- it sits in the
    // same corner as YouTube's own control bar and would otherwise
    // block clicks on play/pause, the scrubber, fullscreen, etc.
    var item = media.closest('.gallery-item');
    if (item) { item.classList.add('is-playing'); }
  }

  function toggleSoundCloud(media) {
    var widget = widgets.get(media);
    if (widget) {
      widget.toggle();
      return;
    }

    // Audio only -- keep the picture (and its caption) exactly as it
    // is, just start the track playing behind it instead of swapping
    // the image out for a visible player.
    var src = media.getAttribute('data-soundcloud-src');

    // Force autoplay regardless of whatever the pasted embed URL had.
    try {
      var url = new URL(src);
      url.searchParams.set('auto_play', 'true');
      src = url.toString();
    } catch (err) { /* malformed URL -- fall back to the raw src as given */ }

    var iframe = document.createElement('iframe');
    iframe.className = 'audio-embed';
    iframe.src = src;
    iframe.title = label(media, 'SoundCloud track');
    iframe.setAttribute('allow', 'autoplay; encrypted-media');
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('frameborder', '0');

    media.appendChild(iframe);
    media.setAttribute('aria-label', 'Pause track: ' + label(media, 'SoundCloud track'));

    loadSoundCloudApi(function (SC) {
      var w = SC.Widget(iframe);
      widgets.set(media, w);

      w.bind(SC.Widget.Events.PLAY, function () {
        media.setAttribute('aria-label', 'Pause track: ' + label(media, 'SoundCloud track'));
      });
      w.bind(SC.Widget.Events.PAUSE, function () {
        media.setAttribute('aria-label', 'Play track: ' + label(media, 'SoundCloud track'));
      });
    });
  }

  function loadSoundCloudApi(callback) {
    if (window.SC && window.SC.Widget) { callback(window.SC); return; }

    if (scApiCallbacks) {
      scApiCallbacks.push(callback);
      return;
    }

    scApiCallbacks = [callback];
    var script = document.createElement('script');
    script.src = 'https://w.soundcloud.com/player/api.js';
    script.onload = function () {
      var callbacks = scApiCallbacks;
      scApiCallbacks = null;
      callbacks.forEach(function (cb) { cb(window.SC); });
    };
    document.head.appendChild(script);
  }
})();
