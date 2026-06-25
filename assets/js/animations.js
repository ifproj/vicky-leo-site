(function () {
  'use strict';
  function init() {
    var els = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    try {
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce || !('IntersectionObserver' in window)) return; // leave everything visible
      var vh = window.innerHeight || document.documentElement.clientHeight || 0;
      if (vh < 100) return; // unreliable viewport metric; do not risk hiding content
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
        });
      }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });
      els.forEach(function (el) {
        // Only hide and scroll-reveal elements that start below the fold. Anything
        // already in view (the hero and other above-the-fold content) stays visible.
        if (el.getBoundingClientRect().top >= vh) { el.classList.add('pre'); io.observe(el); }
      });
    } catch (e) {
      // On any failure, leave all content visible.
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
