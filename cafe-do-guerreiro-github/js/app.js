(function () {
  let favoritesPanelBuilt = false;

  function closeFavoritesSidebar() {
    const panel = document.getElementById('favoritesPanel');
    const backdrop = document.getElementById('favoritesBackdrop');
    if (!panel) return;
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    if (backdrop) backdrop.classList.remove('open');
    document.body.classList.remove('favorites-open');
  }

  function ensureFavoritesSidebar() {
    let panel = document.getElementById('favoritesPanel');
    let backdrop = document.getElementById('favoritesBackdrop');

    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'favoritesBackdrop';
      backdrop.className = 'favorites-backdrop';
      backdrop.setAttribute('aria-hidden', 'true');
      document.body.appendChild(backdrop);
      backdrop.addEventListener('click', closeFavoritesSidebar);
    }

    if (panel) return panel;

    panel = document.createElement('aside');
    panel.id = 'favoritesPanel';
    panel.className = 'favorites-panel';
    panel.setAttribute('aria-hidden', 'true');
    panel.innerHTML = [
      '<div class="favorites-header">',
      '  <h3 style="margin:0;">Seus favoritos</h3>',
      '  <div class="favorites-header-actions">',
      '    <button id="favoritesCloseBtn" class="btn-text" type="button" aria-label="Fechar favoritos">Fechar</button>',
      '  </div>',
      '</div>',
      '<div class="favorites-topbar">',
      '  <a href="menu.html" id="favoritesMenuBtn" class="favorites-menu-btn" aria-label="Abrir menu">Menu</a>',
      '</div>',
      '<div id="favoritesList" class="favorites-list"></div>'
    ].join('');

    document.body.appendChild(panel);
    panel.querySelector('#favoritesCloseBtn')?.addEventListener('click', closeFavoritesSidebar);
    return panel;
  }

  async function renderFavoritesSidebar() {
    const panel = ensureFavoritesSidebar();
    const listEl = panel.querySelector('#favoritesList');
    if (!listEl) return;

    const favoriteIds = window.GuerreiroMenu?.getFavorites?.() || [];
    if (!favoriteIds.length) {
      listEl.innerHTML = '<p>Nenhum item favoritado ainda.</p>';
      return;
    }

    let items = [];
    try {
      items = await window.GuerreiroMenu.loadMenuItems();
    } catch (_) {
      items = [];
    }

    const favorites = items.filter((item) => favoriteIds.includes(item.id));
    if (!favorites.length) {
      listEl.innerHTML = '<p>Não foi possível carregar seus favoritos agora.</p>';
      return;
    }

    listEl.innerHTML = '';

    favorites.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'fav-row';
      row.style.animationDelay = `${index * 70}ms`;
      row.innerHTML = `<div class="fav-meta"><div class="fav-name">${item.nome}</div><div class="fav-price">${window.GuerreiroCart.formatCurrency(item.preco)}</div></div>`;

      const actions = document.createElement('div');
      actions.className = 'fav-actions';

      const addBtn = document.createElement('button');
      addBtn.className = 'btn favorites-add-btn';
      addBtn.type = 'button';
      addBtn.textContent = 'Adicionar';
      addBtn.addEventListener('click', () => window.GuerreiroCart.addItem(item, 1));

      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn-text favorites-remove-btn';
      removeBtn.type = 'button';
      removeBtn.textContent = 'Remover';
      removeBtn.addEventListener('click', () => {
        window.GuerreiroMenu.toggleFavorite(item);
        renderFavoritesSidebar();
      });

      actions.append(addBtn, removeBtn);
      row.appendChild(actions);
      listEl.appendChild(row);
    });
  }

  async function openFavoritesSidebar() {
    const panel = ensureFavoritesSidebar();
    const backdrop = document.getElementById('favoritesBackdrop');
    if (!favoritesPanelBuilt) {
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeFavoritesSidebar();
      });
      favoritesPanelBuilt = true;
    }

    await renderFavoritesSidebar();
    if (backdrop) backdrop.classList.add('open');
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    document.body.classList.add('favorites-open');
  }

  function wireGlobalButtons() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle && themeToggle.dataset.themeWired !== 'true') {
      themeToggle.addEventListener('click', window.GuerreiroUI.toggleTheme);
      themeToggle.dataset.themeWired = 'true';
    }

    const cartBtn = document.getElementById('cartBtn');
    if (cartBtn) {
      cartBtn.addEventListener('click', () => {
        window.location.href = 'carrinho.html';
      });
    }

    const favoritesBtn = document.getElementById('favoritesBtn');
    if (favoritesBtn) {
      favoritesBtn.addEventListener('click', openFavoritesSidebar);
    }
  }

  function wireContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      window.GuerreiroUI.showToast('Mensagem enviada com sucesso!');
      form.reset();
    });
  }

  function formatPhone(value) {
    const digits = (value || '').replace(/\D/g, '').slice(0, 11);
    if (!digits) return '';

    const ddd = digits.slice(0, 2);
    const rest = digits.slice(2);

    if (digits.length <= 2) return `(${ddd}`;
    if (digits.length <= 6) return `(${ddd}) ${rest}`;
    if (digits.length <= 10) return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
    return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
  }

  function initPhoneMask() {
    const phoneInputs = [
      document.getElementById('telefone'),
      document.getElementById('checkoutTelefone')
    ].filter(Boolean);

    phoneInputs.forEach((input) => {
      input.setAttribute('inputmode', 'numeric');
      input.setAttribute('autocomplete', 'tel');

      input.addEventListener('input', () => {
        input.value = formatPhone(input.value);
      });

      input.addEventListener('paste', (event) => {
        event.preventDefault();
        const text = (event.clipboardData || window.clipboardData)?.getData('text') || '';
        input.value = formatPhone(text);
      });

      input.value = formatPhone(input.value);
    });
  }

  function wireBlogReadMore() {
    const posts = document.querySelectorAll('.blog-post');
    if (!posts.length) return;

    const extraByTitle = {
      'Os Segredos da Extração Perfeita': 'Use água entre 90°C e 96°C, moagem ajustada ao método e extração entre 25 e 30 segundos no expresso. Um ajuste fino de 1 clique no moedor já pode mudar bastante o resultado na xícara.',
      'Café e Produtividade': 'Para manter constância de energia, prefira doses menores ao longo do dia e evite consumir muito tarde. Combinar café com hidratação e pequenas pausas melhora o desempenho sem picos bruscos.',
      'Sustentabilidade no Café': 'Valorize grãos de origem rastreável, torrefações locais e embalagens recicláveis. No dia a dia, reutilizar filtros permanentes e evitar desperdício de água também reduz o impacto ambiental.'
    };

    posts.forEach((post, index) => {
      const button = post.querySelector('.btn-text');
      if (!button || button.dataset.blogWired === 'true') return;

      let content = post.querySelector('.blog-extra');
      if (!content) {
        content = document.createElement('div');
        content.className = 'blog-extra';
        const title = post.querySelector('h3')?.textContent?.trim() || '';
        const text = extraByTitle[title] || 'Em breve, mais detalhes deste artigo aqui no blog do Café do Guerreiro 2.0.';
        content.innerHTML = `<p>${text}</p>`;
        content.hidden = true;
        button.insertAdjacentElement('beforebegin', content);
      }

      if (!content.id) content.id = `extra-post-auto-${index + 1}`;
      button.setAttribute('type', 'button');
      button.setAttribute('aria-controls', content.id);
      if (!button.hasAttribute('aria-expanded')) button.setAttribute('aria-expanded', 'false');

      button.addEventListener('click', () => {
        const targetId = button.getAttribute('aria-controls');
        const targetContent = targetId ? document.getElementById(targetId) : null;
        if (!targetContent) return;

        const isExpanded = button.getAttribute('aria-expanded') === 'true';
        const nextExpanded = !isExpanded;

        targetContent.hidden = !nextExpanded;
        button.setAttribute('aria-expanded', String(nextExpanded));
        button.textContent = nextExpanded ? 'Leia menos ↑' : 'Leia mais →';
      });

      button.dataset.blogWired = 'true';
    });
  }

  function sanitizeBrokenText() {
    document.querySelectorAll('*').forEach(node => {
      if (node.childNodes.length === 1 && node.childNodes[0].nodeType === Node.TEXT_NODE) {
        node.textContent = node.textContent
          .replace(/CafÃ©/g, 'Café')
          .replace(/PromoÃ§Ãµes/g, 'Promoções')
          .replace(/Ã“/g, 'Ó')
          .replace(/Ã§/g, 'ç');
      }
    });
  }

  function init() {
    window.GuerreiroUI.restoreTheme();
    window.GuerreiroUI.initMobileNav();
    window.GuerreiroUI.initBackToTop();
    window.GuerreiroUI.initHashRouter();
    window.GuerreiroUI.initMenuNavbarAutoHide();

    wireGlobalButtons();
    wireContactForm();
    initPhoneMask();
    wireBlogReadMore();
    sanitizeBrokenText();

    window.GuerreiroCart.updateCartCount();
    window.GuerreiroCart.renderCartPage();
    window.GuerreiroCart.renderCheckoutPage();
    window.GuerreiroCart.renderOrderHistoryPage();

    window.GuerreiroMenu.updateFavoritesCount();
    window.GuerreiroMenu.renderMenuPage();
    window.GuerreiroMenu.renderPromotionsPage();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
