(function () {
  'use strict';

  function reduceMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Scroll-reveal: only hide and animate elements that start BELOW the fold.
  // Anything already in view (hero, etc.) stays visible, so content is never
  // stuck invisible if JS or the observer misbehaves.
  function initReveal(reduce) {
    var els = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    try {
      if (reduce || !('IntersectionObserver' in window)) return; // leave everything visible
      var vh = window.innerHeight || document.documentElement.clientHeight || 0;
      if (vh < 100) return; // unreliable viewport metric; do not risk hiding content
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
        });
      }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });
      els.forEach(function (el) {
        if (el.getBoundingClientRect().top >= vh) { el.classList.add('pre'); io.observe(el); }
      });
    } catch (e) {
      // On any failure, leave all content visible.
    }
  }

  // Slow "settle" zoom for editorial images. Base scale lives in CSS under
  // .vl-anim; we just add .kb-in once each image enters view. If observers
  // are unavailable, settle every image immediately (no lingering zoom).
  function initKenBurns(reduce) {
    var imgs = Array.prototype.slice.call(document.querySelectorAll('.kb'));
    if (!imgs.length) return;
    try {
      if (reduce || !('IntersectionObserver' in window)) {
        imgs.forEach(function (el) { el.classList.add('kb-in'); });
        return;
      }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('kb-in'); io.unobserve(e.target); }
        });
      }, { threshold: 0.15 });
      imgs.forEach(function (el) { io.observe(el); });
    } catch (e) {
      imgs.forEach(function (el) { el.classList.add('kb-in'); });
    }
  }

  // Sticky nav gains a hairline + subtle lift once the page leaves the top.
  function initNavScroll() {
    var nav = document.querySelector('.nav');
    if (!nav) return;
    var update = function () {
      if ((window.pageYOffset || window.scrollY || 0) > 24) nav.classList.add('is-scrolled');
      else nav.classList.remove('is-scrolled');
    };
    try {
      update();
      window.addEventListener('scroll', update, { passive: true });
    } catch (e) {}
  }

  // Belt-and-suspenders for the hero load choreography. The entrance uses
  // animation-fill-mode:both, which would hold the hero at opacity 0 if the
  // animation never advances (e.g. opened in a background tab and never
  // focused). After ~1.8s, force the visible end-state so content is never
  // stuck hidden. The timer fires on wall-clock even in throttled tabs.
  function initEntranceSafety() {
    var root = document.documentElement;
    if (!root.classList.contains('vl-anim')) return;
    try { window.setTimeout(function () { root.classList.add('vl-shown'); }, 1800); }
    catch (e) { root.classList.add('vl-shown'); }
  }

  function init() {
    var reduce = reduceMotion();
    initReveal(reduce);
    initKenBurns(reduce);
    initNavScroll();
    initEntranceSafety();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
