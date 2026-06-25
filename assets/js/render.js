;(function (root, factory) {
  const api = factory();
  root.VL = Object.assign(root.VL || {}, { render: api });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function getByPath(obj, path) {
    return String(path).split('.').reduce((acc, key) => {
      if (acc === undefined || acc === null) return undefined;
      return acc[key];
    }, obj);
  }

  function applyContent(rootEl, content) {
    const scope = rootEl || document;
    scope.querySelectorAll('[data-vl]').forEach((el) => {
      const val = getByPath(content, el.getAttribute('data-vl'));
      if (val === undefined || val === null) return; // keep fallback text
      el.textContent = String(val);
      if (el.hasAttribute('data-vl-mailto')) el.setAttribute('href', 'mailto:' + val);
    });
    scope.querySelectorAll('[data-vl-href]').forEach((el) => {
      const val = getByPath(content, el.getAttribute('data-vl-href'));
      if (val === undefined || val === null) return;
      el.setAttribute('href', String(val));
    });
  }

  return { getByPath, applyContent };
});
