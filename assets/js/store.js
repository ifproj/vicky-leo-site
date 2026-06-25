;(function (root, factory) {
  const api = factory();
  root.VL = Object.assign(root.VL || {}, { store: api });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const STORAGE_KEY = 'vl_draft_v1';
  const REQUIRED = ['meta', 'hero', 'about', 'experience', 'services', 'contact'];

  function isValidShape(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
    for (const k of REQUIRED) {
      if (!(k in obj) || typeof obj[k] !== 'object' || obj[k] === null) return false;
    }
    if (!Array.isArray(obj.experience.roles)) return false;
    if (!Array.isArray(obj.services.items)) return false;
    return true;
  }

  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  function serialize(content) {
    return 'window.VL_CONTENT = ' + JSON.stringify(content, null, 2) + ';\n';
  }

  function parseImport(text) {
    const t = String(text).trim();
    let obj;
    try {
      obj = JSON.parse(t);
    } catch (e) {
      const m = t.match(/VL_CONTENT\s*=\s*([\s\S]*?);?\s*$/);
      if (!m) throw new Error('Could not parse content: not JSON or a content.js file.');
      obj = JSON.parse(m[1].replace(/;\s*$/, ''));
    }
    if (!isValidShape(obj)) throw new Error('Parsed content does not match the expected shape.');
    return obj;
  }

  function pickDisplay(published, draft) {
    return draft && isValidShape(draft) ? draft : published;
  }

  function getPublished() {
    const root = typeof globalThis !== 'undefined' ? globalThis : {};
    return root.VL_CONTENT ? clone(root.VL_CONTENT) : null;
  }

  function loadDraft() {
    try {
      const raw = (typeof localStorage !== 'undefined') && localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      return isValidShape(obj) ? obj : null;
    } catch (e) {
      console.warn('[VL] Ignoring corrupt draft in localStorage:', e.message);
      return null;
    }
  }

  function saveDraft(content) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
      return true;
    } catch (e) {
      console.warn('[VL] Could not save draft (storage blocked or full):', e.message);
      return false;
    }
  }

  function clearDraft() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function getDisplayContent() {
    return pickDisplay(getPublished(), loadDraft());
  }

  function download(filename, text) {
    const blob = new Blob([text], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function exportContentFile(content) { download('content.js', serialize(content)); }

  return {
    STORAGE_KEY, isValidShape, clone, serialize, parseImport, pickDisplay,
    getPublished, loadDraft, saveDraft, clearDraft, getDisplayContent, exportContentFile
  };
});
