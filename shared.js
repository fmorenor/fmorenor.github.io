/* shared.js — Nav, Footer y CSS base compartidos para todas las páginas de CartoData */
(function () {
  /* ── Inyectar site.css (design system) si no está ya cargado ── */
  if (!document.querySelector('link[href*="site.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './site.css';
    document.head.prepend(link);
  }

  /* ── Estilos compartidos ── */
  const style = document.createElement('style');
  style.textContent = `
    /* Nav — pixel-match con el React bundle del index */
    .cd-nav {
      position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 clamp(1rem,3vw,2.5rem); height: 64px;
      background: rgba(13,13,13,0.88);
      backdrop-filter: blur(20px) saturate(160%);
      -webkit-backdrop-filter: blur(20px) saturate(160%);
      border-bottom: 1px solid rgba(255,255,255,0.07);
      font-family: 'DM Sans', 'Inter', system-ui, sans-serif;
    }
    html.light .cd-nav {
      background: rgba(248,250,252,0.88);
      border-bottom: 1px solid rgba(0,0,0,0.08);
    }
    html.light .cd-nav-brand { color: #0f172a; }
    html.light .cd-nav-links {
      background: rgba(0,0,0,0.04);
      border-color: rgba(0,0,0,0.1);
    }
    html.light .cd-nav-links a { color: rgba(15,23,42,0.55); }
    html.light .cd-nav-links a:hover { color: #0f172a; background: rgba(0,0,0,0.05); }
    html.light .cd-nav-links a.cd-active { color: #0f172a; background: rgba(0,0,0,0.06); }
    html.light .cd-nav-links li + li::before { background: rgba(0,0,0,0.12); }
    html.light .cd-nav-lang { color: rgba(15,23,42,0.55); }
    html.light .cd-nav-lang:hover { color: #0f172a; }
    html.light .cd-nav-theme { color: rgba(15,23,42,0.55); }
    html.light .cd-nav-theme:hover { color: #0f172a; }
    .cd-nav-brand {
      display: flex; align-items: center; gap: 8px;
      text-decoration: none; color: #f8fafc; flex-shrink: 0;
    }
    .cd-nav-brand img { height: 32px; width: auto; }
    /* Pill group — matches React bundle nav */
    .cd-nav-links {
      display: flex; align-items: center; list-style: none; margin: 0; padding: 0;
      position: absolute; left: 50%; transform: translateX(-50%);
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 999px;
      padding: 4px;
      gap: 0;
    }
    .cd-nav-links li { display: flex; align-items: center; }
    /* divider between items */
    .cd-nav-links li + li::before {
      content: ''; display: block;
      width: 1px; height: 14px;
      background: rgba(255,255,255,0.12);
      flex-shrink: 0;
    }
    .cd-nav-links a {
      display: inline-flex; align-items: center;
      padding: 0.38rem 1rem;
      text-decoration: none; color: rgba(248,250,252,0.55);
      font-size: 0.72rem; font-weight: 500;
      letter-spacing: 0.08em; text-transform: uppercase;
      border-radius: 999px;
      transition: color 150ms, background 150ms;
      white-space: nowrap;
    }
    .cd-nav-links a:hover { color: #f8fafc; background: rgba(255,255,255,0.07); }
    .cd-nav-links a.cd-active { color: #f8fafc; background: rgba(255,255,255,0.08); }
    /* Dropdown */
    .cd-nav-links li { position: relative; }
    .cd-nav-links .cd-has-dropdown > a { gap: 4px; }
    .cd-nav-links .cd-has-dropdown > a::after {
      content: '';
      display: inline-block; width: 6px; height: 6px;
      border-right: 1.5px solid currentColor; border-bottom: 1.5px solid currentColor;
      transform: rotate(45deg) translateY(-2px);
      opacity: 0.6; transition: transform 150ms;
    }
    .cd-nav-links .cd-has-dropdown.cd-open > a::after { transform: rotate(-135deg) translateY(-2px); }
    .cd-dropdown {
      display: none; position: absolute; top: calc(100% + 10px); left: 50%;
      transform: translateX(-50%);
      background: rgba(20,20,20,0.75);
      backdrop-filter: blur(20px) saturate(140%);
      -webkit-backdrop-filter: blur(20px) saturate(140%);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px; padding: 6px;
      min-width: 160px; z-index: 10000;
      flex-direction: column; gap: 1px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    }
    .cd-has-dropdown.cd-open .cd-dropdown { display: flex; }
    .cd-dropdown a {
      display: block; padding: 0.45rem 0.9rem;
      border-radius: 6px; text-decoration: none;
      color: rgba(248,250,252,0.65); font-size: 0.72rem;
      font-weight: 400; letter-spacing: 0.06em; text-transform: uppercase;
      white-space: nowrap; transition: color 120ms, background 120ms;
      border-radius: 6px;
    }
    .cd-dropdown a:hover { color: #f8fafc; background: rgba(255,255,255,0.08); }
    html.light .cd-dropdown {
      background: rgba(248,250,252,0.97);
      border-color: rgba(0,0,0,0.1);
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
    }
    html.light .cd-dropdown a { color: rgba(15,23,42,0.6); }
    html.light .cd-dropdown a:hover { color: #0f172a; background: rgba(0,0,0,0.05); }
    .cd-nav-right { display: flex; align-items: center; gap: 0.25rem; }
    .cd-nav-lang {
      padding: 0.25rem 0.5rem; background: none; border: none; cursor: pointer;
      color: rgba(248,250,252,0.6); font-size: 0.65rem; font-weight: 400;
      letter-spacing: 0.15em; text-transform: uppercase;
      font-family: 'DM Sans', system-ui, sans-serif;
      transition: color 150ms;
    }
    .cd-nav-lang:hover { color: #f8fafc; }
    .cd-nav-theme {
      display: flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; background: none; border: none; cursor: pointer;
      color: rgba(248,250,252,0.6); transition: color 150ms;
      border-radius: 6px;
    }
    .cd-nav-theme:hover { color: #f8fafc; }
    .cd-nav-theme svg { width: 14px; height: 14px; }
    .cd-nav-cta {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 0.42rem 1.1rem; border-radius: 999px;
      background: #2563eb; color: #fff;
      text-decoration: none; font-size: 0.72rem; font-weight: 600;
      letter-spacing: 0.08em; text-transform: uppercase;
      transition: background 150ms; margin-left: 0.25rem;
    }
    .cd-nav-cta:hover { background: #1d4ed8; }
    @media (min-width: 1024px) {
      .cd-nav { height: 80px; }
      .cd-nav-brand img { height: 40px; }
    }
    /* ── Hamburger button (mobile only) ── */
    .cd-nav-hamburger {
      display: none;
      align-items: center; justify-content: center;
      width: 36px; height: 36px;
      background: none; border: none; cursor: pointer; padding: 0;
      border-radius: 8px; transition: background 150ms;
      color: rgba(248,250,252,0.75); font-size: 1.5rem; font-weight: 300;
      line-height: 1;
      transition: transform 250ms, color 150ms, background 150ms;
    }
    .cd-nav-hamburger:hover { background: rgba(255,255,255,0.07); color: #f8fafc; }
    .cd-nav-hamburger.open { transform: rotate(45deg); }
    html.light .cd-nav-hamburger { color: rgba(15,23,42,0.7); }
    html.light .cd-nav-hamburger:hover { color: #0f172a; }
    /* ── Mobile drawer ── */
    .cd-mobile-menu {
      display: none; position: fixed;
      top: 64px; left: 0; right: 0; bottom: 0;
      background: rgba(13,13,13,0.97);
      backdrop-filter: blur(20px) saturate(160%);
      -webkit-backdrop-filter: blur(20px) saturate(160%);
      border-top: 1px solid rgba(255,255,255,0.07);
      z-index: 9998; overflow-y: auto;
      padding: 1rem 1.25rem 2rem;
      font-family: 'DM Sans', 'Inter', system-ui, sans-serif;
      flex-direction: column;
    }
    .cd-mobile-menu.open { display: flex; }
    html.light .cd-mobile-menu {
      background: rgba(248,250,252,0.97);
      border-top-color: rgba(0,0,0,0.08);
    }
    .cd-mobile-item {
      border-bottom: 1px solid rgba(255,255,255,0.07);
    }
    html.light .cd-mobile-item { border-bottom-color: rgba(0,0,0,0.06); }
    .cd-mobile-top {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0.9rem 0.25rem;
      text-decoration: none;
      color: rgba(248,250,252,0.75);
      font-size: 0.8rem; font-weight: 500;
      letter-spacing: 0.08em; text-transform: uppercase;
      cursor: pointer; background: none; border: none; width: 100%;
      text-align: left; transition: color 150ms;
    }
    .cd-mobile-top:hover, .cd-mobile-top.open { color: #f8fafc; }
    html.light .cd-mobile-top { color: rgba(15,23,42,0.6); }
    html.light .cd-mobile-top:hover, html.light .cd-mobile-top.open { color: #0f172a; }
    .cd-mobile-chevron {
      width: 16px; height: 16px; flex-shrink: 0;
      border-right: 1.5px solid currentColor; border-bottom: 1.5px solid currentColor;
      transform: rotate(45deg); opacity: 0.5;
      transition: transform 200ms; margin-right: 2px;
    }
    .cd-mobile-top.open .cd-mobile-chevron { transform: rotate(-135deg); opacity: 0.8; }
    .cd-mobile-sub {
      display: none; flex-direction: column;
      padding: 0.25rem 0 0.75rem 0.75rem; gap: 0.1rem;
    }
    .cd-mobile-sub.open { display: flex; }
    .cd-mobile-sub a {
      padding: 0.6rem 0.75rem; border-radius: 8px;
      text-decoration: none; color: rgba(248,250,252,0.55);
      font-size: 0.78rem; letter-spacing: 0.06em; text-transform: uppercase;
      transition: color 120ms, background 120ms;
    }
    .cd-mobile-sub a:hover { color: #f8fafc; background: rgba(255,255,255,0.06); }
    html.light .cd-mobile-sub a { color: rgba(15,23,42,0.5); }
    html.light .cd-mobile-sub a:hover { color: #0f172a; background: rgba(0,0,0,0.04); }
    .cd-mobile-link {
      display: block; padding: 0.9rem 0.25rem;
      text-decoration: none; color: rgba(248,250,252,0.75);
      font-size: 0.8rem; font-weight: 500;
      letter-spacing: 0.08em; text-transform: uppercase;
      transition: color 150ms;
    }
    .cd-mobile-link:hover { color: #f8fafc; }
    html.light .cd-mobile-link { color: rgba(15,23,42,0.6); }
    html.light .cd-mobile-link:hover { color: #0f172a; }
    .cd-mobile-bottom {
      margin-top: 1.25rem; display: flex; align-items: center; gap: 0.5rem;
      padding: 0.25rem;
    }
    @media (max-width: 768px) {
      .cd-nav-links { display: none; }
      .cd-nav { padding: 0 1rem; }
      .cd-nav-hamburger { display: flex; }
    }

    /* Footer */
    .cd-shared-footer {
      font-family: 'DM Sans', system-ui, sans-serif;
      background: #0d0d0d;
      border-top: 1px solid rgba(255,255,255,0.08);
      padding: 0 clamp(1.5rem,5vw,4rem);
      color: rgba(248,250,252,0.55);
      font-size: 0.8rem;
    }
    .cd-footer-main {
      display: grid;
      grid-template-columns: 1.6fr auto 1fr 1fr;
      gap: 3rem;
      padding: 3rem 0 2.5rem;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      align-items: start;
    }
    .cd-footer-brand-col img { height: 30px; width: auto; margin-bottom: 0.9rem; display: block; }
    .cd-footer-copy {
      font-size: 0.75rem; line-height: 1.6;
      color: rgba(248,250,252,0.45); max-width: 280px;
      text-transform: uppercase; letter-spacing: 0.04em;
    }
    .cd-footer-nav-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;
      border-left: 1px solid rgba(255,255,255,0.08);
      padding-left: 3rem;
    }
    .cd-footer-nav-btn {
      display: block; padding: 0.55rem 1.1rem;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 6px; text-decoration: none;
      color: rgba(248,250,252,0.65); font-size: 0.72rem;
      font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
      text-align: center; transition: color 200ms, border-color 200ms;
      white-space: nowrap;
    }
    .cd-footer-nav-btn:hover { color: #f8fafc; border-color: rgba(255,255,255,0.3); }
    .cd-footer-col-title {
      font-size: 0.68rem; font-weight: 700; letter-spacing: 0.16em;
      text-transform: uppercase; color: #f8fafc;
      margin-bottom: 1rem; display: block;
    }
    .cd-footer-col-links { display: flex; flex-direction: column; gap: 0.55rem; }
    .cd-footer-col-links a {
      color: rgba(248,250,252,0.55); text-decoration: none;
      font-size: 0.8rem; transition: color 200ms;
    }
    .cd-footer-col-links a:hover { color: #f8fafc; }
    .cd-footer-social {
      display: flex; gap: 0.7rem; margin-top: 1rem; flex-wrap: wrap;
    }
    .cd-footer-social a {
      display: flex; align-items: center; justify-content: center;
      width: 30px; height: 30px; border-radius: 50%;
      border: 1px solid rgba(255,255,255,0.15);
      color: rgba(248,250,252,0.6); text-decoration: none;
      font-size: 0.75rem; transition: color 200ms, border-color 200ms;
    }
    .cd-footer-social a:hover { color: #f8fafc; border-color: rgba(255,255,255,0.4); }
    .cd-footer-bottom {
      display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: 0.75rem; padding: 1.25rem 0;
      font-size: 0.72rem; color: rgba(248,250,252,0.35);
    }
    .cd-footer-legal { display: flex; gap: 1.5rem; flex-wrap: wrap; }
    .cd-footer-legal a {
      color: rgba(248,250,252,0.35); text-decoration: none; transition: color 200ms;
    }
    .cd-footer-legal a:hover { color: rgba(248,250,252,0.7); }
    @media (max-width: 860px) {
      .cd-footer-main { grid-template-columns: 1fr 1fr; }
      .cd-footer-nav-grid { border-left: none; padding-left: 0; }
    }
    @media (max-width: 500px) {
      .cd-footer-main { grid-template-columns: 1fr; }
    }
  `;
  document.head.appendChild(style);

  /* ── Detectar página activa ── */
  const path = window.location.pathname;
  function isActive(href) {
    if (href === './index.html') return path === '/' || path.endsWith('index.html');
    if (href === './historia.html') return path.endsWith('historia.html');
    return false;
  }

  const NAV_LINKS = [
    { label: 'Impacto',    href: './index.html#impacto',    children: [
        { label: 'Ciudades',       en: 'Cities',        href: './index.html#ciudades'       },
        { label: 'Infraestructura',en: 'Infrastructure',href: './index.html#infraestructura'},
        { label: 'Minería',        en: 'Mining',        href: './index.html#minas'          },
        { label: 'Instituciones',  en: 'Institutions',  href: './index.html#instituciones'  },
      ]},
    { label: 'Tecnología', href: './index.html#tecnologia', children: [
        { label: 'Procesos',    en: 'Processes',   href: './index.html#procesos'    },
        { label: 'Cartográfica',en: 'Cartographic',href: './cartografica.html'},
        { label: 'GeoSoftware', en: 'GeoSoftware', href: './geosoftware.html' },
      ]},
    { label: 'Cultura',    href: './index.html#cultura',    children: [
        { label: 'Historia', en: 'History', href: './historia.html'        },
        { label: 'Equipo',   en: 'Team',    href: './equipo.html'          },
      ]},
    { label: 'Noticias',   href: './index.html#noticias'    },
    { label: 'X-Ray',      href: './index.html#xray'        },
  ];

  /* ── Estado: idioma y tema ── */
  let lang  = localStorage.getItem('cartodata-lang') || 'es';
  let theme = localStorage.getItem('theme') || 'dark';

  function applyTheme(t) {
    theme = t;
    localStorage.setItem('theme', t);
    document.documentElement.classList.toggle('light', t === 'light');
    document.documentElement.classList.toggle('dark',  t === 'dark');
    const btn = document.getElementById('cd-theme-btn');
    if (btn) btn.innerHTML = t === 'dark' ? SVG_SUN : SVG_MOON;
    const logo = document.getElementById('cd-nav-logo');
    if (logo) logo.src = t === 'dark'
      ? './manus-storage/logo-white-h-proper_641226e9.png'
      : './manus-storage/logo-black-h-proper_e8a1da9d.png';
  }

  function applyLang(l) {
    lang = l;
    localStorage.setItem('cartodata-lang', l);
    document.documentElement.lang = l;
    const btn = document.getElementById('cd-lang-btn');
    if (btn) btn.textContent = l === 'es' ? 'EN' : 'ES';
    /* Actualizar texto de links del nav según idioma */
    updateNavLabels();
  }

  function updateNavLabels() {
    NAV_LINKS.forEach((item, i) => {
      const li = document.querySelector(`.cd-nav-links li:nth-child(${i + 1})`);
      if (!li) return;
      const topA = li.querySelector(':scope > a');
      if (topA) topA.firstChild.textContent = (lang === 'en' && item.en) ? item.en : item.label;
      if (item.children) {
        item.children.forEach((child, j) => {
          const childA = li.querySelectorAll('.cd-dropdown a')[j];
          if (childA) childA.textContent = (lang === 'en' && child.en) ? child.en : child.label;
        });
      }
    });
  }

  const NAV_LABELS_EN = { 'Impacto':'Impact','Tecnología':'Technology','Cultura':'Culture','Noticias':'News' };

  const SVG_SUN  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>`;
  const SVG_MOON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

  /* ── Inyectar Nav (inmediato) ── */
  const nav = document.createElement('nav');
  nav.className = 'cd-nav';
  nav.innerHTML = `
    <a href="./index.html" class="cd-nav-brand">
      <img id="cd-nav-logo" src="./manus-storage/logo-white-h-proper_641226e9.png" alt="CartoData" />
    </a>
    <ul class="cd-nav-links">
      ${NAV_LINKS.map(l => `
        <li class="${l.children ? 'cd-has-dropdown' : ''}">
          <a href="${l.href}" ${isActive(l.href) ? 'class="cd-active"' : ''}>${l.label}</a>
          ${l.children ? `
          <div class="cd-dropdown">
            ${l.children.map(c => `<a href="${c.href}">${c.label}</a>`).join('')}
          </div>` : ''}
        </li>
      `).join('')}
    </ul>
    <div class="cd-nav-right">
      <button id="cd-lang-btn" class="cd-nav-lang" aria-label="Cambiar idioma">
        ${lang === 'es' ? 'EN' : 'ES'}
      </button>
      <button id="cd-theme-btn" class="cd-nav-theme" aria-label="Cambiar tema">
        ${theme === 'dark' ? SVG_SUN : SVG_MOON}
      </button>
      <button id="cd-hamburger" class="cd-nav-hamburger" aria-label="Menú" aria-expanded="false">+</button>
    </div>`;
  document.body.insertBefore(nav, document.body.firstChild);

  /* ── Mobile menu ── */
  const mobileMenu = document.createElement('div');
  mobileMenu.className = 'cd-mobile-menu';
  mobileMenu.id = 'cd-mobile-menu';
  mobileMenu.innerHTML = NAV_LINKS.map(l => {
    if (l.children) {
      return `<div class="cd-mobile-item">
        <button class="cd-mobile-top" data-target="cd-sub-${l.label.replace(/\s/g,'')}">
          ${l.label}
          <span class="cd-mobile-chevron"></span>
        </button>
        <div class="cd-mobile-sub" id="cd-sub-${l.label.replace(/\s/g,'')}">
          ${l.children.map(c => `<a href="${c.href}">${c.label}</a>`).join('')}
        </div>
      </div>`;
    }
    return `<div class="cd-mobile-item"><a href="${l.href}" class="cd-mobile-link">${l.label}</a></div>`;
  }).join('');
  document.body.insertBefore(mobileMenu, nav.nextSibling);

  /* Aplicar tema inicial */
  applyTheme(theme);

  /* Event listeners — lang / theme */
  document.getElementById('cd-lang-btn').addEventListener('click', () => {
    applyLang(lang === 'es' ? 'en' : 'es');
  });
  document.getElementById('cd-theme-btn').addEventListener('click', () => {
    applyTheme(theme === 'dark' ? 'light' : 'dark');
  });

  /* ── Hamburger / mobile menu logic ── */
  const hamburger = document.getElementById('cd-hamburger');
  function toggleMobileMenu(force) {
    const open = force !== undefined ? force : !mobileMenu.classList.contains('open');
    mobileMenu.classList.toggle('open', open);
    hamburger.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  hamburger.addEventListener('click', () => toggleMobileMenu());

  /* Mobile sub-accordion */
  mobileMenu.querySelectorAll('.cd-mobile-top').forEach(btn => {
    btn.addEventListener('click', () => {
      const sub = document.getElementById(btn.dataset.target);
      const isOpen = sub.classList.contains('open');
      mobileMenu.querySelectorAll('.cd-mobile-sub').forEach(s => s.classList.remove('open'));
      mobileMenu.querySelectorAll('.cd-mobile-top').forEach(b => b.classList.remove('open'));
      if (!isOpen) { sub.classList.add('open'); btn.classList.add('open'); }
    });
  });

  /* Close mobile menu on link click */
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => toggleMobileMenu(false));
  });


  /* Dropdowns — toggle al click, cerrar al hacer click fuera */
  nav.querySelectorAll('.cd-has-dropdown > a').forEach(a => {
    a.addEventListener('click', e => {
      const li = a.parentElement;
      const isOpen = li.classList.contains('cd-open');
      nav.querySelectorAll('.cd-has-dropdown').forEach(el => el.classList.remove('cd-open'));
      if (!isOpen) { li.classList.add('cd-open'); e.preventDefault(); }
    });
  });
  document.addEventListener('click', e => {
    if (!nav.contains(e.target)) {
      nav.querySelectorAll('.cd-has-dropdown').forEach(el => el.classList.remove('cd-open'));
    }
  });

  /* ── Inyectar Footer (al final del DOM) ── */
  function injectFooter() {
  const footer = document.createElement('footer');
  footer.className = 'cd-shared-footer';
  footer.innerHTML = `
    <div class="cd-footer-main">
      <!-- Marca -->
      <div class="cd-footer-brand-col">
        <img src="./manus-storage/logo-white-h-proper_641226e9.png" alt="CartoData" />
        <p class="cd-footer-copy">© 2026 CartoData — Dando contexto geográfico a tu decisión</p>
      </div>

      <!-- Nav grid (estilo index) -->
      <div class="cd-footer-nav-grid">
        <a href="./index.html#impacto"        class="cd-footer-nav-btn">Impacto</a>
        <a href="./index.html#tecnologia"     class="cd-footer-nav-btn">Tecnología</a>
        <a href="./index.html#cultura"        class="cd-footer-nav-btn">Cultura</a>
        <a href="./historia.html"             class="cd-footer-nav-btn">Historia</a>
      </div>

      <!-- Contacto -->
      <div>
        <span class="cd-footer-col-title">Contacto</span>
        <div class="cd-footer-col-links">
          <a href="tel:+523336271552">+52 333 627 1552</a>
          <a href="mailto:info@cartodata.com">info@cartodata.com</a>
          <a href="https://wa.me/523336271552" target="_blank" rel="noreferrer">WhatsApp</a>
        </div>
        <div class="cd-footer-social">
          <a href="#" aria-label="YouTube">&#9654;</a>
          <a href="#" aria-label="LinkedIn">in</a>
          <a href="#" aria-label="Facebook">f</a>
          <a href="#" aria-label="Instagram">ig</a>
          <a href="#" aria-label="X">✕</a>
          <a href="https://wa.me/523336271552" aria-label="WhatsApp" target="_blank" rel="noreferrer">wa</a>
        </div>
      </div>

      <!-- Info -->
      <div>
        <span class="cd-footer-col-title">Info</span>
        <div class="cd-footer-col-links">
          <a href="#">Ubicaciones</a>
          <a href="#">Kit de prensa</a>
          <a href="./index.html#aviso-privacidad">Aviso de privacidad</a>
          <a href="./index.html#terminos">Términos y condiciones</a>
        </div>
      </div>
    </div>

    <div class="cd-footer-bottom">
      <span>© 2026 CartoData S. de R.L. de C.V. Todos los derechos reservados.</span>
      <div class="cd-footer-legal">
        <a href="./index.html#aviso-privacidad">Aviso de privacidad</a>
        <a href="./index.html#terminos">Términos y condiciones</a>
      </div>
    </div>`;
  document.body.appendChild(footer);
  }

  function initModals() {
    /* ── Modal Aviso de Privacidad ── */
    if (!document.getElementById('cd-privacy-backdrop')) {
      document.body.insertAdjacentHTML('beforeend', `
        <style>
          #cd-privacy-backdrop {
            display:none;position:fixed;inset:0;z-index:99999;
            background:rgba(13,13,13,0.75);backdrop-filter:blur(6px);
            -webkit-backdrop-filter:blur(6px);
            align-items:center;justify-content:center;padding:1.5rem;
          }
          #cd-privacy-backdrop.open{display:flex;}
          #cd-privacy-modal {
            background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;
            width:100%;max-width:780px;max-height:88vh;
            display:flex;flex-direction:column;
            box-shadow:0 32px 80px rgba(0,0,0,0.45);
            font-family:'DM Sans',system-ui,sans-serif;color:#0f172a;overflow:hidden;
          }
          #cd-privacy-header {
            display:flex;justify-content:space-between;align-items:flex-start;
            padding:2rem 2rem 1.2rem;border-bottom:1px solid #e2e8f0;
            flex-shrink:0;background:#ffffff;
          }
          #cd-privacy-header h2{font-size:1.15rem;font-weight:600;margin:0 0 0.2rem;color:#0f172a;}
          #cd-privacy-header p{font-size:0.78rem;font-weight:400;margin:0;color:#64748b;}
          #cd-privacy-close {
            width:36px;height:36px;border-radius:50%;border:1px solid #e2e8f0;
            background:#ffffff;cursor:pointer;display:grid;place-items:center;
            flex-shrink:0;margin-left:1rem;color:#64748b;transition:background 180ms,color 180ms;
          }
          #cd-privacy-close:hover{background:#f1f5f9;color:#0f172a;}
          #cd-privacy-body {
            overflow-y:auto;padding:1.8rem 2rem 2rem;background:#ffffff;
            font-size:0.84rem;font-weight:300;line-height:1.8;color:#475569;scrollbar-width:thin;
          }
          #cd-privacy-body h3 {
            font-size:0.72rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;
            color:#0f172a;margin:1.8rem 0 0.6rem;padding-top:1.2rem;border-top:1px solid #e2e8f0;
          }
          #cd-privacy-body h3:first-child{margin-top:0;padding-top:0;border-top:none;}
          #cd-privacy-body p{margin:0 0 0.9rem;}
          #cd-privacy-body ul{margin:0.4rem 0 0.9rem 1.2rem;padding:0;}
          #cd-privacy-body li{margin-bottom:0.4rem;}
          #cd-privacy-body a{color:#3b5bdb;text-decoration:none;}
          #cd-privacy-body a:hover{text-decoration:underline;}
          #cd-privacy-body strong{color:#0f172a;font-weight:500;}
        </style>
        <div id="cd-privacy-backdrop">
          <div id="cd-privacy-modal" role="dialog" aria-modal="true" aria-labelledby="cd-privacy-title">
            <div id="cd-privacy-header">
              <div>
                <h2 id="cd-privacy-title">Aviso de Privacidad</h2>
                <p>CartoData 2.0 SC</p>
              </div>
              <button id="cd-privacy-close" aria-label="Cerrar">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <line x1="1" y1="1" x2="13" y2="13"/><line x1="13" y1="1" x2="1" y2="13"/>
                </svg>
              </button>
            </div>
            <div id="cd-privacy-body">
              <p>CartoData 2.0 SC., con domicilio en Circunvalación Oriente número 689, Colonia Ciudad Granja, Código Postal 45010, en la ciudad de Zapopan, Jalisco, México, (en adelante "CartoData"), con fundamento en los artículos 15 y 16 de la Ley Federal de Protección de Datos Personales en Posesión de Particulares, reconoce la importancia que tiene el tratamiento legítimo, controlado e informado de sus datos personales, por lo tanto, la información de nuestros clientes y clientes potenciales es tratada de forma estrictamente confidencial, por lo que hacemos un esfuerzo permanente para salvaguardarla.</p>
              <h3>Finalidad</h3>
              <p>Su información personal será utilizada exclusivamente para prestarle los servicios solicitados (Fotogrametría, Geodesia, Cartografía, levantamiento de censos, topografía, mapas, planos y bases de datos, teledetección, mapeo terrestre, desarrollo de software, geoprocesamiento), dar cumplimiento a requerimientos legales, llevar a cabo facturación y cobro, formalizar contratos, mantener actualizados nuestros registros e invitarle a eventos y comunicaciones relacionadas con nuestros servicios.</p>
              <h3>Datos Personales Tratados</h3>
              <p><strong>Datos necesarios:</strong> Nombre completo, domicilio, fecha de nacimiento, CURP, teléfono, correo electrónico, domicilio fiscal, RFC, datos de facturación, información de cuentas bancarias, actividad económica, polígonos de áreas de interés.</p>
              <p><strong>Datos no necesarios:</strong> Cuentas de redes sociales.</p>
              <h3>Transferencia de Datos</h3>
              <p>CartoData no transferirá sin su consentimiento previo sus datos personales a personas ajenas a nuestra empresa, salvo por disposición de la Ley.</p>
              <h3>Medidas de Seguridad</h3>
              <p>CartoData ha adoptado medidas de seguridad administrativas, físicas y técnicas para proteger sus datos personales contra daño, pérdida, alteración, destrucción o uso no autorizado.</p>
              <h3>Derechos ARCO</h3>
              <p>Como titular de datos personales, puede ejercitar los derechos de <strong>Acceso, Rectificación, Cancelación y Oposición</strong> enviando su solicitud a <a href="mailto:privacidad@cartodata.com">privacidad@cartodata.com</a>. La respuesta se emitirá en un plazo no mayor a <strong>15 días hábiles</strong>.</p>
              <h3>Cambios al Aviso</h3>
              <p>Este aviso podrá ser modificado. Las modificaciones serán informadas a través de <a href="https://www.cartodata.com/privacidad" target="_blank">www.cartodata.com/privacidad</a>.</p>
              <h3>Contacto</h3>
              <p><a href="mailto:privacidad@cartodata.com">privacidad@cartodata.com</a><br>
              Circunvalación Oriente 689, Col. Ciudad Granja, C.P. 45010, Zapopan, Jalisco, México.</p>
            </div>
          </div>
        </div>`);

      const privBackdrop = document.getElementById('cd-privacy-backdrop');
      const privClose    = document.getElementById('cd-privacy-close');
      const openPrivacy  = e => { if(e) e.preventDefault(); privBackdrop.classList.add('open'); document.body.style.overflow='hidden'; };
      const closePrivacy = () => { privBackdrop.classList.remove('open'); document.body.style.overflow=''; };
      privClose.addEventListener('click', closePrivacy);
      privBackdrop.addEventListener('click', e => { if(e.target===privBackdrop) closePrivacy(); });
      document.addEventListener('keydown', e => { if(e.key==='Escape') closePrivacy(); });
      window.openPrivacyModal = openPrivacy;

      function hookPrivacyLinks() {
        document.querySelectorAll('a[href="#aviso-privacidad"],a[href*="privaci"]').forEach(l => {
          if (!l.dataset.cdPrivHooked) { l.dataset.cdPrivHooked='1'; l.addEventListener('click', openPrivacy); }
        });
      }
      hookPrivacyLinks();
      const privObs = new MutationObserver(hookPrivacyLinks);
      privObs.observe(document.body, { childList:true, subtree:true });
      setTimeout(() => { hookPrivacyLinks(); privObs.disconnect(); }, 5000);
    }

    /* ── Modal Términos y Condiciones ── */
    if (!document.getElementById('cd-terms-backdrop')) {
      document.body.insertAdjacentHTML('beforeend', `
        <style>
          #cd-terms-backdrop {
            display:none;position:fixed;inset:0;z-index:99999;
            background:rgba(13,13,13,0.75);backdrop-filter:blur(4px);
            align-items:center;justify-content:center;padding:1.5rem;
          }
          #cd-terms-backdrop.open{display:flex;}
          #cd-terms-modal {
            background:#ffffff;color:#0f172a;border:1px solid #e2e8f0;border-radius:16px;
            width:100%;max-width:680px;max-height:85vh;display:flex;flex-direction:column;
            box-shadow:0 24px 80px rgba(0,0,0,0.35);font-family:'DM Sans',system-ui,sans-serif;
          }
          #cd-terms-header {
            padding:1.6rem 2rem 1.2rem;border-bottom:1px solid #e2e8f0;
            display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;
          }
          #cd-terms-header h2{font-size:1.25rem;font-weight:600;margin:0;color:#0f172a;}
          #cd-terms-header p{font-size:0.78rem;color:#64748b;margin:0.25rem 0 0;}
          #cd-terms-close {
            flex-shrink:0;background:none;border:1px solid #e2e8f0;border-radius:8px;
            padding:0.4rem 0.75rem;cursor:pointer;font-size:0.8rem;color:#64748b;line-height:1;
          }
          #cd-terms-close:hover{background:#f1f5f9;color:#0f172a;}
          #cd-terms-body{padding:1.6rem 2rem;overflow-y:auto;font-size:0.875rem;line-height:1.7;color:#374151;}
          #cd-terms-body h3{font-size:0.95rem;font-weight:600;color:#0f172a;margin:1.4rem 0 0.5rem;padding-top:1.2rem;border-top:1px solid #f1f5f9;}
          #cd-terms-body h3:first-child{margin-top:0;padding-top:0;border-top:none;}
          #cd-terms-body p{margin:0 0 0.9rem;}
          #cd-terms-body ul{margin:0.4rem 0 0.9rem 1.2rem;padding:0;}
          #cd-terms-body li{margin-bottom:0.4rem;}
          #cd-terms-body a{color:#3b5bdb;text-decoration:none;}
          #cd-terms-body a:hover{text-decoration:underline;}
          #cd-terms-body strong{color:#0f172a;font-weight:500;}
        </style>
        <div id="cd-terms-backdrop">
          <div id="cd-terms-modal" role="dialog" aria-modal="true" aria-labelledby="cd-terms-title">
            <div id="cd-terms-header">
              <div>
                <h2 id="cd-terms-title">Términos y Condiciones</h2>
                <p>Última actualización: junio 2025 · CartoData S. de R.L. de C.V.</p>
              </div>
              <button id="cd-terms-close" aria-label="Cerrar">Cerrar ✕</button>
            </div>
            <div id="cd-terms-body">
              <h3>1. Aceptación de los Términos</h3>
              <p>Al acceder y utilizar el sitio web <strong>www.cartodata.mx</strong> y los servicios de <strong>CartoData S. de R.L. de C.V.</strong>, usted acepta quedar vinculado por los presentes Términos y Condiciones.</p>
              <h3>2. Descripción de los Servicios</h3>
              <p>CartoData ofrece soluciones geoespaciales que incluyen: cartografía digital y análisis territorial, procesamiento de datos GIS, consultoría en planeación urbana e infraestructura, estudios de impacto ambiental y desarrollo de plataformas de visualización geográfica.</p>
              <h3>3. Propiedad Intelectual</h3>
              <p>Todo el contenido publicado —incluyendo textos, gráficas, mapas, metodologías, logotipos y software— es propiedad exclusiva de CartoData o de sus licenciantes, protegido por las leyes mexicanas e internacionales de propiedad intelectual. Queda prohibida la reproducción o distribución sin autorización previa y por escrito.</p>
              <h3>4. Uso Permitido</h3>
              <p>El usuario se compromete a utilizar el sitio y los servicios únicamente con fines lícitos. Queda prohibido usarlo para fines fraudulentos, intentar acceso no autorizado a sistemas de CartoData, reproducir o revender los servicios sin autorización, o transmitir virus o código dañino.</p>
              <h3>5. Confidencialidad</h3>
              <p>La información técnica, metodológica o estratégica compartida durante la prestación de servicios tendrá carácter confidencial. Ambas partes se obligan a no divulgarla a terceros sin consentimiento previo y por escrito.</p>
              <h3>6. Limitación de Responsabilidad</h3>
              <p>CartoData no será responsable de daños directos, indirectos, incidentales o consecuentes derivados del uso o la imposibilidad de uso del sitio o de los servicios. La responsabilidad máxima se limitará al monto total pagado por el servicio específico que originó el reclamo.</p>
              <h3>7. Protección de Datos Personales</h3>
              <p>El tratamiento de los datos personales se rige por nuestro <strong>Aviso de Privacidad</strong>, disponible en el pie de página. CartoData cumple con la <em>Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)</em>.</p>
              <h3>8. Modificaciones</h3>
              <p>CartoData se reserva el derecho de actualizar estos Términos en cualquier momento. El uso continuado de los servicios constituye aceptación de las modificaciones.</p>
              <h3>9. Jurisdicción y Ley Aplicable</h3>
              <p>Estos términos se rigen por las leyes de los <strong>Estados Unidos Mexicanos</strong>. Para cualquier controversia, las partes se someten a la jurisdicción de los tribunales de <strong>Guadalajara, Jalisco</strong>.</p>
              <h3>10. Contacto</h3>
              <p>Para dudas, escríbanos a <a href="mailto:contacto@cartodata.mx">contacto@cartodata.mx</a>.</p>
            </div>
          </div>
        </div>`);

      const termsBackdrop = document.getElementById('cd-terms-backdrop');
      const termsClose    = document.getElementById('cd-terms-close');
      const openTerms     = e => { if(e) e.preventDefault(); termsBackdrop.classList.add('open'); document.body.style.overflow='hidden'; };
      const closeTerms    = () => { termsBackdrop.classList.remove('open'); document.body.style.overflow=''; };
      termsClose.addEventListener('click', closeTerms);
      termsBackdrop.addEventListener('click', e => { if(e.target===termsBackdrop) closeTerms(); });
      document.addEventListener('keydown', e => { if(e.key==='Escape') closeTerms(); });
      window.openTermsModal = openTerms;

      function hookTermsLinks() {
        document.querySelectorAll('a[href*="terminos"],a[href*="términos"],a[href*="terms"]').forEach(l => {
          if (!l.dataset.cdTermsHooked) { l.dataset.cdTermsHooked='1'; l.addEventListener('click', openTerms); }
        });
      }
      hookTermsLinks();
      const termsObs = new MutationObserver(hookTermsLinks);
      termsObs.observe(document.body, { childList:true, subtree:true });
      setTimeout(() => { hookTermsLinks(); termsObs.disconnect(); }, 5000);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { injectFooter(); initModals(); });
  } else {
    injectFooter();
    initModals();
  }

})();
