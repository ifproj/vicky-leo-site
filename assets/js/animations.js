(function () {
  'use strict';
  function revealAll(els) { els.forEach(function (el) { el.classList.add('is-in'); }); }
  function inView(el) {
    var r = el.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    return r.bottom > 0 && r.top < vh * 0.92;
  }
  function init() {
    var els = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    try {
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce || !('IntersectionObserver' in window)) { revealAll(els); return; }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
        });
      }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });
      els.forEach(function (el) {
        // Reveal anything already on screen immediately (the hero and other
        // above-the-fold content), and observe the rest for scroll reveal.
        if (inView(el)) { el.classList.add('is-in'); } else { io.observe(el); }
      });
      // After images and fonts settle, reveal anything now in view that the
      // observer has not caught yet (guards against layout shifts at load).
      window.addEventListener('load', function () {
        els.forEach(function (el) { if (!el.classList.contains('is-in') && inView(el)) el.classList.add('is-in'); });
      });
    } catch (e) {
      // Never leave content invisible if anything goes wrong.
      revealAll(els);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
