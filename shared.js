/* shared.js — Nav, Footer y CSS base compartidos para todas las páginas de CartoData */
(function () {
  /* ── Google Tag Manager (GTM) ──
     Contenedor de tracking que gestiona múltiples tags.
     Se inyecta aquí para cubrir todas las páginas estáticas.
     El home (index.html) lleva el snippet en su propio <head>.
     El guard evita doble carga. ── */
  if (!document.querySelector('script[src*="googletagmanager.com/gtm.js"]')) {
    window.dataLayer = window.dataLayer || [];
    const gtmScript = document.createElement('script');
    gtmScript.async = true;
    gtmScript.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-MX296BJV';
    document.head.appendChild(gtmScript);

    // Noscript fallback
    const noscript = document.createElement('noscript');
    noscript.innerHTML = '<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-MX296BJV" height="0" width="0" style="display:none;visibility:hidden"></iframe>';
    document.body.insertBefore(noscript, document.body.firstChild);
  }

  /* ── Google Analytics 4 (gtag.js) ──
     Se inyecta aquí para cubrir todas las páginas estáticas de una sola vez.
     El home (index.html) NO carga shared.js: lleva el snippet en su propio <head>.
     El guard evita doble carga (y por tanto doble page_view). ── */
  const GA_ID = 'G-50RR7V0FYB';
  if (!document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
    const ga = document.createElement('script');
    ga.async = true;
    ga.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(ga);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
  }

  /* ── Seguimiento de mapas embedidos (CartoData maps) ──
     Rastrea carga, visibilidad y tiempo de interacción con iframes que tengan data-map-name. ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackMaps);
  } else {
    trackMaps();
  }

  function trackMaps() {
    const mapFrames = document.querySelectorAll('[data-map-name]');
    if (mapFrames.length === 0) return;

    mapFrames.forEach(mapFrame => {
      const mapData = {
        map_name: mapFrame.dataset.mapName || 'Visualizador CartoData',
        map_url: mapFrame.src,
        page_location: window.location.href
      };

      // Evento: mapa cargado
      mapFrame.addEventListener('load', () => {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: 'map_loaded',
          ...mapData
        });
      });

      let mapViewed = false;
      let timeEventSent = false;
      let visibilityTimer = null;

      // Usar IntersectionObserver para detectar visibilidad
      const observer = new IntersectionObserver((entries) => {
        const isVisible = entries[0].isIntersecting;

        // Evento: mapa visto (entra en viewport)
        if (isVisible && !mapViewed) {
          mapViewed = true;
          window.dataLayer.push({
            event: 'map_view',
            ...mapData
          });
        }

        // Evento: mapa visible 30 segundos
        if (isVisible && !timeEventSent && !visibilityTimer) {
          visibilityTimer = setTimeout(() => {
            timeEventSent = true;
            window.dataLayer.push({
              event: 'map_time_30s',
              visible_seconds: 30,
              ...mapData
            });
          }, 30000);
        }

        // Limpiar timer si el mapa sale del viewport
        if (!isVisible && visibilityTimer) {
          clearTimeout(visibilityTimer);
          visibilityTimer = null;
        }
      }, { threshold: 0.5 });

      observer.observe(mapFrame);
    });
  }

  /* ── Inyectar site.css (design system) si no está ya cargado ── */
  if (!document.querySelector('link[href*="site.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './site.css';
    document.head.prepend(link);
  }

  /* ── Cargar DM Sans (misma fuente que el home) si no está ya ── */
  if (!document.querySelector('link[href*="fonts.googleapis.com/css2?family=DM+Sans"]')) {
    const pre1 = document.createElement('link');
    pre1.rel = 'preconnect'; pre1.href = 'https://fonts.googleapis.com';
    const pre2 = document.createElement('link');
    pre2.rel = 'preconnect'; pre2.href = 'https://fonts.gstatic.com'; pre2.crossOrigin = '';
    const font = document.createElement('link');
    font.rel = 'stylesheet';
    font.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap';
    document.head.prepend(font);
    document.head.prepend(pre2);
    document.head.prepend(pre1);
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
    .cd-nav-links a.cd-nav-xray { color: #ffffff; font-weight: 700; }
    .cd-nav-links a.cd-nav-xray:hover { color: #ffffff; }
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

    /* Footer — réplica exacta del home (Footer.tsx) */
    .cd-shared-footer {
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
      background: transparent;
      padding: clamp(2rem,5vw,2.5rem) clamp(1rem,4vw,1.5rem);
    }
    /* Modo claro: colores de texto del footer (#737373 muted, #1e1e1c texto) */
    html.light .cd-footer-copy,
    html.light .cd-footer-nav-btn,
    html.light .cd-footer-col-links a { color: #737373; }
    html.light .cd-footer-col-title,
    html.light .cd-footer-nav-btn:hover,
    html.light .cd-footer-col-links a:hover { color: #1e1e1c; }
    .cd-footer-main {
      display: grid;
      grid-template-columns: 1.2fr 1fr 1fr 1fr;
      gap: 0;
      padding: clamp(1.5rem,4vw,2rem);
      border: 1px solid #3a3a3a;
      border-radius: 12px;
      align-items: stretch;
    }
    html.light .cd-footer-main { border-color: #d4d4d4; }
    .cd-footer-copy-col { display: flex; align-items: center; padding-right: 2rem; }
    .cd-footer-copy {
      font-size: 12px; line-height: 1.6; font-weight: 300;
      letter-spacing: 0.05em; text-transform: uppercase;
      color: #a3a3a3;
    }
    /* columnas 2-4 con separador izquierdo */
    .cd-footer-col {
      border-left: 1px solid #3a3a3a; padding: 0 2rem;
      display: flex; flex-direction: column; justify-content: center;
    }
    html.light .cd-footer-col { border-left-color: #d4d4d4; }
    .cd-footer-nav-col { justify-content: center; }
    .cd-footer-nav-wrap { position: relative; }
    .cd-footer-nav-grid { display: grid; grid-template-columns: 1fr 1fr; }
    .cd-footer-nav-btn {
      border: 1px solid #3a3a3a; padding: 0.75rem 1rem;
      font-size: 12px; font-weight: 300; letter-spacing: 0.05em;
      text-transform: uppercase; text-align: center; text-decoration: none;
      color: #a3a3a3; transition: color 200ms; white-space: nowrap;
    }
    html.light .cd-footer-nav-btn { border-color: #d4d4d4; }
    .cd-footer-nav-btn:nth-child(2) { margin-left: -1px; }
    .cd-footer-nav-btn:nth-child(3) { margin-top: -1px; }
    .cd-footer-nav-btn:nth-child(4) { margin-left: -1px; margin-top: -1px; }
    .cd-footer-nav-btn:hover { color: #fafafa; }
    .cd-footer-diamond {
      position: absolute; top: 50%; left: 50%;
      transform: translate(-50%,-50%); line-height: 0;
      color: #3a3a3a; background: #050816; /* JS lo sincroniza al fondo real de la página */
    }
    html.light .cd-footer-diamond { color: #d4d4d4; background: #f8fafc; }
    .cd-footer-col-title {
      font-size: 12px; font-weight: 300; letter-spacing: 0.05em;
      text-transform: uppercase; color: #fafafa;
      margin-bottom: 1rem; display: block;
    }
    .cd-footer-col-links { display: flex; flex-direction: column; gap: 0.5rem; }
    .cd-footer-col-links a {
      color: #a3a3a3; text-decoration: none;
      font-size: 12px; font-weight: 300; transition: color 200ms;
    }
    .cd-footer-col-links a:hover { color: #fafafa; }
    .cd-footer-social { display: flex; align-items: center; gap: 0.75rem; margin-top: 1rem; }
    .cd-footer-social a { display: flex; color: #fafafa; transition: opacity 200ms; }
    html.light .cd-footer-social a { color: #1E1E1C; }
    .cd-footer-social a:hover { opacity: 0.6; }
    .cd-footer-social svg { width: 16px; height: 16px; display: block; fill: currentColor; }
    /* Google Cloud Partner Badge */
    .cd-footer-partners {
      display: flex; align-items: center; justify-content: center; gap: 0;
      padding: 2.5rem clamp(1rem,4vw,1.5rem);
      border-top: 1px solid rgba(255,255,255,0.08);
      margin-top: 2rem;
    }
    html.light .cd-footer-partners { border-top-color: rgba(0,0,0,0.08); }
    .cd-partner-link {
      display: inline-flex; align-items: center; justify-content: center;
      text-decoration: none; transition: all 320ms cubic-bezier(0.34, 1.56, 0.64, 1);
      position: relative; width: 100px; height: 100px;
    }
    .cd-partner-img-logo {
      position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: center;
      opacity: 1; transition: opacity 320ms ease;
    }
    .cd-partner-img-badge {
      position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity 320ms ease;
    }
    .cd-partner-link:hover .cd-partner-img-logo { opacity: 0; }
    .cd-partner-link:hover .cd-partner-img-badge { opacity: 1; }
    .cd-partner-link img {
      height: 80px; width: auto; display: block; max-width: 100%;
    }
    @media (max-width: 860px) {
      .cd-footer-main { grid-template-columns: 1fr; gap: 2rem; }
      .cd-footer-copy-col { padding-right: 0; }
      .cd-footer-col { border-left: none; padding: 0; }
      .cd-footer-partners { padding: 1.5rem clamp(1rem,4vw,1.5rem) 0; }
    }
  `;
  document.head.appendChild(style);

  /* ── Detectar página activa ── */
  const path = window.location.pathname;
  function isActive(href) {
    if (href === './') return path === '/' || path.endsWith('index.html');
    if (href === './historia.html') return path.endsWith('historia.html');
    return false;
  }

  const NAV_LINKS = [
    { label: 'Impacto',    href: '/#impacto',    children: [
        { label: 'Ciudades',       en: 'Cities',        href: '/ciudades.html'             },
        { label: 'Construcción', en: 'Construction', href: '/construccion.html'       },
        { label: 'Infraestructura', en: 'Infrastructure', href: '/infraestructura.html'    },
        { label: 'Minería',        en: 'Mining',        href: '/mineria.html'              },
        { label: 'Parques Urbanos', en: 'Urban Parks', href: '/parques-urbanos.html'  },
        // Oculto temporalmente: la página de Instituciones se rehará. Restaurar cuando esté lista.
        // { label: 'Instituciones',  en: 'Institutions',  href: '/instituciones.html'        },
      ]},
    { label: 'Tecnología', href: '/#tecnologia', children: [
        { label: 'Procesos',    en: 'Processes',   href: '/procesos.html'          },
        { label: 'Datos',       en: 'Data',        href: '/cartografica.html'},
        { label: 'GeoSoftware', en: 'GeoSoftware', href: '/geosoftware.html' },
      ]},
    { label: 'Cultura',    href: '/#cultura',    children: [
        { label: 'Historia', en: 'History', href: '/historia.html'        },
        { label: 'Equipo',   en: 'Team',    href: '/equipo.html'          },
      ]},
    { label: 'Noticias',   href: '/#noticias'    },
    { label: 'X-Ray',      href: '/xray.html'              },
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
      ? './images/logo-white-h.png'
      : './images/logo-black-h.png';
  }

  function applyLang(l) {
    lang = l;
    localStorage.setItem('cartodata-lang', l);
    document.documentElement.lang = l;
    const btn = document.getElementById('cd-lang-btn');
    if (btn) btn.textContent = l === 'es' ? 'EN' : 'ES';
    /* Actualizar texto de links del nav según idioma */
    updateNavLabels();
    /* Traducir el contenido de la página */
    applyI18n();
  }

  /* ── Traducción del contenido de la página ──
     Cualquier elemento con atributo data-en se traduce al conmutar el idioma.
     El español original (innerHTML) se guarda en memoria la primera vez, así que
     el atributo solo necesita llevar el inglés. Admite HTML dentro (p. ej. <strong>).

     Uso en las páginas:
        <h2 data-en="Modern cadastre for <strong>growing cities</strong>">
          Catastro moderno para <strong>municipios que crecen</strong>
        </h2>

     Los textos SIN data-en simplemente no se traducen (degradación limpia). ── */
  const I18N_ORIG = new WeakMap();
  function applyI18n() {
    document.querySelectorAll('[data-en]').forEach(el => {
      if (!I18N_ORIG.has(el)) I18N_ORIG.set(el, el.innerHTML);
      const en = el.getAttribute('data-en');
      el.innerHTML = (lang === 'en' && en) ? en : I18N_ORIG.get(el);
    });
    /* Atributos traducibles: data-en-alt, data-en-placeholder, data-en-title,
       data-en-aria (→ aria-label). El original se guarda por atributo. */
    [['alt','data-en-alt'], ['placeholder','data-en-placeholder'],
     ['title','data-en-title'], ['aria-label','data-en-aria']].forEach(([attr, dataAttr]) => {
      document.querySelectorAll('[' + dataAttr + ']').forEach(el => {
        const key = '__cd_' + attr;
        if (el[key] === undefined) el[key] = el.getAttribute(attr) || '';
        el.setAttribute(attr, lang === 'en' ? el.getAttribute(dataAttr) : el[key]);
      });
    });
  }
  /* Se expone por si el contenido se inyecta después (p. ej. tras un fetch) */
  window.cdApplyI18n = applyI18n;

  function updateNavLabels() {
    NAV_LINKS.forEach((item, i) => {
      const li = document.querySelector(`.cd-nav-links li:nth-child(${i + 1})`);
      if (!li) return;
      const topA = li.querySelector(':scope > a');
      if (topA) {
        /* Los ítems de primer nivel no llevan `en:` en NAV_LINKS: su traducción
           vive en NAV_LABELS_EN. Sin este fallback el nav se quedaba en español. */
        const topEn = item.en || NAV_LABELS_EN[item.label];
        topA.firstChild.textContent = (lang === 'en' && topEn) ? topEn : item.label;
      }
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
    <a href="./" class="cd-nav-brand">
      <img id="cd-nav-logo" src="/images/logo-white-h.png" alt="CartoData" />
    </a>
    <ul class="cd-nav-links">
      ${NAV_LINKS.map(l => `
        <li class="${l.children ? 'cd-has-dropdown' : ''}">
          <a href="${l.href}" class="${[isActive(l.href) ? 'cd-active' : '', l.label === 'X-Ray' ? 'cd-nav-xray' : ''].filter(Boolean).join(' ')}">${l.label}</a>
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

  /* Aplicar idioma inicial: si el visitante dejó el sitio en inglés, tanto el nav
     como el contenido deben cargar ya traducidos (el HTML viene en español y el
     nav se inyecta siempre con las etiquetas en español). */
  document.documentElement.lang = lang;
  updateNavLabels();
  applyI18n();

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
      <!-- Marca / Copyright -->
      <div class="cd-footer-copy-col">
        <p class="cd-footer-copy" data-en="© 2026 CartoData - Giving geographic context to your decisions">© 2026 CartoData - Dando contexto geográfico a tu decisión</p>
      </div>

      <!-- Nav grid con diamante conector -->
      <div class="cd-footer-col cd-footer-nav-col">
        <div class="cd-footer-nav-wrap">
          <div class="cd-footer-nav-grid">
            <a href="./index.html#impacto"    class="cd-footer-nav-btn" data-en="Impact">Impacto</a>
            <a href="./index.html#tecnologia" class="cd-footer-nav-btn" data-en="Technology">Tecnología</a>
            <a href="./index.html#cultura"    class="cd-footer-nav-btn" data-en="Culture">Cultura</a>
            <a href="./index.html#noticias"   class="cd-footer-nav-btn" data-en="News">Noticias</a>
          </div>
          <div class="cd-footer-diamond">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><rect x="4" y="0" width="5.66" height="5.66" transform="rotate(45 4 0)" stroke="currentColor" stroke-width="0.8" fill="none"/></svg>
          </div>
        </div>
      </div>

      <!-- Contacto -->
      <div class="cd-footer-col">
        <h4 class="cd-footer-col-title" data-en="Contact">Contacto</h4>
        <div class="cd-footer-col-links">
          <a href="tel:+523336271552">+52 333 627 1552</a>
          <a href="mailto:info@cartodata.com">info@cartodata.com</a>
          <a href="https://wa.me/523336271552" target="_blank" rel="noreferrer">WhatsApp</a>
        </div>
        <div class="cd-footer-social">
          <a href="https://www.youtube.com/@CartoDataTV" target="_blank" rel="noreferrer" aria-label="YouTube"><svg viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg></a>
          <a href="https://www.linkedin.com/company/cartodata" target="_blank" rel="noreferrer" aria-label="LinkedIn"><svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>
          <a href="https://www.facebook.com/CartoData/" target="_blank" rel="noreferrer" aria-label="Facebook"><svg viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>
          <a href="https://www.instagram.com/cartodata" target="_blank" rel="noreferrer" aria-label="Instagram"><svg viewBox="0 0 24 24"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/></svg></a>
          <a href="https://x.com/CartoData" target="_blank" rel="noreferrer" aria-label="X"><svg viewBox="0 0 24 24"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg></a>
          <a href="https://api.whatsapp.com/send?phone=523318520000" target="_blank" rel="noreferrer" aria-label="WhatsApp"><svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg></a>
        </div>
      </div>

      <!-- Info -->
      <div class="cd-footer-col">
        <h4 class="cd-footer-col-title">Info</h4>
        <div class="cd-footer-col-links">
          <a href="#ubicaciones" data-en="Locations">Ubicaciones</a>
          <a href="#" data-en="Press kit">Kit de prensa</a>
          <a href="./#aviso-privacidad" data-en="Privacy notice">Aviso de privacidad</a>
          <a href="./#terminos" data-en="Terms and conditions">Términos y condiciones</a>
        </div>
      </div>
    </div>
    <div class="cd-footer-partners">
      <a href="https://cloud.google.com/find-a-partner/partner/cartodata" class="cd-partner-link" title="Google Cloud SELECT Partner — Click para ver perfil de partner" target="_blank" rel="noopener noreferrer">
        <div class="cd-partner-img-logo">
          <img src="/images/googlecloud-logo.png" alt="Google Cloud" loading="lazy" />
        </div>
        <div class="cd-partner-img-badge">
          <img src="/images/googlepartner.png" alt="Google Cloud SELECT Services Partner" loading="lazy" />
        </div>
      </a>
    </div>`;
  document.body.appendChild(footer);

  /* El diamante conector debe cubrir el cruce de bordes con el color exacto
     del fondo de la página (varía entre #050816 y #0d0d0d según la página). */
  const diamond = footer.querySelector('.cd-footer-diamond');
  function syncDiamondBg() {
    let el = document.body, bg = '';
    while (el) {
      const c = getComputedStyle(el).backgroundColor;
      if (c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') { bg = c; break; }
      el = el.parentElement;
    }
    if (diamond && bg) diamond.style.background = bg;
  }
  syncDiamondBg();
  new MutationObserver(syncDiamondBg).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
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
              <p>Este aviso podrá ser modificado. Las modificaciones serán informadas a través de <a href="https://www.cartodata.com/privacidad" target="_blank" data-cd-realpage>www.cartodata.com/privacidad</a>.</p>
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
        document.querySelectorAll('a[href="#aviso-privacidad"],a[href*="privaci"]:not([data-cd-realpage])').forEach(l => {
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
                <p>Última actualización: junio 2025 · CartoData 2.0 SC</p>
              </div>
              <button id="cd-terms-close" aria-label="Cerrar">Cerrar ✕</button>
            </div>
            <div id="cd-terms-body">
              <h3>1. Aceptación de los Términos</h3>
              <p>Al acceder y utilizar el sitio web <strong>www.cartodata.com</strong> y los servicios de <strong>CartoData 2.0 SC</strong>, usted acepta quedar vinculado por los presentes Términos y Condiciones.</p>
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
              <p>Los presentes Términos y Condiciones se rigen e interpretan de conformidad con las leyes de los <strong>Estados Unidos Mexicanos</strong>. Para la interpretación, cumplimiento y resolución de cualquier controversia derivada de estos Términos, las partes se someten expresamente a la jurisdicción de los tribunales competentes de <strong>Zapopan, Jalisco</strong>, renunciando a cualquier otro fuero que pudiera corresponderles por razón de su domicilio presente o futuro.</p>
              <h3>10. Contacto</h3>
              <p>Para dudas, escríbanos a <a href="mailto:contacto@cartodata.com">contacto@cartodata.com</a>.</p>
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

    /* ── Modal Ubicaciones ── */
    /* Para agregar una nueva ubicación, añade un objeto a CD_LOCATIONS. */
    if (!document.getElementById('cd-loc-backdrop')) {
      const CD_LOCATIONS = [
        {
          name: 'Oficina Guadalajara',
          lines: ['Circunvalación Ote. 689 · Ciudad Granja', 'Zapopan, Jalisco, México · C.P. 45010'],
          lat: 20.6723, lon: -103.4524
        },
        {
          name: 'Oficina San Salvador',
          lines: ['Avenida Las Camelias #16-G · Colonia San Francisco', 'San Salvador Centro, San Salvador, El Salvador · C.P. 01101'],
          lat: 13.688531, lon: -89.225557
        },
      ];
      const cards = CD_LOCATIONS.map(l => `
        <article class="cd-loc-card">
          <div class="cd-loc-pin" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10a8 8 0 1 0-16 0c0 6 8 10 8 10z"/><circle cx="12" cy="12" r="2.6"/></svg>
          </div>
          <div class="cd-loc-body">
            <h3>${l.name}</h3>
            <p class="cd-loc-addr">${l.lines.join('<br>')}</p>
            <div class="cd-loc-coords">
              <span class="cd-loc-chip"><b>LAT</b> ${l.lat}</span>
              <span class="cd-loc-chip"><b>LON</b> ${l.lon}</span>
            </div>
            <a class="cd-loc-map" href="https://www.google.com/maps?q=${l.lat},${l.lon}" target="_blank" rel="noopener">Ver en Google Maps →</a>
          </div>
        </article>`).join('');

      document.body.insertAdjacentHTML('beforeend', `
        <style>
          #cd-loc-backdrop {
            display:none; position:fixed; inset:0; z-index:99999;
            background:rgba(13,13,13,0.75); backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px);
            align-items:center; justify-content:center; padding:1.5rem;
          }
          #cd-loc-backdrop.open { display:flex; }
          #cd-loc-modal {
            background:#ffffff; color:#0f172a; border:1px solid #e2e8f0; border-radius:20px;
            width:100%; max-width:560px; max-height:85vh; display:flex; flex-direction:column;
            box-shadow:0 24px 80px rgba(0,0,0,0.35); font-family:'DM Sans',system-ui,sans-serif; overflow:hidden;
          }
          #cd-loc-header {
            padding:1.6rem 1.8rem 1.2rem; border-bottom:1px solid #eef2f7;
            display:flex; align-items:flex-start; justify-content:space-between; gap:1rem;
            background:linear-gradient(135deg,#eef2ff 0%,#ffffff 65%);
          }
          #cd-loc-header .cd-loc-eyebrow { font-size:0.66rem; font-weight:700; letter-spacing:0.16em; text-transform:uppercase; color:#3b5bdb; margin:0 0 0.3rem; }
          #cd-loc-header h2 { font-size:1.4rem; font-weight:700; margin:0; color:#0f172a; }
          #cd-loc-close { flex-shrink:0; background:none; border:1px solid #e2e8f0; border-radius:8px; padding:0.4rem 0.75rem; cursor:pointer; font-size:0.8rem; color:#64748b; line-height:1; }
          #cd-loc-close:hover { background:#f1f5f9; color:#0f172a; }
          #cd-loc-list { padding:1.4rem 1.8rem; overflow-y:auto; display:grid; gap:1rem; }
          .cd-loc-card {
            display:flex; gap:1rem; align-items:flex-start;
            padding:1.2rem; border:1px solid #e8ecf3; border-radius:16px; background:#fbfcfe;
            transition:border-color 200ms, box-shadow 200ms, transform 200ms;
          }
          .cd-loc-card:hover { border-color:#c7d2fe; box-shadow:0 12px 30px rgba(59,91,219,0.12); transform:translateY(-2px); }
          .cd-loc-pin {
            flex-shrink:0; width:44px; height:44px; border-radius:12px;
            background:linear-gradient(135deg,#3b5bdb,#6d8bff); color:#fff;
            display:flex; align-items:center; justify-content:center; box-shadow:0 6px 16px rgba(59,91,219,0.35);
          }
          .cd-loc-pin svg { width:22px; height:22px; }
          .cd-loc-body { flex:1; min-width:0; }
          .cd-loc-body h3 { font-size:1rem; font-weight:700; color:#0f172a; margin:0 0 0.35rem; }
          .cd-loc-addr { font-size:0.85rem; color:#475569; line-height:1.55; margin:0 0 0.7rem; }
          .cd-loc-coords { display:flex; flex-wrap:wrap; gap:0.4rem; margin-bottom:0.7rem; }
          .cd-loc-chip { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:0.72rem; color:#334155; background:#eef2ff; border:1px solid #e0e7ff; border-radius:999px; padding:0.2rem 0.6rem; }
          .cd-loc-chip b { color:#3b5bdb; font-weight:700; margin-right:0.15rem; }
          .cd-loc-map { display:inline-block; font-size:0.82rem; font-weight:600; color:#3b5bdb; text-decoration:none; }
          .cd-loc-map:hover { text-decoration:underline; }
          .cd-loc-soon { text-align:center; font-size:0.74rem; color:#94a3b8; padding:0 1.8rem 1.5rem; margin:0; }
        </style>
        <div id="cd-loc-backdrop">
          <div id="cd-loc-modal" role="dialog" aria-modal="true" aria-labelledby="cd-loc-title">
            <div id="cd-loc-header">
              <div>
                <p class="cd-loc-eyebrow">Dónde estamos</p>
                <h2 id="cd-loc-title">Ubicaciones</h2>
              </div>
              <button id="cd-loc-close" aria-label="Cerrar">Cerrar ✕</button>
            </div>
            <div id="cd-loc-list">${cards}</div>
            <p class="cd-loc-soon">Pronto, más ubicaciones.</p>
          </div>
        </div>`);

      const locBackdrop = document.getElementById('cd-loc-backdrop');
      const locClose    = document.getElementById('cd-loc-close');
      const openLoc  = e => { if(e) e.preventDefault(); locBackdrop.classList.add('open'); document.body.style.overflow='hidden'; };
      const closeLoc = () => { locBackdrop.classList.remove('open'); document.body.style.overflow=''; };
      locClose.addEventListener('click', closeLoc);
      locBackdrop.addEventListener('click', e => { if(e.target===locBackdrop) closeLoc(); });
      document.addEventListener('keydown', e => { if(e.key==='Escape') closeLoc(); });
      window.openLocationsModal = openLoc;

      function hookLocLinks() {
        document.querySelectorAll('a[href*="#ubicaciones"]').forEach(l => {
          if (!l.dataset.cdLocHooked) { l.dataset.cdLocHooked='1'; l.addEventListener('click', openLoc); }
        });
      }
      hookLocLinks();
      const locObs = new MutationObserver(hookLocLinks);
      locObs.observe(document.body, { childList:true, subtree:true });
      setTimeout(() => { hookLocLinks(); locObs.disconnect(); }, 5000);
    }
  }

  /* El footer y los modales se inyectan después del nav, así que hay que volver a
     aplicar la traducción cuando ya existen en el DOM (si no, quedan en español). */
  function injectLate() { injectFooter(); initModals(); applyI18n(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectLate);
  } else {
    injectLate();
  }

})();
