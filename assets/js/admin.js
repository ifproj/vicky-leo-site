(function () {
  'use strict';
  var store = VL.store, render = VL.render, auth = VL.auth;

  // Ordered, human-labelled list of every editable string path.
  var FIELDS = [
    ['Meta', [
      ['meta.name', 'Name', 'input'], ['meta.title', 'Title', 'input'],
      ['meta.tagline', 'Tagline', 'input'], ['meta.location', 'Location', 'input'],
      ['meta.email', 'Email', 'input'], ['meta.linkedinUrl', 'LinkedIn URL', 'input']
    ]],
    ['Hero', [
      ['hero.kicker', 'Kicker', 'input'], ['hero.headline', 'Headline', 'input'],
      ['hero.headlineEmphasis', 'Headline emphasis (gold)', 'input'],
      ['hero.lede', 'Lede', 'textarea'], ['hero.ctaPrimary', 'Primary CTA', 'input'],
      ['hero.ctaSecondary', 'Secondary CTA', 'input'], ['hero.featuredLabel', 'Featured strip label', 'input'],
      ['hero.featured.0', 'Featured outlet 1', 'input'], ['hero.featured.1', 'Featured outlet 2', 'input'],
      ['hero.featured.2', 'Featured outlet 3', 'input'], ['hero.featured.3', 'Featured outlet 4', 'input']
    ]],
    ['About', [
      ['about.label', 'Label', 'input'], ['about.heading', 'Heading', 'input'],
      ['about.body.0', 'Paragraph 1', 'textarea'], ['about.body.1', 'Paragraph 2', 'textarea'],
      ['about.persona.0', 'Persona 1', 'input'], ['about.persona.1', 'Persona 2', 'input'],
      ['about.persona.2', 'Persona 3', 'input']
    ]],
    ['Impact', [
      ['impact.label', 'Label', 'input'], ['impact.heading', 'Heading', 'input'], ['impact.lede', 'Lede', 'textarea'],
      ['impact.stats.0.value', 'Stat 1 value', 'input'], ['impact.stats.0.label', 'Stat 1 label', 'input'],
      ['impact.stats.1.value', 'Stat 2 value', 'input'], ['impact.stats.1.label', 'Stat 2 label', 'input'],
      ['impact.stats.2.value', 'Stat 3 value', 'input'], ['impact.stats.2.label', 'Stat 3 label', 'input'],
      ['impact.stats.3.value', 'Stat 4 value', 'input'], ['impact.stats.3.label', 'Stat 4 label', 'input'],
      ['impact.stats.4.value', 'Stat 5 value', 'input'], ['impact.stats.4.label', 'Stat 5 label', 'input']
    ]],
    ['Story', [
      ['story.label', 'Label', 'input'], ['story.heading', 'Heading', 'input'],
      ['story.body.0', 'Paragraph 1', 'textarea'], ['story.body.1', 'Paragraph 2', 'textarea'],
      ['story.quote', 'Pull quote', 'textarea'], ['story.quoteAttrib', 'Quote attribution', 'input'],
      ['story.ctaLabel', 'CTA label', 'input'], ['story.ctaUrl', 'CTA URL', 'input']
    ]],
    ['Experience', flattenList('experience.roles', 7, [
      ['period', 'Period'], ['role', 'Role'], ['org', 'Organisation'], ['location', 'Location'], ['blurb', 'Blurb']
    ])],
    ['Services', flattenList('services.items', 4, [['title', 'Title'], ['body', 'Body']])],
    ['Press', flattenList('press.items', 4, [['outlet', 'Outlet'], ['kind', 'Kind'], ['year', 'Year'], ['title', 'Title'], ['excerpt', 'Excerpt'], ['url', 'URL']])],
    ['Recognition', [['recognition.label', 'Label', 'input'], ['recognition.heading', 'Heading', 'input']]
      .concat(flattenList('recognition.items', 3, [['title', 'Title'], ['detail', 'Detail'], ['year', 'Year']]))],
    ['Quotes', [['quotes.label', 'Label', 'input'], ['quotes.heading', 'Heading', 'input']]
      .concat(flattenList('quotes.items', 3, [['text', 'Quote'], ['context', 'Context']]))],
    ['Media', [
      ['media.stageEyebrow', 'On-stage eyebrow', 'input'],
      ['media.stageCaption', 'On-stage caption', 'input']
    ]],
    ['Contact', [
      ['contact.label', 'Label', 'input'], ['contact.heading', 'Heading', 'input'],
      ['contact.body', 'Body', 'textarea'], ['contact.email', 'Email', 'input'],
      ['contact.linkedinUrl', 'LinkedIn URL', 'input'], ['contact.location', 'Location', 'input']
    ]]
  ];

  function flattenList(base, count, cols) {
    // Defined inside so it is always available when flattenList runs during
    // FIELDS construction above (a var declared after FIELDS would be undefined here).
    var LONG = { blurb: 1, body: 1, excerpt: 1, text: 1 };
    var out = [];
    for (var i = 0; i < count; i++) {
      cols.forEach(function (c) {
        var type = LONG[c[0]] ? 'textarea' : 'input';
        out.push([base + '.' + i + '.' + c[0], (i + 1) + '. ' + c[1], type]);
      });
    }
    return out;
  }

  function setByPath(obj, path, value) {
    var keys = path.split('.'); var cur = obj;
    for (var i = 0; i < keys.length - 1; i++) { cur = cur[keys[i]]; }
    cur[keys[keys.length - 1]] = value;
  }

  var working; // the content object being edited

  function buildForm() {
    var form = document.getElementById('fields');
    form.innerHTML = '';
    FIELDS.forEach(function (groupDef) {
      var group = document.createElement('div'); group.className = 'group';
      var h = document.createElement('h2'); h.textContent = groupDef[0]; group.appendChild(h);
      groupDef[1].forEach(function (f) {
        var path = f[0], label = f[1], type = f[2];
        var wrap = document.createElement('div'); wrap.className = 'field';
        var id = 'f_' + path.replace(/\./g, '_');
        var lab = document.createElement('label'); lab.setAttribute('for', id); lab.textContent = label;
        var input = document.createElement(type === 'textarea' ? 'textarea' : 'input');
        input.id = id; input.value = render.getByPath(working, path) || '';
        input.addEventListener('input', function () { setByPath(working, path, input.value); });
        wrap.appendChild(lab); wrap.appendChild(input); group.appendChild(wrap);
      });
      form.appendChild(group);
    });
  }

  function status(msg) { document.getElementById('status').textContent = msg; }

  function wireActions() {
    document.getElementById('btn-save').addEventListener('click', function () {
      var ok = store.saveDraft(working);
      status(ok ? 'Draft saved to this browser.' : 'Could not save (storage blocked). Use Export instead.');
    });
    document.getElementById('btn-export').addEventListener('click', function () {
      store.exportContentFile(working); status('content.js exported. Replace it on the host to publish.');
    });
    document.getElementById('btn-reset').addEventListener('click', function () {
      if (!confirm('Discard your draft and return to the published content?')) return;
      store.clearDraft(); working = store.getPublished(); buildForm(); status('Reset to published content.');
    });
    document.getElementById('file-import').addEventListener('change', function (e) {
      var file = e.target.files[0]; if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try { working = store.parseImport(reader.result); buildForm(); status('Imported. Review, then Save or Export.'); }
        catch (err) { status('Import failed: ' + err.message); }
      };
      reader.readAsText(file);
    });
  }

  function startEditor() {
    document.getElementById('gate').hidden = true;
    document.getElementById('editor').hidden = false;
    working = store.getDisplayContent(); // draft if present, else published
    buildForm(); wireActions();
  }

  // Gate
  if (auth.isUnlocked()) { startEditor(); }
  else {
    document.getElementById('gate-form').addEventListener('submit', function (e) {
      e.preventDefault();
      auth.verifyPassphrase(document.getElementById('gate-input').value).then(function (ok) {
        if (ok) { auth.unlock(); startEditor(); }
        else {
          var err = document.getElementById('gate-error');
          err.textContent = 'Incorrect passphrase.';
          err.hidden = false;
        }
      }).catch(function (e) {
        var err = document.getElementById('gate-error');
        err.textContent = 'Could not verify the passphrase: ' + (e && e.message ? e.message : e);
        err.hidden = false;
      });
    });
  }
})();
