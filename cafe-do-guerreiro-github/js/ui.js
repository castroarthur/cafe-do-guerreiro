(function () {
  const THEME_KEY = 'guerreiro_theme';
  const CART_KEY_BASE = 'guerreiro_cart_v1';
  let modalEscapeHandler = null;

  function ensureToast() {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast';
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    return toast;
  }

  function showToast(message) {
    const toast = ensureToast();
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1800);
  }

  function setTheme(theme) {
    const normalized = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', normalized);
    document.body.classList.toggle('dark-mode', normalized === 'dark');
    localStorage.setItem(THEME_KEY, normalized);

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.textContent = normalized === 'dark' ? '🌙' : '🌓';
    }
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
  }

  function restoreTheme() {
    setTheme(localStorage.getItem(THEME_KEY) || 'light');
  }

  function initThemeToggleButton() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;
    if (themeToggle.dataset.themeWired === 'true') return;

    themeToggle.addEventListener('click', toggleTheme);
    themeToggle.dataset.themeWired = 'true';
  }

  function autoInitThemeToggleButton() {
    if (window.__guerreiroThemeToggleAutoInit) return;
    window.__guerreiroThemeToggleAutoInit = true;

    const start = () => initThemeToggleButton();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
      start();
    }
  }

  function initMobileNav() {
    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');
    if (!toggle || !links) return;

    const closeMenu = () => {
      links.classList.remove('open');
      links.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
    };

    const syncExpandedState = () => {
      const isOpen = links.classList.contains('open') || links.classList.contains('active');
      toggle.setAttribute('aria-expanded', String(isOpen));
    };

    toggle.addEventListener('click', () => {
      const nextOpen = !(links.classList.contains('open') || links.classList.contains('active'));
      links.classList.toggle('open', nextOpen);
      links.classList.toggle('active', nextOpen);
      syncExpandedState();
    });

    links.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('click', (event) => {
      const isOpen = links.classList.contains('open') || links.classList.contains('active');
      if (!isOpen) return;
      if (toggle.contains(event.target) || links.contains(event.target)) return;
      closeMenu();
    });

    syncExpandedState();
  }

  function initPrimaryNavPreset() {
    const links = document.getElementById('navLinks');
    if (!links) return;

    const current = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const entries = [
      { href: 'index.html', label: 'Home' },
      { href: 'sobre.html', label: 'Sobre' },
      { href: 'menu.html', label: 'Menu' },
      { href: 'promocoes.html', label: 'Promocoes' },
      { href: 'galeria.html', label: 'Galeria' },
      { href: 'depoimentos.html', label: 'Depoimentos' },
      { href: 'blog.html', label: 'Blog' },
      { href: 'contato.html', label: 'Contato' }
    ];

    links.innerHTML = entries.map((entry) => {
      const isActive = current === entry.href;
      return `<li><a href="${entry.href}" class="nav-link${isActive ? ' active' : ''}">${entry.label}</a></li>`;
    }).join('');
  }

  function initHeaderActionsPreset() {
    const navActions = document.querySelector('.nav-actions');
    if (!navActions) return;

    const favoritesBtn = document.getElementById('favoritesBtn');
    if (favoritesBtn) favoritesBtn.style.display = 'none';

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) themeToggle.style.display = 'none';

    const cartBtn = document.getElementById('cartBtn');
    if (cartBtn) cartBtn.style.display = 'inline-flex';
  }

  function autoInitHeaderPreset() {
    if (window.__guerreiroHeaderPresetAutoInit) return;
    window.__guerreiroHeaderPresetAutoInit = true;

    const start = () => {
      initPrimaryNavPreset();
      initHeaderActionsPreset();
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
      start();
    }
  }

  function initBackToTop() {
    let button = document.querySelector('.back-to-top');
    if (button && button.dataset.wired === 'true') return;

    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'back-to-top';
      button.setAttribute('aria-label', 'Voltar ao topo');
      button.textContent = '↑';
      document.body.appendChild(button);
    }

    button.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    const onScroll = () => button.classList.toggle('show', window.scrollY > 320);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    button.dataset.wired = 'true';
  }

  function autoInitBackToTop() {
    if (window.__guerreiroBackToTopAutoInit) return;
    window.__guerreiroBackToTopAutoInit = true;

    const start = () => initBackToTop();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
      start();
    }
  }

  function initHashRouter() {
    const routeMap = {
      '#/home': 'home',
      '#/menu': 'menu',
      '#/contato': 'contato',
      '#/galeria': 'galeria'
    };

    function applyRoute() {
      const route = window.location.hash;
      if (!routeMap[route]) return;
      const target = document.getElementById(routeMap[route]);
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    window.addEventListener('hashchange', applyRoute);
    applyRoute();
  }

  function initMenuNavbarAutoHide() {
    if (window.__guerreiroNavbarAutoHideInit) return;

    const header = document.querySelector('header');
    if (!header) return;

    window.__guerreiroNavbarAutoHideInit = true;
    document.body.classList.add('nav-autohide');

    let lastY = window.scrollY;
    let upTravel = 0;
    let downTravel = 0;

    const SHOW_TOP_THRESHOLD = 86;
    const SHOW_UP_DISTANCE = 132;
    const HIDE_DOWN_DISTANCE = 36;
    const HIDE_MIN_SCROLL = 250;
    const DELTA_JITTER = 2;

    const showHeader = () => header.classList.remove('menu-nav-hidden');
    const hideHeader = () => header.classList.add('menu-nav-hidden');

    const onScroll = () => {
      if (window.innerWidth <= 768) {
        showHeader();
        lastY = window.scrollY;
        return;
      }

      const currentY = window.scrollY;
      const delta = currentY - lastY;

      if (Math.abs(delta) < DELTA_JITTER) {
        lastY = currentY;
        return;
      }

      if (currentY <= SHOW_TOP_THRESHOLD) {
        showHeader();
        upTravel = 0;
        downTravel = 0;
      } else if (delta < 0) {
        upTravel += Math.abs(delta);
        downTravel = 0;

        // Avoid showing the full header when user scrolls up only a little.
        if (upTravel >= SHOW_UP_DISTANCE) {
          showHeader();
          upTravel = 0;
        }
      } else {
        downTravel += delta;
        upTravel = 0;

        if (currentY > HIDE_MIN_SCROLL && downTravel >= HIDE_DOWN_DISTANCE) {
          hideHeader();
          downTravel = 0;
        }
      }

      lastY = currentY;
    };

    const onResize = () => {
      if (window.innerWidth <= 768) showHeader();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    onScroll();
  }

  function autoInitNavbarAutoHide() {
    if (window.__guerreiroNavbarAutoHideAutoInit) return;
    window.__guerreiroNavbarAutoHideAutoInit = true;

    const start = () => initMenuNavbarAutoHide();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
      start();
    }
  }

  function getCartCountFromStorage() {
    if (window.GuerreiroCart?.getCart) {
      return window.GuerreiroCart.getCart().reduce((sum, item) => sum + (item.qty || 0), 0);
    }

    const scope = window.GuerreiroAuth?.getStorageScope?.() || 'guest';
    const scopedKey = `${CART_KEY_BASE}__${scope}`;

    try {
      const cart = JSON.parse(localStorage.getItem(scopedKey)) || [];
      return cart.reduce((sum, item) => sum + (item.qty || 0), 0);
    } catch (_) {
      return 0;
    }
  }

  function initQuickCartTab() {
    if (window.__guerreiroQuickCartInit) return;

    // If header cart button is visible, avoid duplicated cart shortcuts.
    const headerCartBtn = document.getElementById('cartBtn');
    if (headerCartBtn) {
      document.getElementById('quickCartTab')?.remove();
      return;
    }

    const currentPage = (window.location.pathname || '').toLowerCase();
    const isCartPage = currentPage.endsWith('/carrinho.html') || currentPage.endsWith('carrinho.html');
    const isCheckoutPage = currentPage.endsWith('/checkout.html') || currentPage.endsWith('checkout.html');

    if (isCartPage || isCheckoutPage) {
      document.getElementById('quickCartTab')?.remove();
      return;
    }

    window.__guerreiroQuickCartInit = true;

    let tab = document.getElementById('quickCartTab');
    if (!tab) {
      tab = document.createElement('a');
      tab.id = 'quickCartTab';
      tab.className = 'quick-cart-tab';
      tab.href = 'carrinho.html';
      tab.setAttribute('aria-label', 'Abrir carrinho');
      tab.innerHTML = '🛒 Carrinho <span id="quickCartCount" class="quick-cart-count">0</span>';
      document.body.appendChild(tab);
    }

    const render = () => {
      const count = getCartCountFromStorage();
      const countEl = document.getElementById('quickCartCount');
      if (!countEl) return;
      countEl.textContent = String(count);
      tab.classList.toggle('has-items', count > 0);
    };

    window.addEventListener('storage', render);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) render();
    });

    window.addEventListener('guerreiro-cart-updated', render);
    window.addEventListener('guerreiro-data-scope-changed', render);
    render();
  }

  function autoInitQuickCartTab() {
    if (window.__guerreiroQuickCartAutoInit) return;
    window.__guerreiroQuickCartAutoInit = true;

    const start = () => initQuickCartTab();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
      start();
    }
  }

  function ensureModal() {
    let modal = document.getElementById('appModal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'appModal';
    modal.className = 'modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = '<div class="modal-content" role="dialog" aria-modal="true"><h2 id="appModalTitle"></h2><div id="appModalBody"></div><button type="button" class="btn" id="appModalClose" style="margin-top:.75rem;">Fechar</button></div>';
    document.body.appendChild(modal);
    return modal;
  }

  function trapFocus(modal) {
    const focusables = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!focusables.length) return;

    modal.onkeydown = function (event) {
      if (event.key !== 'Tab') return;
      const activeFocusables = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (!activeFocusables.length) return;

      const first = activeFocusables[0];
      const last = activeFocusables[activeFocusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    focusables[0].focus();
  }

  function openModal(options) {
    const modal = ensureModal();
    const content = modal.querySelector('.modal-content');
    const titleEl = modal.querySelector('#appModalTitle');
    const bodyEl = modal.querySelector('#appModalBody');
    const closeEl = modal.querySelector('#appModalClose');

    titleEl.textContent = options.title || 'Detalhes';
    bodyEl.innerHTML = options.html || '';

    function close() {
      modal.setAttribute('aria-hidden', 'true');
      if (modalEscapeHandler) {
        document.removeEventListener('keydown', modalEscapeHandler);
        modalEscapeHandler = null;
      }
    }

    closeEl.onclick = close;
    modal.onclick = (event) => {
      if (event.target === modal) close();
    };

    if (modalEscapeHandler) {
      document.removeEventListener('keydown', modalEscapeHandler);
    }

    modalEscapeHandler = function onEsc(event) {
      if (event.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
        close();
      }
    };

    document.addEventListener('keydown', modalEscapeHandler);

    modal.setAttribute('aria-hidden', 'false');
    trapFocus(content);
  }

  window.GuerreiroUI = {
    showToast,
    setTheme,
    toggleTheme,
    restoreTheme,
    initMobileNav,
    initPrimaryNavPreset,
    initHeaderActionsPreset,
    initBackToTop,
    initHashRouter,
    initMenuNavbarAutoHide,
    openModal
  };

  autoInitBackToTop();
  autoInitThemeToggleButton();
  autoInitHeaderPreset();
  autoInitNavbarAutoHide();
  autoInitQuickCartTab();
})();
