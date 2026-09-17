(function () {
  'use strict';
  var STORE_KEY = 'seif_elbakry_site_cms_v6';
  var ADMIN_SESSION_KEY = 'seif_elbakry_admin_logged_in';
  var ADMIN_USER = 'admin';
  var ADMIN_PASS = 'admin123';
  var PHOTO_SRC = 'assets/images/seif-elbakry-portrait.png';
  var LOGO_SRC = 'assets/images/seif-elbakry-logo-white.png';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var activeAdminTab = 'dashboard';
  var revealObserver;

  var defaultData = JSON.parse(JSON.stringify(window.SeifWebsiteContent));

  var data = loadData();

  function isAdminLoggedIn() {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
  }

  function applyTheme() {
    var map = {
      bg: '--bg',
      bgAlt: '--bg-alt',
      surface: '--surface',
      brass: '--brass',
      brassLight: '--brass-light',
      teal: '--teal',
      tealLight: '--teal-light',
      text: '--text',
      textMuted: '--text-muted',
      navy: '--navy',
      bluePanel: '--blue-panel',
    };
    Object.keys(map).forEach(function (key) {
      if (data.theme && data.theme[key])
        document.documentElement.style.setProperty(map[key], data.theme[key]);
    });
    applyDesign();
  }

  var fontChoices = [
    'Big Shoulders Display',
    'Plus Jakarta Sans',
    'IBM Plex Mono',
    'Arial',
    'Georgia',
    'Verdana',
    'Trebuchet MS',
    'Times New Roman',
    'Courier New',
    'system-ui',
  ];
  var sectionChoices = [
    ['home', 'Hero'],
    ['approach', 'Architecture / Engine'],
    ['stats', 'Proof stats'],
    ['services', 'Services'],
    ['testimonials', 'Why'],
    ['about', 'About'],
    ['courses', 'Courses'],
    ['blog', 'Blog'],
    ['faq', 'FAQ'],
    ['contact', 'Contact'],
  ];
  function applyDesign() {
    var d = data.design || defaultData.design;
    ['headingFont', 'bodyFont', 'labelFont'].forEach(function (key, i) {
      var name = fontChoices.indexOf(d[key]) >= 0 ? d[key] : defaultData.design[key];
      document.documentElement.style.setProperty(
        ['--font-display', '--font-body', '--font-mono'][i],
        '"' + name + '", ' + (i === 2 ? 'monospace' : 'sans-serif'),
      );
    });
    function n(key, min, max) {
      var value = Number(d[key]);
      return Math.max(min, Math.min(max, Number.isFinite(value) ? value : defaultData.design[key]));
    }
    var style = document.getElementById('adminDesignStyles');
    if (!style) {
      style = document.createElement('style');
      style.id = 'adminDesignStyles';
      document.head.appendChild(style);
    }
    style.textContent =
      'html{font-size:' +
      n('bodySize', 12, 24) +
      'px}body{line-height:' +
      n('lineHeight', 1.2, 2.2) +
      '}' +
      'body:not(.view-admin) .container{max-width:' +
      n('contentWidth', 800, 1600) +
      'px}' +
      'main>.section-pad:not(#admin){padding-top:' +
      n('sectionSpace', 32, 160) +
      'px;padding-bottom:' +
      n('sectionSpace', 32, 160) +
      'px}' +
      'main :is(.hero h1,.section-head h2,.about-text h2,.cta-band h2,.course-page h1){font-size:' +
      n('headingSize', 28, 88) +
      'px;max-width:100%;font-weight:' +
      n('headingWeight', 400, 900) +
      ';text-transform:' +
      (d.headingCase === 'none' ? 'none' : 'uppercase') +
      ';overflow-wrap:break-word}' +
      '.btn{border-radius:' +
      n('buttonRadius', 0, 48) +
      'px}' +
      '@media(max-width:640px){main :is(.hero h1,.section-head h2,.about-text h2,.cta-band h2,.course-page h1){font-size:' +
      Math.min(n('headingSize', 28, 88), 38) +
      'px}}' +
      '.admin-section{font-family:Arial,sans-serif;font-size:16px;line-height:1.5}.admin-section h2,.admin-section h3,.admin-section h4{font-family:Arial,sans-serif}' +
      (d.motion === false
        ? 'html{scroll-behavior:auto!important}body:not(.view-admin) *,body:not(.view-admin) *::before,body:not(.view-admin) *::after{animation:none!important;transition:none!important}.reveal,.hero-eyebrow,.hero-h1,.hero-sub,.hero-ctas,.hero-mini-stats{opacity:1!important;transform:none!important}'
        : '') +
      sectionChoices
        .filter(function (s) {
          return (d.hidden || []).indexOf(s[0]) >= 0;
        })
        .map(function (s) {
          return 'body.view-home #' + s[0] + '{display:none!important}';
        })
        .join('');
  }

  function selectControl(label, path, options) {
    return (
      '<div class="admin-field"><label>' +
      esc(label) +
      '</label><select data-path="' +
      esc(path) +
      '">' +
      options
        .map(function (o) {
          return (
            '<option value="' +
            esc(o) +
            '"' +
            (String(getPath(path)) === String(o) ? ' selected' : '') +
            '>' +
            esc(o) +
            '</option>'
          );
        })
        .join('') +
      '</select></div>'
    );
  }
  function numberControl(label, key, min, max, step) {
    return (
      '<div class="admin-field"><label>' +
      esc(label) +
      '</label><input type="number" data-path="design.' +
      key +
      '" min="' +
      min +
      '" max="' +
      max +
      '" step="' +
      (step || 1) +
      '" value="' +
      esc(data.design[key]) +
      '"></div>'
    );
  }
  function designEditor() {
    return (
      adminTop(
        'Fonts & Layout',
        'Edit website typography, spacing, buttons, and motion. Changes are saved in this browser.',
      ) +
      '<div class="admin-grid">' +
      card(
        'Font families',
        selectControl('Headings', 'design.headingFont', fontChoices) +
          selectControl('Body text', 'design.bodyFont', fontChoices) +
          selectControl('Labels', 'design.labelFont', fontChoices),
      ) +
      card(
        'Type settings',
        numberControl('Body size (px)', 'bodySize', 12, 24) +
          numberControl('Heading size (px)', 'headingSize', 28, 88) +
          selectControl('Heading weight', 'design.headingWeight', [400, 500, 600, 700, 800, 900]) +
          numberControl('Line height', 'lineHeight', 1.2, 2.2, 0.1) +
          selectControl('Heading case', 'design.headingCase', ['uppercase', 'none']),
      ) +
      card(
        'Layout',
        numberControl('Content width (px)', 'contentWidth', 800, 1600, 20) +
          numberControl('Section spacing (px)', 'sectionSpace', 32, 160, 4) +
          numberControl('Button corners (px)', 'buttonRadius', 0, 48) +
          '<label><input type="checkbox" data-design-motion ' +
          (data.design.motion ? 'checked' : '') +
          '> Enable animations</label>',
      ) +
      card(
        'Visible sections',
        sectionChoices
          .map(function (s) {
            return (
              '<label style="display:block;margin:14px 0"><input type="checkbox" data-section-visible="' +
              s[0] +
              '" ' +
              (data.design.hidden.indexOf(s[0]) < 0 ? 'checked' : '') +
              '> ' +
              esc(s[1]) +
              '</label>'
            );
          })
          .join(''),
      ) +
      '</div>'
    );
  }
  function completeEditor(value, path) {
    if (value && typeof value === 'object') {
      if (value.data && value.name)
        return (
          '<p class="admin-mini">Uploaded media: ' +
          esc(value.name) +
          ' (edit in Media / Courses / Blog)</p>'
        );
      return Object.keys(value)
        .map(function (key) {
          var p = path ? path + '.' + key : key;
          if (key === 'design' || key === 'assets' || key === 'theme') return '';
          if (value[key] && typeof value[key] === 'object')
            return (
              '<details class="admin-item"><summary style="cursor:pointer;padding:12px 0">' +
              esc(key) +
              '</summary>' +
              completeEditor(value[key], p) +
              '</details>'
            );
          return field(
            key,
            p,
            typeof value[key] === 'string' &&
              (value[key].length > 90 || /text|title|description|arabic/i.test(key))
              ? 'textarea'
              : 'input',
          );
        })
        .join('');
    }
    return '';
  }

  function loadData() {
    try {
      var published = document.getElementById('publishedSiteData');
      if (published) defaultData = mergeDefaults(defaultData, JSON.parse(published.textContent));
      var saved = localStorage.getItem(STORE_KEY);
      if (saved) return mergeDefaults(defaultData, JSON.parse(saved));
      var legacy = localStorage.getItem('seif_elbakry_site_cms_v5');
      if (legacy) {
        var oldData = JSON.parse(legacy);
        var migrated = JSON.parse(JSON.stringify(defaultData));
        if (oldData.assets) migrated.assets = oldData.assets;
        if (Array.isArray(oldData.courses)) {
          migrated.courses.forEach(function (course) {
            var match = oldData.courses.find(function (oldCourse) {
              return (
                oldCourse &&
                (oldCourse.title === course.title || oldCourse.pageTitle === course.pageTitle)
              );
            });
            if (match) {
              ['cover', 'video', 'gallery', 'files', 'videoUrl'].forEach(function (key) {
                if (match[key]) course[key] = match[key];
              });
            }
          });
        }
        return migrated;
      }
      return JSON.parse(JSON.stringify(defaultData));
    } catch (err) {
      return JSON.parse(JSON.stringify(defaultData));
    }
  }

  function mergeDefaults(base, saved) {
    if (Array.isArray(base)) return Array.isArray(saved) ? saved : base;
    if (!base || typeof base !== 'object') return saved === undefined ? base : saved;
    var out = Object.assign({}, base);
    Object.keys(saved || {}).forEach(function (key) {
      out[key] = mergeDefaults(base[key], saved[key]);
    });
    return out;
  }

  function saveData() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(data));
      showAdminStatus('Saved. Public sections updated on this browser.');
      return true;
    } catch (err) {
      showAdminStatus('Could not save. Uploaded media may be too large for browser storage.');
      return false;
    }
  }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[ch];
    });
  }
  function html(value) {
    return String(value == null ? '' : value);
  }
  function photoSrc() {
    return data.assets && data.assets.photo && data.assets.photo.data
      ? data.assets.photo.data
      : PHOTO_SRC;
  }
  function logoSrc() {
    return data.assets && data.assets.logo && data.assets.logo.data
      ? data.assets.logo.data
      : LOGO_SRC;
  }
  function arrowSvg() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  }
  function iconSvg(i) {
    var icons = [
      '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 20c0-3.6 2.5-6 5.5-6s5.5 2.4 5.5 6"/><circle cx="17" cy="7" r="2.4"/><path d="M15.5 13.2c2.6.3 4.5 2.5 4.5 6.3"/>',
      '<circle cx="12" cy="5" r="2.4"/><circle cx="5" cy="18" r="2.4"/><circle cx="19" cy="18" r="2.4"/><path d="M12 7.4v4M12 11.4L6.4 16M12 11.4L17.6 16"/>',
      '<path d="M8 8l-4.5 4L8 16M16 8l4.5 4L16 16M13.5 5.5l-3 13"/>',
      '<path d="M4 5h16l-6 8v5l-4 2v-7z"/>',
    ];
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
      icons[i % icons.length] +
      '</svg>'
    );
  }
  function mediaPreview(course) {
    if (course.video && course.video.data)
      return '<video src="' + course.video.data + '" muted playsinline></video>';
    if (course.cover && course.cover.data)
      return '<img src="' + course.cover.data + '" alt="' + esc(course.title) + '">';
    return '<span>Course Media</span>';
  }

  function renderSite() {
    applyTheme();
    document.title = data.meta.title;
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', data.meta.description);
    document.querySelectorAll('.js-photo').forEach(function (img) {
      img.src = photoSrc();
    });
    document.querySelectorAll('.js-logo').forEach(function (img) {
      img.src = logoSrc();
    });
    var navText = {
      '#about': data.nav.about,
      '#services': data.nav.services,
      '#approach': data.nav.approach,
      '#courses': data.nav.courses,
      '#blog': data.nav.blog,
      '#faq': data.nav.faq,
      '#contact': data.nav.contact,
      '#admin': data.nav.admin,
    };
    document.querySelectorAll('#navLinks a').forEach(function (a) {
      var label = navText[a.getAttribute('href')];
      if (label !== undefined) {
        a.textContent = label;
        a.style.display = label ? '' : 'none';
      }
    });
    var navCta = document.querySelector('.nav-cta .btn-sm');
    if (navCta) {
      navCta.textContent = data.nav.cta;
      navCta.href = data.nav.ctaLink || '#contact';
      if ((data.nav.ctaLink || '').indexOf('http') === 0) {
        navCta.target = '_blank';
        navCta.rel = 'noopener';
      }
    }
    document.querySelectorAll('.stage-label').forEach(function (label, i) {
      label.textContent = ['Architecture', 'Engine', 'Judgment', 'Call'][i] || label.textContent;
    });

    var ctas = [];
    if (data.hero.primaryCta)
      ctas.push(
        '<a href="#approach" class="btn btn-primary">' + esc(data.hero.primaryCta) + '</a>',
      );
    if (data.hero.secondaryCta)
      ctas.push(
        '<a href="#services" class="btn btn-outline">' + esc(data.hero.secondaryCta) + '</a>',
      );
    document.getElementById('home').innerHTML =
      '<div class="container hero-grid"><div><div class="hero-eyebrow eyebrow">' +
      esc(data.hero.eyebrow) +
      '</div>' +
      '<h1 class="hero-h1">' +
      html(data.hero.title) +
      '</h1><p class="hero-sub">' +
      esc(data.hero.subtitle) +
      '</p>' +
      (ctas.length ? '<div class="hero-ctas">' + ctas.join('') + '</div>' : '') +
      '<div class="hero-mini-stats">' +
      data.stats
        .map(function (s) {
          return '<span><b>' + esc(s.number + s.suffix) + '</b>&nbsp;' + esc(s.label) + '</span>';
        })
        .join('') +
      '</div></div>' +
      '<div class="hero-visual"><div class="hero-visual-panel"><div class="hero-photo-wrap"><img class="js-photo hero-photo" src="' +
      photoSrc() +
      '" alt="Portrait of Seif ElBakry"></div>' +
      '<div class="hero-badge"><span class="num">' +
      esc(data.hero.badgeNumber) +
      '</span><span class="lbl">' +
      esc(data.hero.badgeLabel) +
      '</span></div></div></div></div><a href="#approach" class="hero-scroll-cue">Choose your road</a>';

    document.getElementById('approach').className = 'section-pad fork-section';
    document.getElementById('approach').innerHTML = renderFork();

    document.getElementById('stats').innerHTML =
      '<div class="container stats-grid">' +
      data.stats
        .map(function (s) {
          return (
            '<div class="stat-item reveal"><div class="stat-num"><span class="counter" data-target="' +
            esc(s.number) +
            '">0</span><span class="suffix">' +
            esc(s.suffix) +
            '</span></div><div class="stat-label">' +
            esc(s.label) +
            '</div></div>'
          );
        })
        .join('') +
      '</div>';

    document.getElementById('services').className = 'section-pad bg-alt';
    document.getElementById('services').innerHTML = renderSystems();

    document.getElementById('testimonials').className = 'section-pad why-section';
    document.getElementById('testimonials').innerHTML = renderWhy();

    document.getElementById('about').className = 'section-pad';
    document.getElementById('about').innerHTML = renderAbout();

    document.getElementById('courses').className = 'section-pad bg-alt';
    document.getElementById('courses').innerHTML =
      '<div class="container"><div class="section-head"><div class="eyebrow reveal">' +
      esc(data.coursesHead.eyebrow) +
      '</div><h2 class="reveal">' +
      html(data.coursesHead.title) +
      '</h2><p class="reveal">' +
      esc(data.coursesHead.text) +
      '</p></div>' +
      '<div class="resource-feature reveal"><div><span class="tag">' +
      esc(data.resource.eyebrow) +
      '</span><h3>' +
      esc(data.resource.title) +
      '</h3><p>' +
      esc(data.resource.text) +
      '</p></div><a class="btn btn-primary" href="#course-0">' +
      esc(data.resource.button) +
      '</a></div>' +
      '<div class="courses-grid">' +
      data.courses
        .map(function (c, i) {
          var courseClass =
            c.tag === 'The Architecture'
              ? 'architecture'
              : c.tag === 'The Engine'
                ? 'engine'
                : c.tag === 'Free Webinar'
                  ? 'webinar'
                  : '';
          return (
            '<div class="course-card ' +
            courseClass +
            ' reveal"><div class="course-top"></div><div class="course-media">' +
            mediaPreview(c) +
            '</div><div class="course-body"><span class="course-tag">' +
            esc(c.tag) +
            '</span><h3>' +
            esc(c.title) +
            '</h3><p>' +
            esc(c.text) +
            '</p><div class="course-assets">' +
            assetPills(c) +
            '</div><a href="#course-' +
            i +
            '" class="course-link">' +
            esc(c.link || 'View course') +
            ' ' +
            arrowSvg() +
            '</a></div></div>'
          );
        })
        .join('') +
      '</div></div>';

    document.getElementById('blog').className = 'section-pad bg-alt';
    document.getElementById('blog').innerHTML = renderBlog();

    document.querySelector('.cta-band').innerHTML =
      '<div class="container"><div class="cta-layout"><div class="cta-copy"><div class="eyebrow reveal">' +
      esc(data.cta.eyebrow) +
      '</div><h2 class="reveal">' +
      html(data.cta.title) +
      '</h2><p class="reveal">' +
      esc(data.cta.text) +
      '</p><div class="cta-actions reveal"><a href="' +
      esc(data.cta.link || '#contact') +
      '" class="btn btn-primary"' +
      externalAttrs(data.cta.link) +
      '>' +
      esc(data.cta.button) +
      '</a><a href="#courses" class="btn btn-secondary">View free courses</a></div></div><div class="cta-panel reveal"><span class="cta-panel-label">Clarity checkpoint</span><strong>Twenty focused minutes is usually enough to see whether the issue is craft, structure, or both.</strong><p>You do not need a full project before you know which direction makes sense.</p><div class="cta-points"><div class="cta-point"><b>01</b><span>Get a direct read on where the sales motion is actually breaking.</span></div><div class="cta-point"><b>02</b><span>Leave with a clear recommendation on the best next step.</span></div></div><div class="cta-meta"><span>Presales craft</span><span>Sales engine design</span><span>Cairo + GCC</span></div></div></div></div>';

    var faq = document.getElementById('faq');
    if (data.faqs && data.faqs.length) {
      faq.style.display = '';
      faq.innerHTML =
        '<div class="container"><div class="section-head"><div class="eyebrow reveal">' +
        esc(data.faqHead.eyebrow) +
        '</div><h2 class="reveal">' +
        html(data.faqHead.title) +
        '</h2></div><div class="faq-list">' +
        data.faqs
          .map(function (f, i) {
            return (
              '<div class="faq-item ' +
              (i === 0 ? 'open' : '') +
              ' reveal"><button class="faq-q" aria-expanded="' +
              (i === 0 ? 'true' : 'false') +
              '"><h3>' +
              esc(f.q) +
              '</h3><span class="faq-icon"></span></button><div class="faq-content-wrap"><div class="faq-content-inner"><p>' +
              esc(f.a) +
              '</p></div></div></div>'
            );
          })
          .join('') +
        '</div></div>';
    } else {
      faq.style.display = 'none';
    }

    document.getElementById('contact').innerHTML =
      '<div class="container contact-grid"><div><div class="eyebrow reveal">' +
      esc(data.contact.eyebrow) +
      '</div><h2 class="reveal" style="margin-bottom:26px;">' +
      html(data.contact.title) +
      '</h2><form class="reveal" id="contactForm">' +
      '<div class="field"><label for="fname">Name</label><input type="text" id="fname" name="name" required placeholder="Your full name"></div><div class="field"><label for="femail">Email</label><input type="email" id="femail" name="email" required placeholder="you@company.com"></div><div class="field"><label for="fcompany">Company</label><input type="text" id="fcompany" name="company" placeholder="Company name"></div><div class="field"><label for="fmessage">Message</label><textarea id="fmessage" name="message" required placeholder="Tell me a bit about your team and where you would like help."></textarea></div><button type="submit" class="btn btn-primary">Send Message</button><p class="form-note">' +
      esc(data.contact.note) +
      '</p><div class="form-success" id="formSuccess">Your email app should now be open with your message ready to send.</div></form></div>' +
      '<div class="contact-card reveal"><div class="contact-row"><div class="icon-badge">' +
      iconSvg(0) +
      '</div><div><h4>Email</h4><a href="mailto:' +
      esc(data.contact.email) +
      '">' +
      esc(data.contact.email) +
      '</a></div></div><div class="contact-row"><div class="icon-badge">' +
      iconSvg(1) +
      '</div><div><h4>Availability</h4><p>' +
      html(data.contact.availability) +
      '</p></div></div><div class="contact-row"><div class="icon-badge">' +
      iconSvg(2) +
      '</div><div><h4>Based in</h4><p>' +
      esc(data.contact.location) +
      '</p></div></div><div class="social-row"><a href="https://www.linkedin.com/in/seifelbakry/" aria-label="LinkedIn" target="_blank" rel="noopener">in</a><a href="#" aria-label="Facebook">f</a><a href="#" aria-label="Instagram">ig</a><a href="#" aria-label="YouTube">yt</a></div></div></div>';

    document.querySelector('.footer-tagline').textContent = data.contact.footerTagline;
    document.querySelectorAll('.footer-links a[href^="mailto:"]').forEach(function (a) {
      a.href = 'mailto:' + data.contact.email;
      a.textContent = data.contact.email;
    });
    var footerBottom = document.querySelectorAll('.footer-bottom span');
    if (footerBottom[0]) footerBottom[0].textContent = data.contact.footerCopyright;
    if (footerBottom[1]) footerBottom[1].textContent = data.contact.footerLocation;
    document.querySelectorAll('.js-photo').forEach(function (img) {
      img.src = photoSrc();
    });
    document.querySelectorAll('.js-logo').forEach(function (img) {
      img.src = logoSrc();
    });
    bindDynamic();
  }

  function renderFork() {
    var head = data.forkHead || {};
    return (
      '<div class="container"><div class="section-head"><div class="eyebrow reveal">' +
      esc(head.eyebrow) +
      '</div><h2 class="reveal">' +
      html(head.title) +
      '</h2></div><div class="fork-intro-wrap">' +
      (head.text ? '<p class="fork-intro reveal">' + esc(head.text) + '</p>' : '<div></div>') +
      '<div class="fork-note reveal"><span>How to use this</span><strong>Choose the lane that matches the real problem.</strong><p>One path sharpens presales judgment. The other builds the sales engine around it.</p></div></div><div class="fork-grid">' +
      (data.fork || [])
        .map(function (f, idx) {
          return (
            '<a class="fork-card ' +
            (f.accent === 'engine' ? 'engine' : '') +
            ' reveal" href="#services"><div class="fork-topline"><span class="fork-kicker">' +
            esc(f.label) +
            '</span><span class="fork-index">0' +
            (idx + 1) +
            '</span></div><h3>' +
            esc(f.title) +
            '</h3><div class="fork-audience">' +
            esc(f.audience) +
            '</div><div class="fork-detail"><p>' +
            esc(f.text) +
            '</p><ul class="fork-list">' +
            (f.steps || [])
              .map(function (step) {
                return (
                  '<li><b>' +
                  esc(step[0]) +
                  '</b><span><strong>' +
                  esc(step[1]) +
                  '</strong><br>' +
                  esc(step[2]) +
                  '</span></li>'
                );
              })
              .join('') +
            '</ul></div><div class="fork-cta"><span>' +
            esc(f.cta) +
            '</span></div></a>'
          );
        })
        .join('') +
      '</div></div>'
    );
  }
  function renderSystems() {
    return (
      '<div class="container"><div class="section-head"><div class="eyebrow reveal">' +
      esc(data.servicesHead.eyebrow) +
      '</div><h2 class="reveal">' +
      html(data.servicesHead.title) +
      '</h2><p class="reveal">' +
      esc(data.servicesHead.text) +
      '</p></div><div class="systems-grid">' +
      (data.systems || [])
        .map(function (s) {
          var systemCourses = (data.courses || []).filter(function (c) {
            return c.tag === s.label;
          });
          if (!systemCourses.length) systemCourses = s.courses || [];
          return (
            '<div class="system-card ' +
            (s.accent === 'engine' ? 'engine' : '') +
            ' reveal"><span class="system-label">' +
            esc(s.label) +
            '</span><h3>' +
            esc(s.title) +
            '</h3><div class="system-audience">' +
            esc(s.audience) +
            '</div><p>' +
            esc(s.text) +
            '</p>' +
            (s.boundary ? '<div class="boundary-line">' + esc(s.boundary) + '</div>' : '') +
            '<div class="course-list">' +
            systemCourses
              .map(function (c, idx) {
                return (
                  '<div class="mini-course"><span>' +
                  esc(c.no || ('0' + (idx + 1)).slice(-2)) +
                  ' / Course</span><strong>' +
                  esc(c.title) +
                  '</strong><p><b>' +
                  esc(c.meta || c.duration || '') +
                  '</b><br>' +
                  esc(c.text) +
                  '</p></div>'
                );
              })
              .join('') +
            '</div><div class="consultation-box"><span>Consultation</span><strong>' +
            esc(s.consultationTitle) +
            '</strong><p>' +
            esc(s.consultationText) +
            '</p></div><div class="outcome-line">' +
            esc(s.outcome) +
            '</div></div>'
          );
        })
        .join('') +
      '</div></div>'
    );
  }
  function renderWhy() {
    var w = data.why || {};
    return (
      '<div class="container"><div class="section-head"><div class="eyebrow reveal">' +
      esc(w.eyebrow) +
      '</div><h2 class="reveal">' +
      html(w.title) +
      '</h2><p class="reveal">' +
      esc(w.text) +
      '</p></div><div class="why-grid">' +
      (w.columns || [])
        .map(function (col) {
          return (
            '<div class="why-card reveal"><span>' +
            esc(col.label) +
            '</span><h3>' +
            esc(col.title) +
            '</h3><p>' +
            esc(col.text) +
            '</p></div>'
          );
        })
        .join('') +
      '</div><p class="approach-intro reveal" style="margin:34px 0 0;color:var(--text-on-dark);">' +
      esc(w.close) +
      '</p></div>'
    );
  }
  function renderAbout() {
    return (
      '<div class="container about-grid"><div class="about-photo-frame reveal"><img class="js-photo" src="' +
      photoSrc() +
      '" alt="Seif ElBakry"></div><div class="about-text"><div class="eyebrow reveal">' +
      esc(data.about.eyebrow) +
      '</div><h2 class="reveal">' +
      html(data.about.title) +
      '</h2>' +
      data.about.paragraphs
        .map(function (p) {
          return '<p class="reveal">' + esc(p) + '</p>';
        })
        .join('') +
      '<div class="journey">' +
      data.about.journey
        .map(function (j) {
          return (
            '<div class="journey-item reveal"><span class="journey-phase">' +
            esc(j.phase) +
            '</span><div><h4>' +
            esc(j.title) +
            '</h4><p>' +
            esc(j.text) +
            '</p></div></div>'
          );
        })
        .join('') +
      '</div></div></div>'
    );
  }
  function renderBlog() {
    var head = data.blogHead || {};
    var posts = data.blog || [];
    return (
      '<div class="container"><div class="section-head"><div class="eyebrow reveal">' +
      esc(head.eyebrow) +
      '</div><h2 class="reveal">' +
      html(head.title) +
      '</h2><p class="reveal">' +
      esc(head.text) +
      '</p></div>' +
      (posts.length
        ? '<div class="courses-grid">' +
          posts
            .map(function (p, i) {
              return (
                '<div class="course-card blog-card reveal"><div class="course-top"></div><div class="course-media">' +
                blogMediaPreview(p) +
                '</div><div class="course-body"><span class="course-tag">' +
                esc(p.tag || 'Article') +
                (p.date ? ' - ' + esc(p.date) : '') +
                '</span><h3>' +
                esc(p.title) +
                '</h3><p>' +
                esc(p.excerpt) +
                '</p><a href="#post-' +
                i +
                '" class="course-link">' +
                esc(p.link || 'Read article') +
                ' ' +
                arrowSvg() +
                '</a></div></div>'
              );
            })
            .join('') +
          '</div>'
        : '<p class="approach-intro reveal">New articles are on their way - check back soon.</p>') +
      '</div>'
    );
  }
  function blogMediaPreview(p) {
    if (p.cover && p.cover.data)
      return '<img src="' + p.cover.data + '" alt="' + esc(p.title) + '">';
    return '<span>Article Cover</span>';
  }
  function externalAttrs(url) {
    return url && url.indexOf('http') === 0 ? ' target="_blank" rel="noopener"' : '';
  }

  function route() {
    var path = window.location.pathname || '';
    var hash = window.location.hash || (/\/admin\/?$/.test(path) ? '#admin' : '#home');
    document.body.classList.remove('view-home', 'view-admin', 'view-course', 'view-blog');
    if (hash === '#admin') {
      document.body.classList.add('view-admin');
      document.title = 'Admin - ' + data.meta.title;
      renderAdminGate();
      window.scrollTo(0, 0);
      return;
    }
    var match = hash.match(/^#course-(\d+)$/);
    if (match) {
      document.body.classList.add('view-course');
      renderCourseDetail(parseInt(match[1], 10));
      window.scrollTo(0, 0);
      return;
    }
    var postMatch = hash.match(/^#post-(\d+)$/);
    if (postMatch) {
      document.body.classList.add('view-blog');
      renderBlogDetail(parseInt(postMatch[1], 10));
      window.scrollTo(0, 0);
      return;
    }
    document.body.classList.add('view-home');
    document.title = data.meta.title;
    setTimeout(function () {
      var target = document.querySelector(hash);
      if (target) target.scrollIntoView();
    }, 30);
  }

  function assetPills(c) {
    var out = [];
    if (c.video && c.video.name)
      out.push('<span class="course-pill">Video: ' + esc(c.video.name) + '</span>');
    if (c.gallery && c.gallery.length)
      out.push('<span class="course-pill">' + c.gallery.length + ' photos</span>');
    if (c.files && c.files.length)
      out.push('<span class="course-pill">' + c.files.length + ' files</span>');
    return out.join('');
  }

  function renderCourseDetail(index) {
    var c = data.courses[index] || data.courses[0];
    var detail = document.getElementById('courseDetail');
    if (!detail || !c) return;
    detail.innerHTML =
      '<div class="container course-page-shell"><a class="back-link" href="#courses">' +
      arrowSvg() +
      ' Back to courses</a>' +
      '<div class="course-page-hero"><div><span class="eyebrow">' +
      esc(c.tag || 'Free Course') +
      '</span><h1>' +
      esc(c.pageTitle || c.title) +
      '</h1>' +
      '<p class="course-page-lede">' +
      esc(c.detail || c.text) +
      '</p><button type="button" class="btn btn-primary watch-link" data-course-scroll="#courseVideo">Start watching</button>' +
      '<div class="course-page-meta"><span>' +
      esc(c.duration || 'Free video lesson') +
      '</span><span>' +
      esc(c.level || 'All levels') +
      '</span><span>' +
      esc(c.price || 'Free') +
      '</span></div></div>' +
      '<div class="free-ribbon">Free course</div></div>' +
      '<div class="course-watch-card" id="courseVideo"><div class="course-video-box">' +
      courseVideo(c) +
      '</div></div>' +
      '<div class="course-detail-grid"><div>' +
      blockList('What you will learn', c.outcomes) +
      blockList('Curriculum', c.curriculum) +
      '</div><aside>' +
      resourcesBlock(c) +
      galleryBlock(c) +
      '</aside></div></div>';
  }

  function renderBlogDetail(index) {
    var posts = data.blog || [];
    var p = posts[index] || posts[0];
    var detail = document.getElementById('blogDetail');
    if (!detail) return;
    if (!p) {
      detail.innerHTML =
        '<div class="container course-page-shell"><a class="back-link" href="#blog">' +
        arrowSvg() +
        ' Back to blog</a><p>This article is not available yet.</p></div>';
      return;
    }
    detail.innerHTML =
      '<div class="container course-page-shell"><a class="back-link" href="#blog">' +
      arrowSvg() +
      ' Back to blog</a>' +
      '<div class="course-page-hero"><div><span class="eyebrow">' +
      esc(p.tag || 'Article') +
      '</span><h1>' +
      esc(p.pageTitle || p.title) +
      '</h1>' +
      '<p class="course-page-lede">' +
      esc(p.detail || p.excerpt) +
      '</p>' +
      '<div class="course-page-meta">' +
      (p.date ? '<span>' + esc(p.date) + '</span>' : '') +
      (p.author ? '<span>' + esc(p.author) + '</span>' : '') +
      '</div></div></div>' +
      (p.cover && p.cover.data
        ? '<div class="course-watch-card"><div class="course-video-box"><img src="' +
          p.cover.data +
          '" alt="' +
          esc(p.title) +
          '"></div></div>'
        : '') +
      '<div class="course-detail-grid"><div>' +
      articleBody(p.body) +
      '</div><aside>' +
      resourcesBlock(p) +
      galleryBlock(p) +
      '</aside></div></div>';
  }

  function articleBody(paragraphs) {
    paragraphs = paragraphs || [];
    if (!paragraphs.length)
      return '<div class="course-detail-block"><p>This article has not been written yet. Add the text from the admin Blog tab.</p></div>';
    return (
      '<div class="course-detail-block">' +
      paragraphs
        .map(function (para) {
          return '<p>' + esc(para) + '</p>';
        })
        .join('') +
      '</div>'
    );
  }

  function blockList(title, items) {
    items = items || [];
    if (!items.length) return '';
    return (
      '<div class="course-detail-block"><h2>' +
      esc(title) +
      '</h2><ul class="course-detail-list">' +
      items
        .map(function (item) {
          return '<li>' + esc(item) + '</li>';
        })
        .join('') +
      '</ul></div>'
    );
  }

  function courseVideo(c) {
    if (c.video && c.video.data)
      return (
        '<video src="' +
        c.video.data +
        '" controls playsinline poster="' +
        ((c.cover && c.cover.data) || '') +
        '"></video>'
      );
    if (c.videoUrl)
      return (
        '<iframe src="' +
        embedUrl(c.videoUrl) +
        '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
      );
    if (c.cover && c.cover.data)
      return '<img src="' + c.cover.data + '" alt="' + esc(c.title) + '">';
    return '<div class="course-video-empty"><strong>Your free course video goes here.</strong>Upload a video or paste a hosted video URL from the admin Courses tab.</div>';
  }

  function embedUrl(url) {
    url = String(url || '').trim();
    var yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
    if (yt) return 'https://www.youtube.com/embed/' + yt[1];
    var vm = url.match(/vimeo\.com\/(\d+)/);
    if (vm) return 'https://player.vimeo.com/video/' + vm[1];
    return url;
  }

  function galleryBlock(c) {
    var gallery = c.gallery || [];
    if (!gallery.length) return '';
    return (
      '<div class="course-detail-block"><h2>Course photos</h2><div class="admin-preview">' +
      gallery
        .map(function (file) {
          return '<img src="' + file.data + '" alt="' + esc(file.name || c.title) + '">';
        })
        .join('') +
      '</div></div>'
    );
  }

  function resourcesBlock(c) {
    var files = c.files || [];
    if (!files.length) return '';
    return (
      '<div class="course-detail-block"><h2>Resources</h2><div class="course-resource-grid">' +
      files
        .map(function (file) {
          return (
            '<a class="course-resource" href="' +
            file.data +
            '" download="' +
            esc(file.name || 'course-file') +
            '">' +
            esc(file.name || 'Course file') +
            '</a>'
          );
        })
        .join('') +
      '</div></div>'
    );
  }

  function bindDynamic() {
    initReveals();
    initCounters();
    initPremiumMotion();
    syncNavState();
    bindFaq();
    bindContactForm();
    updateProgress();
  }

  function initReveals() {
    if (revealObserver) revealObserver.disconnect();
    var revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry, i) {
            if (entry.isIntersecting) {
              var el = entry.target;
              setTimeout(
                function () {
                  el.classList.add('is-visible');
                },
                reduceMotion ? 0 : (i % 4) * 60,
              );
              io.unobserve(el);
            }
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -50px 0px' },
      );
      revealObserver = io;
      revealEls.forEach(function (el) {
        io.observe(el);
      });
    } else
      revealEls.forEach(function (el) {
        el.classList.add('is-visible');
      });
  }

  function initCounters() {
    document.querySelectorAll('.counter').forEach(function (el) {
      var target = parseInt(el.dataset.target, 10) || 0;
      if (reduceMotion) {
        el.textContent = target;
        return;
      }
      var start = null;
      function step(ts) {
        if (!start) start = ts;
        var progress = Math.min(1, (ts - start) / 1200);
        el.textContent = Math.round((1 - Math.pow(1 - progress, 3)) * target);
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  function initPremiumMotion() {
    if (reduceMotion || window.matchMedia('(pointer: coarse)').matches) return;
    document
      .querySelectorAll(
        '.fork-card, .system-card, .why-card, .course-card, .resource-feature, .course-detail-block, .contact-card',
      )
      .forEach(function (card) {
        card.addEventListener('pointermove', function (e) {
          var rect = card.getBoundingClientRect();
          var x = ((e.clientX - rect.left) / rect.width) * 100;
          var y = ((e.clientY - rect.top) / rect.height) * 100;
          card.style.setProperty('--mx', x.toFixed(1) + '%');
          card.style.setProperty('--my', y.toFixed(1) + '%');
        });
        card.addEventListener('pointerleave', function () {
          card.style.setProperty('--mx', '50%');
          card.style.setProperty('--my', '50%');
        });
      });
    document.querySelectorAll('.hero-visual-panel').forEach(function (panel) {
      panel.addEventListener('pointermove', function (e) {
        var rect = panel.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        panel.style.transform =
          'perspective(900px) rotateY(' +
          (x * 6).toFixed(2) +
          'deg) rotateX(' +
          (y * -5).toFixed(2) +
          'deg)';
      });
      panel.addEventListener('pointerleave', function () {
        panel.style.transform = '';
      });
    });
  }

  function bindFaq() {
    document.querySelectorAll('.faq-q').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.closest('.faq-item');
        var isOpen = item.classList.contains('open');
        item.parentElement.querySelectorAll('.faq-item').forEach(function (other) {
          other.classList.remove('open');
          other.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) {
          item.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  function bindContactForm() {
    var form = document.getElementById('contactForm');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var subject = encodeURIComponent('Website inquiry from ' + form.name.value.trim());
      var body = encodeURIComponent(
        [
          'Name: ' + form.name.value.trim(),
          'Email: ' + form.email.value.trim(),
          'Company: ' + (form.company.value.trim() || 'N/A'),
          '',
          form.message.value.trim(),
        ].join('\n'),
      );
      window.location.href =
        'mailto:' + data.contact.email + '?subject=' + subject + '&body=' + body;
      document.getElementById('formSuccess').classList.add('show');
    });
  }

  function bindChrome() {
    var nav = document.getElementById('nav');
    window.addEventListener(
      'scroll',
      function () {
        nav.classList.toggle('scrolled', window.scrollY > 30);
        syncNavState();
      },
      { passive: true },
    );
    var burger = document.getElementById('navBurger');
    var navLinks = document.getElementById('navLinks');
    burger.addEventListener('click', function () {
      var open = navLinks.classList.toggle('open');
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        navLinks.classList.remove('open');
        burger.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-course-scroll]');
      if (!btn) return;
      e.preventDefault();
      var target = document.querySelector(btn.dataset.courseScroll);
      if (target)
        target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    window.addEventListener('hashchange', route);
    bindAdminLogin();
  }

  function activeSectionLink(links) {
    var scrollPos = window.scrollY + 150;
    var current = null;
    var bestTop = -Infinity;
    links.forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href || href.charAt(0) !== '#') return;
      var section = document.querySelector(href);
      if (
        section &&
        section.offsetParent !== null &&
        section.offsetTop <= scrollPos &&
        section.offsetTop > bestTop
      ) {
        bestTop = section.offsetTop;
        current = link;
      }
    });
    if (
      !current &&
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
    )
      current = links[links.length - 1];
    return current;
  }

  function syncNavState() {
    var hash = window.location.hash || '#home';
    var links = document.querySelectorAll('#navLinks a');
    if (!links.length) return;
    if (
      document.body.classList.contains('view-course') ||
      document.body.classList.contains('view-blog') ||
      document.body.classList.contains('view-admin')
    ) {
      var staticActive =
        hash.indexOf('#course-') === 0 ? '#courses' : hash.indexOf('#post-') === 0 ? '#blog' : hash;
      links.forEach(function (link) {
        link.classList.toggle('active', link.getAttribute('href') === staticActive);
      });
      return;
    }
    var current = activeSectionLink(links);
    var currentHref = current ? current.getAttribute('href') : null;
    links.forEach(function (link) {
      link.classList.toggle(
        'active',
        currentHref !== null && link.getAttribute('href') === currentHref,
      );
    });
  }

  function bindAdminLogin() {
    var form = document.getElementById('adminLoginForm');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var user = form.username.value.trim();
      var pass = form.password.value;
      var error = document.getElementById('adminLoginError');
      if (user === ADMIN_USER && pass === ADMIN_PASS) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
        form.reset();
        if (error) error.classList.remove('show');
        renderAdminGate();
      } else if (error) {
        error.classList.add('show');
      }
    });
  }

  function updateProgress() {
    var progressFill = document.getElementById('progressFill');
    if (!progressFill) return;
    var doc = document.documentElement;
    var pct =
      doc.scrollHeight - doc.clientHeight > 0
        ? Math.min(100, (window.scrollY / (doc.scrollHeight - doc.clientHeight)) * 100)
        : 0;
    progressFill.style.width = pct + '%';
    var stageLabels = document.querySelectorAll('.stage-label');
    if (!stageLabels.length) return;
    if (
      document.body.classList.contains('view-course') ||
      document.body.classList.contains('view-blog') ||
      document.body.classList.contains('view-admin')
    ) {
      stageLabels.forEach(function (label) {
        label.classList.remove('active');
      });
      return;
    }
    var current = activeSectionLink(stageLabels);
    stageLabels.forEach(function (label) {
      label.classList.toggle('active', label === current);
    });
  }

  function renderAdminGate() {
    var unlocked = isAdminLoggedIn();
    document.body.classList.toggle('admin-unlocked', unlocked);
    document.body.classList.toggle('admin-locked', !unlocked);
    if (unlocked) renderAdmin();
  }

  function renderAdmin() {
    var tabs = [
      ['dashboard', 'Dashboard'],
      ['colors', 'Colors'],
      ['design', 'Fonts & Layout'],
      ['complete', 'All Content'],
      ['media', 'Media'],
      ['copy', 'Copy'],
      ['heads', 'Headlines'],
      ['lists', 'Sections'],
      ['courses', 'Free Courses'],
      ['blog', 'Blog Posts'],
      ['contact', 'Contact'],
      ['tools', 'Data'],
    ];
    data.courses = Array.isArray(data.courses) ? data.courses.filter(Boolean) : [];
    data.blog = Array.isArray(data.blog) ? data.blog.filter(Boolean) : [];
    var videos = data.courses.filter(function (c) {
      return (c.video && c.video.data) || c.videoUrl;
    }).length;
    var branded =
      (data.assets && data.assets.logo ? 1 : 0) + (data.assets && data.assets.photo ? 1 : 0);
    var metrics = [
      ['Courses', data.courses.length],
      ['Blog posts', data.blog.length],
      ['Videos', videos],
      [
        'Sections',
        (data.fork || []).length +
          (data.systems || []).length +
          (data.why && data.why.columns ? data.why.columns.length : 0) +
          (data.faqs || []).length,
      ],
      ['Brand media', branded + '/2'],
    ];
    var metricsEl = document.getElementById('adminMetrics');
    if (metricsEl)
      metricsEl.innerHTML = metrics
        .map(function (m) {
          return (
            '<div class="admin-metric"><strong>' +
            esc(m[1]) +
            '</strong><span>' +
            esc(m[0]) +
            '</span></div>'
          );
        })
        .join('');
    var tabsEl = document.getElementById('adminTabs');
    var workspace = document.getElementById('adminWorkspace');
    if (!tabsEl || !workspace) return;
    tabsEl.innerHTML = tabs
      .map(function (t) {
        return (
          '<button class="admin-tab ' +
          (activeAdminTab === t[0] ? 'active' : '') +
          '" data-tab="' +
          t[0] +
          '">' +
          t[1] +
          '</button>'
        );
      })
      .join('');
    try {
      workspace.innerHTML = adminContent();
    } catch (err) {
      workspace.innerHTML =
        adminTop(
          'Admin Data Error',
          'Saved browser data had a problem. Use the reset button below to restore the default editable content.',
          '<button class="admin-btn danger" data-action="reset">Reset admin data</button>',
        ) +
        '<div class="admin-card full"><h4>Error details</h4><p>' +
        esc(err.message || err) +
        '</p></div>';
    }
    bindAdmin();
  }

  function adminContent() {
    if (activeAdminTab === 'design') return designEditor();
    if (activeAdminTab === 'complete')
      return (
        adminTop(
          'All Content',
          'Expand a section to edit its full content, including nested steps, Arabic text, links, and labels.',
        ) +
        '<div class="admin-card">' +
        completeEditor(data, '') +
        '</div>'
      );
    if (activeAdminTab === 'dashboard')
      return (
        adminTop(
          'Dashboard',
          'Manage the website like a real content studio. Jump into the main editing areas below.',
          '<a class="admin-btn secondary" href="#home">View site</a><button class="admin-btn" data-action="set-tab" data-target-tab="courses">Manage courses</button>',
        ) +
        '<div class="admin-grid">' +
        card(
          'Fast Edits',
          '<div class="admin-actions"><button class="admin-btn secondary" data-action="set-tab" data-target-tab="colors">Colors</button><button class="admin-btn secondary" data-action="set-tab" data-target-tab="media">Media</button><button class="admin-btn secondary" data-action="set-tab" data-target-tab="copy">Main copy</button><button class="admin-btn secondary" data-action="set-tab" data-target-tab="heads">Section heads</button><button class="admin-btn secondary" data-action="set-tab" data-target-tab="contact">Contact</button></div>',
        ) +
        card(
          'Course Library',
          '<p class="admin-mini">Courses are free video pages. Add videos, covers, learning outcomes, curriculum, galleries, and downloadable files.</p><div class="admin-actions" style="margin-top:14px;"><button class="admin-btn" data-action="set-tab" data-target-tab="courses">Open course editor</button><a class="admin-btn secondary" href="#course-0">Preview first course</a></div>',
        ) +
        card(
          'Blog',
          '<p class="admin-mini">Blog posts are simple articles: a cover image, a summary, and the article text as paragraphs.</p><div class="admin-actions" style="margin-top:14px;"><button class="admin-btn" data-action="set-tab" data-target-tab="blog">Open blog editor</button><a class="admin-btn secondary" href="#post-0">Preview first post</a></div>',
        ) +
        '<div class="admin-card"><h4>Publishing Checklist</h4><div class="admin-checklist">' +
        checklistHtml(
          data.courses.filter(function (c) {
            return (c.video && c.video.data) || c.videoUrl;
          }).length,
        ) +
        '</div></div>' +
        '<div class="admin-card"><h4>What You Can Control</h4><div class="admin-checklist"><div class="admin-check"><span>Every homepage section</span><span class="admin-badge ok">Editable</span></div><div class="admin-check"><span>Logo and portrait</span><span class="admin-badge ok">Editable</span></div><div class="admin-check"><span>Course videos and files</span><span class="admin-badge ok">Editable</span></div><div class="admin-check"><span>Full color palette</span><span class="admin-badge ok">Editable</span></div></div></div>' +
        '<div class="admin-card full"><h4>Current Free Courses</h4><div class="admin-list">' +
        data.courses
          .map(function (c, i) {
            return (
              '<div class="admin-item-head"><strong>' +
              esc(c.title) +
              '</strong><div class="admin-actions"><span class="admin-badge ' +
              ((c.video && c.video.data) || c.videoUrl ? 'ok' : '') +
              '">' +
              ((c.video && c.video.data) || c.videoUrl ? 'Video ready' : 'Needs video') +
              '</span><a class="admin-btn secondary" href="#course-' +
              i +
              '">View</a></div></div>'
            );
          })
          .join('') +
        '</div></div></div>'
      );
    if (activeAdminTab === 'colors')
      return (
        adminTop(
          'Website Colors',
          'Change the main colors used across the full website. Save happens automatically as you edit.',
        ) +
        '<div class="admin-grid">' +
        card(
          'Brand Palette',
          colorField('Background', 'theme.bg') +
            colorField('Alt background', 'theme.bgAlt') +
            colorField('Cards / surface', 'theme.surface') +
            colorField('Main orange', 'theme.brass') +
            colorField('Light orange', 'theme.brassLight') +
            colorField('Blue', 'theme.teal') +
            colorField('Light blue', 'theme.tealLight') +
            colorField('Text', 'theme.text') +
            colorField('Muted text', 'theme.textMuted') +
            colorField('Navy', 'theme.navy') +
            colorField('Photo panel blue', 'theme.bluePanel'),
        ) +
        '</div>'
      );
    if (activeAdminTab === 'media')
      return (
        adminTop(
          'Media & Branding',
          'Replace the logo and portrait used across the website. These uploads save in this browser with the rest of the site data.',
        ) +
        '<div class="admin-grid">' +
        card(
          'Website Logo',
          assetPreview(
            'Logo',
            logoSrc(),
            data.assets && data.assets.logo && data.assets.logo.name,
            'Shown in the header, footer, and admin dashboard.',
          ) +
            fileField('Upload logo', 'assets.logo', 'image/*') +
            '<button class="admin-btn secondary" data-action="clear-asset" data-asset="logo">Use original logo</button>',
        ) +
        card(
          'Portrait Photo',
          assetPreview(
            'Portrait',
            photoSrc(),
            data.assets && data.assets.photo && data.assets.photo.name,
            'Shown in the hero and about sections.',
          ) +
            fileField('Upload portrait', 'assets.photo', 'image/*') +
            '<button class="admin-btn secondary" data-action="clear-asset" data-asset="photo">Use original portrait</button>',
        ) +
        '</div>'
      );
    if (activeAdminTab === 'copy')
      return (
        adminTop(
          'Site Copy',
          'Edit the main page headlines, descriptions, and call-to-action text.',
        ) +
        '<div class="admin-grid">' +
        card(
          'Metadata',
          field('Browser title', 'meta.title') +
            field('Meta description', 'meta.description', 'textarea'),
        ) +
        card(
          'Navigation',
          field('About label', 'nav.about') +
            field('Services label', 'nav.services') +
            field('Fork label', 'nav.approach') +
            field('Courses label', 'nav.courses') +
            field('FAQ label', 'nav.faq') +
            field('Contact label', 'nav.contact') +
            field('Admin label', 'nav.admin') +
            field('Header button', 'nav.cta') +
            field('Header button link', 'nav.ctaLink'),
        ) +
        card(
          'Hero',
          field('Eyebrow', 'hero.eyebrow') +
            field('Hero title', 'hero.title', 'textarea') +
            field('Subtitle', 'hero.subtitle', 'textarea') +
            field('Primary button', 'hero.primaryCta') +
            field('Secondary button', 'hero.secondaryCta') +
            field('Badge number', 'hero.badgeNumber') +
            field('Badge label', 'hero.badgeLabel'),
        ) +
        card(
          'About',
          field('Eyebrow', 'about.eyebrow') +
            field('Title', 'about.title', 'textarea') +
            field('Paragraph 1', 'about.paragraphs.0', 'textarea') +
            field('Paragraph 2', 'about.paragraphs.1', 'textarea'),
        ) +
        card(
          'CTA Band',
          field('Eyebrow', 'cta.eyebrow') +
            field('Title', 'cta.title', 'textarea') +
            field('Text', 'cta.text', 'textarea') +
            field('Button', 'cta.button') +
            field('Button link', 'cta.link'),
        ) +
        '</div>'
      );
    if (activeAdminTab === 'heads')
      return (
        adminTop(
          'Section Headlines',
          'Edit every section heading and intro line on the public site.',
        ) +
        '<div class="admin-grid">' +
        card(
          'Fork Heading',
          field('Eyebrow', 'forkHead.eyebrow') +
            field('Title', 'forkHead.title', 'textarea') +
            field('Intro', 'forkHead.text', 'textarea'),
        ) +
        card(
          'Services Heading',
          field('Eyebrow', 'servicesHead.eyebrow') +
            field('Title', 'servicesHead.title', 'textarea') +
            field('Intro', 'servicesHead.text', 'textarea'),
        ) +
        card(
          'Why Heading',
          field('Eyebrow', 'why.eyebrow') +
            field('Title', 'why.title', 'textarea') +
            field('Intro', 'why.text', 'textarea') +
            field('Closing line', 'why.close', 'textarea'),
        ) +
        card(
          'Courses Heading',
          field('Eyebrow', 'coursesHead.eyebrow') +
            field('Title', 'coursesHead.title', 'textarea') +
            field('Intro', 'coursesHead.text', 'textarea'),
        ) +
        card(
          'Free Resource',
          field('Eyebrow', 'resource.eyebrow') +
            field('Title', 'resource.title', 'textarea') +
            field('Text', 'resource.text', 'textarea') +
            field('Button', 'resource.button'),
        ) +
        '</div>'
      );
    if (activeAdminTab === 'lists')
      return (
        adminTop(
          'Lists & Sections',
          'Edit proof stats, frameworks, services, FAQs, and journey items.',
        ) +
        '<div class="admin-grid"><div class="admin-card full">' +
        listEditor('stats', 'Proof Stats', ['number', 'suffix', 'label']) +
        '</div><div class="admin-card full">' +
        listEditor('fork', 'Fork Columns', ['label', 'title', 'audience', 'text', 'cta']) +
        '</div><div class="admin-card full">' +
        listEditor('systems', 'Service Systems', [
          'label',
          'title',
          'audience',
          'text',
          'boundary',
          'consultationTitle',
          'consultationText',
          'outcome',
        ]) +
        '</div><div class="admin-card full">' +
        listEditor('why.columns', 'Why Cards', ['label', 'title', 'text']) +
        '</div><div class="admin-card full">' +
        listEditor('about.journey', 'About Bridge', ['phase', 'title', 'text']) +
        '</div><div class="admin-card full">' +
        listEditor('faqs', 'FAQs', ['q', 'a']) +
        '</div></div>'
      );
    if (activeAdminTab === 'courses')
      return (
        adminTop(
          'Free Courses',
          'Build free video courses. The video is the course: upload a video file or paste a YouTube/Vimeo URL, then edit the page text and learning material.',
          '<button class="admin-btn" data-action="add-course">Add Free Course</button>',
        ) +
        '<div class="admin-grid"><div class="admin-card full">' +
        field('Courses eyebrow', 'coursesHead.eyebrow') +
        field('Courses title', 'coursesHead.title', 'textarea') +
        field('Courses intro', 'coursesHead.text', 'textarea') +
        '</div><div class="admin-card full"><div class="admin-list">' +
        data.courses.map(courseEditor).join('') +
        '</div></div></div>'
      );
    if (activeAdminTab === 'blog')
      return (
        adminTop(
          'Blog Posts',
          'Write and manage blog articles. Add a cover image, publish date, and full article text.',
          '<button class="admin-btn" data-action="add-post">Add Blog Post</button>',
        ) +
        '<div class="admin-grid"><div class="admin-card full">' +
        field('Blog eyebrow', 'blogHead.eyebrow') +
        field('Blog title', 'blogHead.title', 'textarea') +
        field('Blog intro', 'blogHead.text', 'textarea') +
        '</div><div class="admin-card full"><div class="admin-list">' +
        data.blog.map(postEditor).join('') +
        '</div></div></div>'
      );
    if (activeAdminTab === 'contact')
      return (
        adminTop('Contact', 'Update contact details and footer copy.') +
        '<div class="admin-grid">' +
        card(
          'Contact Block',
          field('Eyebrow', 'contact.eyebrow') +
            field('Title', 'contact.title', 'textarea') +
            field('Email', 'contact.email') +
            field('Availability', 'contact.availability', 'textarea') +
            field('Location', 'contact.location', 'textarea') +
            field('Form note', 'contact.note', 'textarea'),
        ) +
        card(
          'Footer',
          field('Footer tagline', 'contact.footerTagline', 'textarea') +
            field('Copyright line', 'contact.footerCopyright') +
            field('Footer location', 'contact.footerLocation'),
        ) +
        '</div>'
      );
    return (
      adminTop(
        'Import / Export',
        'Download a website with your saved edits, or move content between browsers.',
        '<button class="admin-btn" data-action="download-site">Download website HTML</button>',
      ) +
      '<div class="admin-grid"><div class="admin-card full"><div class="admin-actions"><button class="admin-btn" data-action="export">Export JSON</button><button class="admin-btn secondary" data-action="import">Import JSON</button><button class="admin-btn danger" data-action="reset">Reset All</button></div><div class="admin-field" style="margin-top:16px;"><label for="adminJson">Website JSON</label><textarea id="adminJson" style="min-height:320px;">' +
      esc(JSON.stringify(data, null, 2)) +
      '</textarea></div><p class="admin-mini">Export before big edits. Uploaded media is included as data URLs, so the JSON can become large.</p></div></div>'
    );
  }

  function adminTop(title, text, actions) {
    return (
      '<div class="admin-topbar"><div><h3>' +
      esc(title) +
      '</h3><p>' +
      esc(text) +
      '</p></div><div class="admin-actions">' +
      (actions || '<button class="admin-btn" data-action="save">Save Now</button>') +
      '</div></div>'
    );
  }
  function card(title, body) {
    return '<div class="admin-card"><h4>' + esc(title) + '</h4>' + body + '</div>';
  }
  function checklistHtml(videos) {
    var items = [
      ['Homepage copy', true],
      ['Brand colors', Object.keys(data.theme || {}).length >= 8],
      [
        'Logo and portrait',
        !!(data.assets && data.assets.logo) || !!(data.assets && data.assets.photo),
      ],
      ['At least one course video', videos > 0],
      ['Contact email', !!(data.contact && data.contact.email)],
    ];
    return items
      .map(function (item) {
        return (
          '<div class="admin-check"><span>' +
          esc(item[0]) +
          '</span><span class="admin-badge ' +
          (item[1] ? 'ok' : '') +
          '">' +
          (item[1] ? 'Ready' : 'Needs edit') +
          '</span></div>'
        );
      })
      .join('');
  }
  function assetPreview(label, src, name, note) {
    return (
      '<div class="admin-media-preview"><img src="' +
      src +
      '" alt="' +
      esc(label) +
      '"><div><strong>' +
      esc(label) +
      '</strong><span>' +
      esc(name || 'Using original file') +
      '</span><p class="admin-mini" style="margin-top:8px;">' +
      esc(note) +
      '</p></div></div>'
    );
  }
  function field(label, path, type) {
    var val = getPath(path);
    if (type === 'textarea')
      return (
        '<div class="admin-field"><label>' +
        esc(label) +
        '</label><textarea data-path="' +
        esc(path) +
        '">' +
        esc(val) +
        '</textarea></div>'
      );
    return (
      '<div class="admin-field"><label>' +
      esc(label) +
      '</label><input data-path="' +
      esc(path) +
      '" value="' +
      esc(val) +
      '"></div>'
    );
  }
  function colorField(label, path) {
    var val = getPath(path) || '#000000';
    return (
      '<div class="admin-field admin-color-row"><div><label>' +
      esc(label) +
      '</label><input data-path="' +
      esc(path) +
      '" value="' +
      esc(val) +
      '"></div><input type="color" data-path="' +
      esc(path) +
      '" value="' +
      esc(val) +
      '"></div>'
    );
  }
  function listEditor(path, title, keys) {
    var arr = getPath(path) || [];
    return (
      '<div class="admin-item-head"><strong>' +
      esc(title) +
      '</strong><button class="admin-btn secondary" data-action="add-item" data-list="' +
      path +
      '">Add</button></div><div class="admin-list">' +
      arr
        .map(function (item, i) {
          return (
            '<div class="admin-item"><div class="admin-item-head"><strong>' +
            esc(item.title || item.q || item.label || 'Item ' + (i + 1)) +
            '</strong><button class="admin-btn danger" data-action="remove-item" data-list="' +
            path +
            '" data-index="' +
            i +
            '">Remove</button></div>' +
            keys
              .map(function (k) {
                return field(
                  k,
                  path + '.' + i + '.' + k,
                  k === 'text' || k === 'quote' || k === 'a' ? 'textarea' : 'input',
                );
              })
              .join('') +
            '</div>'
          );
        })
        .join('') +
      '</div>'
    );
  }
  function courseEditor(c, i) {
    return (
      '<div class="admin-item"><div class="admin-item-head"><strong>' +
      esc(c.title || 'Course ' + (i + 1)) +
      '</strong><div class="admin-actions"><a class="admin-btn secondary" href="#course-' +
      i +
      '">Preview</a><button class="admin-btn danger" data-action="remove-course" data-index="' +
      i +
      '">Remove</button></div></div>' +
      field('Tag', 'courses.' + i + '.tag') +
      field('Homepage card title', 'courses.' + i + '.title') +
      field('Course page title', 'courses.' + i + '.pageTitle') +
      field('Homepage description', 'courses.' + i + '.text', 'textarea') +
      field('Course page detail', 'courses.' + i + '.detail', 'textarea') +
      field('Duration', 'courses.' + i + '.duration') +
      field('Level / audience', 'courses.' + i + '.level') +
      field('Free label', 'courses.' + i + '.price') +
      field('Hosted video URL', 'courses.' + i + '.videoUrl') +
      field('Card button label', 'courses.' + i + '.link') +
      textareaList('Learning outcomes', 'courses.' + i + '.outcomes') +
      textareaList('Curriculum', 'courses.' + i + '.curriculum') +
      '<p class="admin-mini">Upload a course video here or paste a hosted video URL above. Very large videos can hit browser storage limits in static HTML, so hosted video links are best for long lessons.</p>' +
      '<div class="admin-upload-grid">' +
      fileField(
        'Cover image',
        'courses.' + i + '.cover',
        'image/*',
        false,
        'Shown on the course card and course page.',
      ) +
      fileField(
        'Course video',
        'courses.' + i + '.video',
        'video/*',
        false,
        'The free lesson video students watch on the course page.',
      ) +
      fileField(
        'Gallery photos',
        'courses.' + i + '.gallery',
        'image/*',
        true,
        'Add photos or screenshots for this course page.',
      ) +
      fileField(
        'Files / resources',
        'courses.' + i + '.files',
        '*/*',
        true,
        'Attach PDFs, worksheets, slides, or any supporting files.',
      ) +
      '</div>' +
      mediaList(c, i) +
      '</div>'
    );
  }
  function postEditor(p, i) {
    return (
      '<div class="admin-item"><div class="admin-item-head"><strong>' +
      esc(p.title || 'Post ' + (i + 1)) +
      '</strong><div class="admin-actions"><a class="admin-btn secondary" href="#post-' +
      i +
      '">Preview</a><button class="admin-btn danger" data-action="remove-post" data-index="' +
      i +
      '">Remove</button></div></div>' +
      field('Tag / category', 'blog.' + i + '.tag') +
      field('Homepage card title', 'blog.' + i + '.title') +
      field('Article page title', 'blog.' + i + '.pageTitle') +
      field('Homepage summary', 'blog.' + i + '.excerpt', 'textarea') +
      field('Article intro', 'blog.' + i + '.detail', 'textarea') +
      field('Publish date', 'blog.' + i + '.date') +
      field('Author', 'blog.' + i + '.author') +
      field('Card button label', 'blog.' + i + '.link') +
      textareaList('Article paragraphs', 'blog.' + i + '.body') +
      '<p class="admin-mini">Each line becomes one paragraph on the article page.</p>' +
      '<div class="admin-upload-grid">' +
      fileField(
        'Cover image',
        'blog.' + i + '.cover',
        'image/*',
        false,
        'Shown on the blog card and at the top of the article.',
      ) +
      fileField(
        'Gallery photos',
        'blog.' + i + '.gallery',
        'image/*',
        true,
        'Add extra photos for this article.',
      ) +
      fileField(
        'Files / resources',
        'blog.' + i + '.files',
        '*/*',
        true,
        'Attach PDFs or downloadable resources for this article.',
      ) +
      '</div>' +
      mediaListPost(p, i) +
      '</div>'
    );
  }
  function mediaListPost(p, i) {
    var items = [];
    if (p.cover && p.cover.data) items.push(postFileCard('Cover image', p.cover, i, 'cover'));
    (p.gallery || []).forEach(function (f, idx) {
      items.push(postFileCard('Gallery photo ' + (idx + 1), f, i, 'gallery', idx));
    });
    (p.files || []).forEach(function (f, idx) {
      items.push(postFileCard('Resource file ' + (idx + 1), f, i, 'files', idx));
    });
    if (!items.length)
      return '<div class="admin-upload-summary"><h4>Uploaded post media</h4><p class="admin-mini">No files uploaded yet. Use the upload boxes above.</p></div>';
    return (
      '<div class="admin-upload-summary"><div class="admin-upload-summary-head"><h4>Uploaded post media</h4><span class="admin-badge ok">' +
      items.length +
      ' uploaded</span></div><div class="admin-file-grid">' +
      items.join('') +
      '</div></div>'
    );
  }
  function postFileCard(label, file, postIndex, fieldName, fileIndex) {
    var preview = filePreview(file, label);
    var indexAttr = fileIndex === undefined ? '' : ' data-file-index="' + fileIndex + '"';
    return (
      '<div class="admin-file-card">' +
      preview +
      '<div><strong>' +
      esc(label) +
      '</strong><span>' +
      esc(file.name || 'Uploaded file') +
      '</span><span>' +
      esc(fileMeta(file)) +
      '</span><button class="admin-btn danger" data-action="clear-post-media" data-index="' +
      postIndex +
      '" data-field="' +
      esc(fieldName) +
      '"' +
      indexAttr +
      '>Remove</button></div></div>'
    );
  }
  function textareaList(label, path) {
    var val = (getPath(path) || []).join('\n');
    return (
      '<div class="admin-field"><label>' +
      esc(label) +
      '</label><textarea data-list-path="' +
      esc(path) +
      '">' +
      esc(val) +
      '</textarea><span class="admin-mini">One item per line.</span></div>'
    );
  }
  function fileField(label, path, accept, multiple, hint) {
    var choose = multiple ? 'Choose files' : 'Choose file';
    return (
      '<div class="admin-upload-card"><div><strong>' +
      esc(label) +
      '</strong><span>' +
      esc(hint || 'Uploads are saved in this browser with the page data.') +
      '</span></div>' +
      '<label class="admin-upload-zone" data-file-target="' +
      esc(path) +
      '" data-multiple="' +
      (multiple ? 'true' : 'false') +
      '"><input type="file" data-file="' +
      esc(path) +
      '" accept="' +
      esc(accept || '*/*') +
      '"' +
      (multiple ? ' multiple' : '') +
      '><span class="admin-upload-title">' +
      choose +
      '</span><span>Click here or drag files into this box.</span></label></div>'
    );
  }
  function mediaList(c, i) {
    var items = [];
    if (c.cover && c.cover.data) items.push(courseFileCard('Cover image', c.cover, i, 'cover'));
    if (c.video && c.video.data) items.push(courseFileCard('Course video', c.video, i, 'video'));
    (c.gallery || []).forEach(function (f, idx) {
      items.push(courseFileCard('Gallery photo ' + (idx + 1), f, i, 'gallery', idx));
    });
    (c.files || []).forEach(function (f, idx) {
      items.push(courseFileCard('Resource file ' + (idx + 1), f, i, 'files', idx));
    });
    if (!items.length)
      return '<div class="admin-upload-summary"><h4>Uploaded course media</h4><p class="admin-mini">No course files uploaded yet. Use the upload boxes above.</p></div>';
    return (
      '<div class="admin-upload-summary"><div class="admin-upload-summary-head"><h4>Uploaded course media</h4><span class="admin-badge ok">' +
      items.length +
      ' uploaded</span></div><div class="admin-file-grid">' +
      items.join('') +
      '</div></div>'
    );
  }
  function courseFileCard(label, file, courseIndex, field, fileIndex) {
    var preview = filePreview(file, label);
    var indexAttr = fileIndex === undefined ? '' : ' data-file-index="' + fileIndex + '"';
    return (
      '<div class="admin-file-card">' +
      preview +
      '<div><strong>' +
      esc(label) +
      '</strong><span>' +
      esc(file.name || 'Uploaded file') +
      '</span><span>' +
      esc(fileMeta(file)) +
      '</span><button class="admin-btn danger" data-action="clear-course-media" data-index="' +
      courseIndex +
      '" data-field="' +
      esc(field) +
      '"' +
      indexAttr +
      '>Remove</button></div></div>'
    );
  }
  function filePreview(file, label) {
    var type = file && file.type ? file.type : '';
    var name = file && file.name ? file.name : '';
    if (
      file &&
      file.data &&
      (type.indexOf('image/') === 0 || /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(name))
    )
      return '<img src="' + file.data + '" alt="' + esc(label) + '">';
    if (file && file.data && (type.indexOf('video/') === 0 || /\.(mp4|webm|mov|m4v)$/i.test(name)))
      return '<video src="' + file.data + '" controls muted></video>';
    return '<div class="admin-file-icon">' + esc(fileExtension(name)) + '</div>';
  }
  function fileMeta(file) {
    var bits = [];
    if (file && file.type) bits.push(file.type);
    if (file && typeof file.size === 'number') bits.push(formatBytes(file.size));
    return bits.join(' - ') || 'Saved in this browser';
  }
  function fileExtension(name) {
    var match = String(name || '').match(/\.([a-z0-9]{1,6})$/i);
    return match ? match[1] : 'file';
  }
  function formatBytes(bytes) {
    if (typeof bytes !== 'number' || isNaN(bytes)) return '';
    var units = ['B', 'KB', 'MB', 'GB'];
    var size = bytes;
    var unit = 0;
    while (size >= 1024 && unit < units.length - 1) {
      size = size / 1024;
      unit += 1;
    }
    return (unit === 0 ? size : size.toFixed(size >= 10 ? 0 : 1)) + ' ' + units[unit];
  }

  function bindAdmin() {
    document.querySelectorAll('.admin-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        activeAdminTab = btn.dataset.tab;
        renderAdmin();
      });
    });
    document.querySelectorAll('[data-path]').forEach(function (input) {
      input.addEventListener('input', function () {
        if (input.type === 'number' && !input.checkValidity()) return;
        var old = getPath(input.dataset.path);
        setPath(
          input.dataset.path,
          typeof old === 'number'
            ? Number(input.value)
            : typeof old === 'boolean'
              ? input.value === 'true'
              : input.value,
        );
        renderSite();
        saveData();
      });
    });
    document.querySelectorAll('[data-design-motion]').forEach(function (input) {
      input.addEventListener('change', function () {
        data.design.motion = input.checked;
        applyDesign();
        saveData();
      });
    });
    document.querySelectorAll('[data-section-visible]').forEach(function (input) {
      input.addEventListener('change', function () {
        data.design.hidden = data.design.hidden.filter(function (id) {
          return id !== input.dataset.sectionVisible;
        });
        if (!input.checked) data.design.hidden.push(input.dataset.sectionVisible);
        applyDesign();
        saveData();
      });
    });
    document.querySelectorAll('[data-list-path]').forEach(function (input) {
      input.addEventListener('input', function () {
        setPath(
          input.dataset.listPath,
          input.value
            .split('\n')
            .map(function (v) {
              return v.trim();
            })
            .filter(Boolean),
        );
        renderSite();
        saveData();
      });
    });
    document.querySelectorAll('[data-file]').forEach(function (input) {
      input.addEventListener('change', function () {
        handleFiles(input);
      });
    });
    document.querySelectorAll('.admin-upload-zone').forEach(function (zone) {
      zone.addEventListener('dragover', function (e) {
        e.preventDefault();
        zone.classList.add('dragging');
      });
      zone.addEventListener('dragleave', function () {
        zone.classList.remove('dragging');
      });
      zone.addEventListener('drop', function (e) {
        e.preventDefault();
        zone.classList.remove('dragging');
        handleFilesFromList(
          zone.dataset.fileTarget,
          zone.dataset.multiple === 'true',
          e.dataTransfer && e.dataTransfer.files,
        );
      });
    });
    document.querySelectorAll('[data-action]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        handleAction(btn);
      });
    });
  }

  function handleFiles(input) {
    handleFilesFromList(input.dataset.file, input.multiple, input.files);
    input.value = '';
  }
  function handleFilesFromList(path, multiple, fileList) {
    var files = Array.prototype.slice.call(fileList || []);
    if (!files.length) return;
    showAdminStatus(
      'Uploading ' + files.length + ' file' + (files.length === 1 ? '' : 's') + '...',
    );
    Promise.all(files.map(readFile))
      .then(function (items) {
        var current = getPath(path);
        if (multiple) setPath(path, (Array.isArray(current) ? current : []).concat(items));
        else setPath(path, items[0]);
        renderSite();
        var saved = saveData();
        renderAdmin();
        showAdminStatus(
          saved
            ? uploadMessage(path, items.length)
            : 'Uploaded for preview, but it is too large to save in browser storage. Use a hosted video URL for big course videos.',
        );
      })
      .catch(function () {
        showAdminStatus('Upload failed. Try a smaller file or a different file type.');
      });
  }
  function uploadMessage(path, count) {
    var label =
      path.indexOf('.video') > -1
        ? 'course video'
        : path.indexOf('.cover') > -1
          ? 'cover image'
          : path.indexOf('.gallery') > -1
            ? 'gallery photo'
            : path.indexOf('.files') > -1
              ? 'resource file'
              : 'file';
    return 'Uploaded ' + count + ' ' + label + (count === 1 ? '' : 's') + '.';
  }
  function readFile(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        resolve({ name: file.name, type: file.type, size: file.size, data: reader.result });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function handleAction(btn) {
    var action = btn.dataset.action;
    if (action === 'download-site') {
      var page = document.documentElement.cloneNode(true);
      var oldSnapshot = page.querySelector('#publishedSiteData');
      if (oldSnapshot) oldSnapshot.remove();
      var snapshot = document.createElement('script');
      snapshot.id = 'publishedSiteData';
      snapshot.type = 'application/json';
      snapshot.textContent = JSON.stringify(data).replace(/</g, '\\u003c');
      page.querySelector('head').appendChild(snapshot);
      var workspace = page.querySelector('#adminWorkspace');
      if (workspace) workspace.innerHTML = '';
      page.querySelectorAll('input[type="password"]').forEach(function (input) {
        input.removeAttribute('value');
      });
      var download = document.createElement('a');
      var url = URL.createObjectURL(
        new Blob(['<!DOCTYPE html>\n' + page.outerHTML], { type: 'text/html' }),
      );
      download.href = url;
      download.download = 'index.html';
      download.click();
      setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 1000);
      showAdminStatus(
        'Website downloaded with current content and design. Keep the assets folder beside it.',
      );
    }
    if (action === 'save') saveData();
    if (action === 'logout') {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      renderAdminGate();
      return;
    }
    if (action === 'set-tab') {
      activeAdminTab = btn.dataset.targetTab || 'dashboard';
      renderAdmin();
    }
    if (action === 'clear-asset') {
      if (data.assets) data.assets[btn.dataset.asset] = null;
      saveData();
      renderSite();
      renderAdmin();
      route();
    }
    if (action === 'clear-course-media') {
      var course = data.courses[parseInt(btn.dataset.index, 10)];
      if (course) {
        var field = btn.dataset.field;
        var fileIndex = btn.dataset.fileIndex;
        if (Array.isArray(course[field])) {
          if (fileIndex !== undefined) course[field].splice(parseInt(fileIndex, 10), 1);
          else course[field] = [];
        } else {
          course[field] = null;
        }
        renderSite();
        var mediaSaved = saveData();
        renderAdmin();
        showAdminStatus(
          mediaSaved
            ? 'Upload removed.'
            : 'Removed for this session, but browser storage could not save.',
        );
      }
      return;
    }
    if (action === 'add-course') {
      data.courses.push({
        tag: 'Free Course',
        title: 'New Free Course',
        pageTitle: 'New Free Course',
        text: 'Watch this free course video.',
        detail: 'Add the full free course description here.',
        duration: 'Free video lesson',
        level: 'All levels',
        price: 'Free',
        videoUrl: '',
        link: 'View free course',
        cover: null,
        video: null,
        gallery: [],
        files: [],
        outcomes: ['Add a learning outcome'],
        curriculum: ['Add a curriculum item'],
      });
      saveData();
      renderSite();
      renderAdmin();
      route();
    }
    if (action === 'remove-course') {
      data.courses.splice(parseInt(btn.dataset.index, 10), 1);
      saveData();
      renderSite();
      renderAdmin();
    }
    if (action === 'clear-post-media') {
      var post = data.blog[parseInt(btn.dataset.index, 10)];
      if (post) {
        var postField = btn.dataset.field;
        var postFileIndex = btn.dataset.fileIndex;
        if (Array.isArray(post[postField])) {
          if (postFileIndex !== undefined) post[postField].splice(parseInt(postFileIndex, 10), 1);
          else post[postField] = [];
        } else {
          post[postField] = null;
        }
        renderSite();
        var postMediaSaved = saveData();
        renderAdmin();
        showAdminStatus(
          postMediaSaved
            ? 'Upload removed.'
            : 'Removed for this session, but browser storage could not save.',
        );
      }
      return;
    }
    if (action === 'add-post') {
      data.blog.push({
        tag: 'Article',
        title: 'New Blog Post',
        pageTitle: 'New Blog Post',
        excerpt: 'Add a short summary for this article.',
        detail: 'Add an introduction for this article.',
        date: 'Draft',
        author: 'Seif ElBakry',
        link: 'Read article',
        cover: null,
        gallery: [],
        files: [],
        body: ['Write the article here.'],
      });
      saveData();
      renderSite();
      renderAdmin();
      route();
    }
    if (action === 'remove-post') {
      data.blog.splice(parseInt(btn.dataset.index, 10), 1);
      saveData();
      renderSite();
      renderAdmin();
    }
    if (action === 'add-item') {
      (getPath(btn.dataset.list) || []).push({
        title: 'New item',
        text: 'Edit this text.',
        q: 'New question',
        a: 'Answer goes here.',
        label: 'New stat',
        number: '1',
        suffix: '+',
      });
      saveData();
      renderSite();
      renderAdmin();
    }
    if (action === 'remove-item') {
      getPath(btn.dataset.list).splice(parseInt(btn.dataset.index, 10), 1);
      saveData();
      renderSite();
      renderAdmin();
    }
    if (action === 'export') {
      document.getElementById('adminJson').value = JSON.stringify(data, null, 2);
      showAdminStatus('Export JSON refreshed.');
    }
    if (action === 'import') {
      try {
        data = mergeDefaults(defaultData, JSON.parse(document.getElementById('adminJson').value));
        saveData();
        renderSite();
        renderAdmin();
      } catch (err) {
        showAdminStatus('Import failed. Check that the JSON is valid.');
      }
    }
    if (action === 'reset' && confirm('Reset all website content and uploaded media?')) {
      localStorage.removeItem(STORE_KEY);
      localStorage.removeItem('seif_elbakry_site_cms_v5');
      data = JSON.parse(JSON.stringify(defaultData));
      activeAdminTab = 'dashboard';
      renderSite();
      renderAdminGate();
      showAdminStatus('Reset complete.');
    }
  }

  function getPath(path) {
    return path.split('.').reduce(function (obj, key) {
      return obj == null ? undefined : obj[key];
    }, data);
  }
  function setPath(path, value) {
    var parts = path.split('.');
    var obj = data;
    parts.slice(0, -1).forEach(function (key) {
      obj = obj[key];
    });
    obj[parts[parts.length - 1]] = value;
  }
  function showAdminStatus(message) {
    var el = document.getElementById('adminStatus');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(showAdminStatus.timer);
    showAdminStatus.timer = setTimeout(function () {
      el.classList.remove('show');
    }, 3200);
  }

  renderSite();
  bindChrome();
  route();
})();
