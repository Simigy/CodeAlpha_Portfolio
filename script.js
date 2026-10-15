/* ============================================
   Sherif Ibrahim — Portfolio scripts
   ============================================ */
(function () {
  'use strict';

  /* ---------- helpers ---------- */

  // localStorage can throw (private mode, blocked cookies). Never let it break the page.
  const storage = {
    get(key) {
      try { return localStorage.getItem(key); } catch (e) { return null; }
    },
    set(key, value) {
      try { localStorage.setItem(key, value); } catch (e) { /* ignore */ }
    }
  };

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');


  /* ============================================
     1. THEME TOGGLE (Light / Dark)
     The inline script right after <body> applies the saved theme
     before first paint (no white flash). This keeps it in sync.
     ============================================ */

  const themeToggle = document.getElementById('themeToggle');
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

  function applyTheme(theme) {
    const dark = theme === 'dark';
    if (dark) {
      document.body.setAttribute('data-theme', 'dark');
    } else {
      document.body.removeAttribute('data-theme');
    }
    if (themeToggle) {
      themeToggle.setAttribute(
        'aria-label',
        dark ? 'Switch to light theme' : 'Switch to dark theme'
      );
    }
  }

  // Saved choice wins; otherwise follow the visitor's system setting.
  const savedTheme = storage.get('theme');
  applyTheme(savedTheme || (systemDark.matches ? 'dark' : 'light'));

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      storage.set('theme', next);
    });
  }

  // If the visitor never chose a theme, follow system changes live.
  if (systemDark.addEventListener) {
    systemDark.addEventListener('change', (e) => {
      if (!storage.get('theme')) applyTheme(e.matches ? 'dark' : 'light');
    });
  }


  /* ============================================
     2. MOBILE MENU TOGGLE
     ============================================ */

  const menuToggle = document.getElementById('menuToggle');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav-link');

  function setMenu(open) {
    if (!menuToggle || !navMenu) return;
    navMenu.classList.toggle('open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
  }

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      setMenu(!navMenu.classList.contains('open'));
    });

    // Close when a link is chosen
    navLinks.forEach((link) => link.addEventListener('click', () => setMenu(false)));

    // Close with Escape (and return focus to the button)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMenu.classList.contains('open')) {
        setMenu(false);
        menuToggle.focus();
      }
    });

    // Close when tapping outside the menu
    document.addEventListener('click', (e) => {
      if (
        navMenu.classList.contains('open') &&
        !navMenu.contains(e.target) &&
        !menuToggle.contains(e.target)
      ) {
        setMenu(false);
      }
    });

    // Reset when resizing up to desktop
    window.matchMedia('(min-width: 901px)').addEventListener('change', (e) => {
      if (e.matches) setMenu(false);
    });
  }


  /* ============================================
     3 + 4. SCROLL SPY and BACK-TO-TOP
     One rAF-throttled scroll handler instead of two raw listeners.
     ============================================ */

  const sections = Array.from(document.querySelectorAll('main section[id]'));
  const linkById = new Map();
  navLinks.forEach((link) => {
    const href = link.getAttribute('href') || '';
    if (href.startsWith('#')) linkById.set(href.slice(1), link);
  });

  let activeId = null;

  function setActive(id) {
    if (id === activeId) return;
    activeId = id;
    navLinks.forEach((link) => {
      const on = link === linkById.get(id);
      link.classList.toggle('active', on);
      if (on) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }

  function updateScrollSpy() {
    if (!sections.length) return;

    const y = window.scrollY + 120;            // line just below the sticky navbar
    let current = sections[0].id;
    sections.forEach((s) => { if (s.offsetTop <= y) current = s.id; });

    // At the very bottom, the last section (Contact) is too short to reach the line.
    const atBottom =
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (atBottom) current = sections[sections.length - 1].id;

    // Sections without a nav link (e.g. Education) keep the previous highlight.
    if (linkById.has(current)) setActive(current);
  }

  const backToTop = document.getElementById('backToTop');

  function toggleBackToTop() {
    if (!backToTop) return;
    backToTop.classList.toggle('visible', window.scrollY > 400);
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      updateScrollSpy();
      toggleBackToTop();
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  updateScrollSpy();
  toggleBackToTop();

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    });
  }


  /* ============================================
     5. REVEAL ON SCROLL
     ============================================ */

  const revealElements = document.querySelectorAll(
    '.section-header, .about-grid, .skills-grid, .case-studies-grid, ' +
    '.projects-grid, .timeline, .credentials-grid, .contact-grid'
  );

  if (!('IntersectionObserver' in window) || reducedMotion.matches) {
    // Old browser or reduced motion: just show everything.
    revealElements.forEach((el) => el.classList.add('revealed'));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      // threshold 0 + rootMargin works for very tall blocks too
      // (a 0.15 threshold can never be met by a block taller than ~6x the screen).
      { threshold: 0, rootMargin: '0px 0px -8% 0px' }
    );
    revealElements.forEach((el) => revealObserver.observe(el));
  }

  // Tell the <head> failsafe that the script ran to the end.
  window.__portfolioReady = true;
})();