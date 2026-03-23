/**
 * Taichi Okada — Portfolio Site v2
 * script.js
 *
 * 1. Hero headline line-reveal animation (translateY curtain lift)
 * 2. Bilingual toggle (JA / EN) — data-ja / data-en attributes
 * 3. Mobile navigation
 * 4. Scroll reveal (IntersectionObserver)
 * 5. Line draw on section dividers
 * 6. Contact form validation + submission
 * 7. FAQ keyboard navigation
 * 8. Header scroll state
 */

(function () {
  'use strict';

  const LANG_KEY = 'lang';
  const DEFAULT  = 'ja';

  /* ============================================================
     UTILS
  ============================================================ */
  function getLang()        { try { return localStorage.getItem(LANG_KEY) || DEFAULT; } catch(e) { return DEFAULT; } }
  function setLang(l)       { try { localStorage.setItem(LANG_KEY, l); } catch(e) {} }
  function prefersReduced() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }


  /* ============================================================
     1. HERO HEADLINE — LINE REVEAL ANIMATION
        Each .hl element wraps its content in .hl-inner.
        CSS clips the text until .hl.is-visible slides it up.
  ============================================================ */
  function initHeroReveal() {
    const lines = document.querySelectorAll('.hero-headline .hl');
    if (!lines.length) return;

    if (prefersReduced()) {
      // Skip animation — just show immediately
      lines.forEach(l => l.classList.add('is-visible'));
      return;
    }

    // Wrap content in inner span for the curtain reveal
    lines.forEach(line => {
      const text = line.innerHTML;
      line.innerHTML = `<span class="hl-inner">${text}</span>`;
    });

    // Staggered reveal on load
    lines.forEach((line, i) => {
      setTimeout(() => line.classList.add('is-visible'), 220 + i * 130);
    });
  }


  /* ============================================================
     2. BILINGUAL TOGGLE
  ============================================================ */
  function applyLang(lang) {
    const isEN = lang === 'en';

    document.documentElement.lang = lang;

    // Text content
    document.querySelectorAll('[data-ja]').forEach(el => {
      const val = el.getAttribute(isEN ? 'data-en' : 'data-ja');
      if (val === null) return;

      // Handle <option> elements
      if (el.tagName === 'OPTION') {
        el.textContent = val;
        return;
      }

      // Only update leaf-ish elements (no deep child elements)
      // Exception: allow elements that only have text and no interactive children
      const hasInteractiveChild = el.querySelector('input, select, textarea, button, a');
      if (hasInteractiveChild) return;

      // If it has child elements that also carry data-ja, let those handle themselves
      const hasDataChildren = el.querySelector('[data-ja]');
      if (hasDataChildren) return;

      el.textContent = val;
    });

    // Page title
    document.title = isEN
      ? 'Taichi Okada — Workflow Design & AI Enablement'
      : 'Taichi Okada — 業務設計・AI活用・自動化';

    // Meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.content = isEN
        ? 'Taichi Okada — Supporting AI adoption, internal DX, and workflow improvement from field understanding to operational adoption.'
        : 'Taichi Okada — AI活用・社内DX・業務効率化を、現場理解から運用定着まで支援します。';
    }

    // Lang toggle visual state
    const toggle = document.getElementById('langToggle');
    if (toggle) {
      toggle.querySelectorAll('.lang-opt').forEach(opt => {
        opt.classList.toggle('is-active', opt.dataset.lang === lang);
      });
      toggle.setAttribute('aria-label', isEN ? 'Switch to Japanese' : '英語に切り替え');
    }
  }

  function initLangToggle() {
    const btn = document.getElementById('langToggle');
    if (!btn) return;

    let current = getLang();
    applyLang(current);

    btn.addEventListener('click', () => {
      current = current === 'ja' ? 'en' : 'ja';
      setLang(current);
      applyLang(current);
    });
  }


  /* ============================================================
     3. MOBILE NAV
  ============================================================ */
  function initMobileNav() {
    const btn = document.getElementById('menuToggle');
    const nav = document.getElementById('mobileNav');
    if (!btn || !nav) return;

    function close() {
      btn.setAttribute('aria-expanded', 'false');
      nav.setAttribute('aria-hidden', 'true');
      nav.classList.remove('is-open');
    }
    function open() {
      btn.setAttribute('aria-expanded', 'true');
      nav.setAttribute('aria-hidden', 'false');
      nav.classList.add('is-open');
    }

    btn.addEventListener('click', () => {
      btn.getAttribute('aria-expanded') === 'true' ? close() : open();
    });

    // Close on link click
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', close));

    // Close on outside click
    document.addEventListener('click', e => {
      if (!e.target.closest('.site-header')) close();
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') close();
    });
  }


  /* ============================================================
     4. SCROLL REVEAL
  ============================================================ */
  function initReveal() {
    if (prefersReduced()) {
      document.querySelectorAll('.reveal-item').forEach(el => el.classList.add('is-visible'));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -32px 0px' });

    // Stagger siblings that share a parent
    document.querySelectorAll('.reveal-item').forEach(el => {
      const siblings = Array.from(el.parentElement.children)
        .filter(c => c.classList.contains('reveal-item'));
      const idx = siblings.indexOf(el);
      if (idx > 0) el.style.transitionDelay = (idx * 70) + 'ms';
      io.observe(el);
    });
  }


  /* ============================================================
     5. SMOOTH SCROLL
  ============================================================ */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', e => {
        const href   = link.getAttribute('href');
        const target = href === '#' ? document.documentElement : document.querySelector(href);
        if (!target) return;

        e.preventDefault();
        const navH = document.querySelector('.site-header')?.offsetHeight || 76;
        const top  = href === '#' ? 0 : target.getBoundingClientRect().top + window.scrollY - navH - 4;

        window.scrollTo(prefersReduced() ? { top } : { top, behavior: 'smooth' });
      });
    });
  }


  /* ============================================================
     6. HEADER SCROLL STATE
  ============================================================ */
  function initHeaderScroll() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        header.classList.toggle('is-scrolled', window.scrollY > 4);
        ticking = false;
      });
    }, { passive: true });
  }


  /* ============================================================
     7. CONTACT FORM
  ============================================================ */
  const MSGS = {
    ja: { required: 'この項目は必須です', email: '有効なメールアドレスを入力してください', select: '選択してください' },
    en: { required: 'This field is required', email: 'Please enter a valid email address',  select: 'Please select an option' },
  };

  function msg(key) {
    return (MSGS[getLang()] || MSGS.ja)[key];
  }

  function setErr(field, text) {
    field.classList.add('has-error');
    const errEl = document.getElementById(field.getAttribute('aria-describedby'));
    if (errEl) errEl.textContent = text;
  }

  function clearErr(field) {
    field.classList.remove('has-error');
    const errEl = document.getElementById(field.getAttribute('aria-describedby'));
    if (errEl) errEl.textContent = '';
  }

  function validate(form) {
    let ok = true;
    form.querySelectorAll('[required]').forEach(field => {
      clearErr(field);
      const val = field.value.trim();
      if (!val) {
        setErr(field, field.tagName === 'SELECT' ? msg('select') : msg('required'));
        ok = false;
      } else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        setErr(field, msg('email'));
        ok = false;
      }
    });
    return ok;
  }

  function showStatus(type) {
    const el = document.getElementById('formStatus');
    if (!el) return;
    el.hidden = false;
    el.querySelector('.status-ok').hidden  = type !== 'ok';
    el.querySelector('.status-err').hidden = type !== 'err';
    applyLang(getLang()); // re-apply lang to status messages
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function initForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.querySelectorAll('input, textarea, select').forEach(f => {
      f.addEventListener('input',  () => clearErr(f));
      f.addEventListener('change', () => clearErr(f));
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!validate(form)) {
        form.querySelector('.has-error')?.focus();
        return;
      }

      const btn = document.getElementById('submitBtn');
      btn.classList.add('is-loading');
      btn.disabled = true;

      const action = form.getAttribute('action');
      const isPreview = !action || action === '#' || action === window.location.href.split('#')[0];

      if (isPreview) {
        // Preview mode — simulate 1s delay then success
        await new Promise(r => setTimeout(r, 1000));
        form.reset();
        btn.classList.remove('is-loading');
        btn.disabled = false;
        showStatus('ok');
        return;
      }

      try {
        const res = await fetch(action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' }
        });
        if (res.ok) { form.reset(); showStatus('ok'); }
        else throw new Error(res.status);
      } catch (err) {
        console.error('Form error:', err);
        showStatus('err');
      } finally {
        btn.classList.remove('is-loading');
        btn.disabled = false;
      }
    });
  }


  /* ============================================================
     8. FAQ KEYBOARD NAVIGATION
  ============================================================ */
  function initFaqKeys() {
    const summaries = Array.from(document.querySelectorAll('.faq-q'));
    summaries.forEach((s, i) => {
      s.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown' && summaries[i + 1]) { e.preventDefault(); summaries[i + 1].focus(); }
        if (e.key === 'ArrowUp'   && summaries[i - 1]) { e.preventDefault(); summaries[i - 1].focus(); }
      });
    });
  }


  /* ============================================================
     9. ACTIVE NAV — mark current page link
  ============================================================ */
  function initActiveNav() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-primary a, .mobile-nav a').forEach(link => {
      const href = link.getAttribute('href').split('#')[0].split('/').pop() || 'index.html';
      if (href === path) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }


  /* ============================================================
     INIT
  ============================================================ */
  function init() {
    initHeroReveal();
    initLangToggle();
    initMobileNav();
    initReveal();
    initSmoothScroll();
    initHeaderScroll();
    initForm();
    initFaqKeys();
    initActiveNav();
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();

})();
