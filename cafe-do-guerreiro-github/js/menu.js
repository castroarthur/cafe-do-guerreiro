(function () {
  const FAV_KEY_BASE = 'guerreiro_favs_v1';
  const FALLBACK_MENU_ITEMS = [
    { id: 1, nome: 'Expresso da Legião', categoria: 'Cafés', preco: 4.5, descricao: 'Café forte e encorpado.', imagem: '', isPromo: false },
    { id: 2, nome: 'Cappuccino do Comandante', categoria: 'Cafés', preco: 8.0, descricao: 'Leite cremoso, café e canela.', imagem: '', isPromo: true },
    { id: 3, nome: 'Latte da Arena', categoria: 'Cafés', preco: 9.5, descricao: 'Café suave com leite vaporizado.', imagem: '', isPromo: false },
    { id: 4, nome: 'Mocha do Coliseu', categoria: 'Cafés', preco: 11.0, descricao: 'Chocolate, espresso e espuma cremosa.', imagem: '', isPromo: true },
    { id: 5, nome: 'Café Gelado do Bastião', categoria: 'Cafés', preco: 10.0, descricao: 'Café gelado com toque de baunilha.', imagem: '', isPromo: false },
    { id: 6, nome: 'Pão de Queijo da Tropa', categoria: 'Salgados', preco: 3.5, descricao: 'Quentinho e fofinho.', imagem: '', isPromo: false },
    { id: 7, nome: 'Croissant do Quartel', categoria: 'Salgados', preco: 6.5, descricao: 'Massa folhada com queijo derretido.', imagem: '', isPromo: false },
    { id: 8, nome: 'Sanduíche de Batalha', categoria: 'Salgados', preco: 12.0, descricao: 'Pão rústico com ingredientes frescos.', imagem: '', isPromo: true },
    { id: 9, nome: 'Quiche da Fortaleza', categoria: 'Salgados', preco: 8.5, descricao: 'Recheio especial feito diariamente.', imagem: '', isPromo: false },
    { id: 10, nome: 'Empada do Escudeiro', categoria: 'Salgados', preco: 6.0, descricao: 'Massa leve com recheio cremoso.', imagem: '', isPromo: false },
    { id: 11, nome: 'Brownie do Gladiador', categoria: 'Doces', preco: 6.0, descricao: 'Chocolate intenso e nozes.', imagem: '', isPromo: true },
    { id: 12, nome: 'Bolo da Vitória', categoria: 'Doces', preco: 7.0, descricao: 'Cobertura de chocolate da casa.', imagem: '', isPromo: false },
    { id: 13, nome: 'Torta do Império', categoria: 'Doces', preco: 8.0, descricao: 'Creme cítrico e massa crocante.', imagem: '', isPromo: false },
    { id: 14, nome: 'Cookie da Legião', categoria: 'Doces', preco: 5.0, descricao: 'Cookie macio com gotas de chocolate.', imagem: '', isPromo: true },
    { id: 15, nome: 'Cheesecake do Trono', categoria: 'Doces', preco: 10.5, descricao: 'Creme delicado com calda de frutas.', imagem: '', isPromo: false }
  ];

  function scopedFavKey() {
    const scope = window.GuerreiroAuth?.getStorageScope?.() || 'guest';
    return `${FAV_KEY_BASE}__${scope}`;
  }

  function getFavorites() {
    try {
      const scoped = JSON.parse(localStorage.getItem(scopedFavKey()));
      if (Array.isArray(scoped)) return scoped;

      // Backward compatibility for old global favorites.
      const legacy = JSON.parse(localStorage.getItem(FAV_KEY_BASE));
      if (Array.isArray(legacy)) {
        localStorage.setItem(scopedFavKey(), JSON.stringify(legacy));
        return legacy;
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  function saveFavorites(favs) {
    localStorage.setItem(scopedFavKey(), JSON.stringify(favs));
    updateFavoritesCount();
  }

  function updateFavoritesCount() {
    const button = document.getElementById('favoritesBtn');
    if (!button) return;
    const count = getFavorites().length;
    button.textContent = count ? `☆ ${count}` : '☆';
  }

  function toggleFavorite(item) {
    const favs = getFavorites();
    const idx = favs.indexOf(item.id);
    if (idx === -1) {
      favs.push(item.id);
      saveFavorites(favs);
      window.GuerreiroUI?.showToast('Adicionado aos favoritos');
      return true;
    }
    favs.splice(idx, 1);
    saveFavorites(favs);
    window.GuerreiroUI?.showToast('Removido dos favoritos');
    return false;
  }

  async function loadMenuItems() {
    try {
      const response = await fetch('data/menu.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('Não foi possível carregar o menu');
      const data = await response.json();
      if (!Array.isArray(data) || !data.length) throw new Error('JSON inválido do menu');
      return data;
    } catch (_) {
      return FALLBACK_MENU_ITEMS;
    }
  }

  async function renderMenuPage() {
    const grid = document.getElementById('menuGrid');
    if (!grid) return;

    const statusEl = document.getElementById('menuStatus');
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    const categoryButtons = Array.from(document.querySelectorAll('.cat-btn'));

    let items = [];
    let selectedCategory = 'all';

    if (statusEl) statusEl.textContent = 'Carregando menu...';

    try {
      items = await loadMenuItems();
      if (statusEl) {
        statusEl.textContent = items === FALLBACK_MENU_ITEMS ? 'Modo offline: usando menu local.' : '';
      }
    } catch (_) {
      if (statusEl) statusEl.textContent = 'Não foi possível carregar o menu.';
      grid.innerHTML = '<article class="menu-section"><p>Não foi possível carregar o menu.</p></article>';
      return;
    }

    function render() {
      const term = (searchInput?.value || '').toLowerCase().trim();
      const sort = sortSelect?.value || 'default';

      let filtered = items.filter(item => {
        const byCategory = selectedCategory === 'all' || item.categoria === selectedCategory;
        const bySearch = !term || `${item.nome} ${item.descricao}`.toLowerCase().includes(term);
        return byCategory && bySearch;
      });

      if (sort === 'price-asc') filtered.sort((a, b) => a.preco - b.preco);
      if (sort === 'price-desc') filtered.sort((a, b) => b.preco - a.preco);
      if (sort === 'name-asc') filtered.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

      const groups = {
        'Cafés': filtered.filter(i => i.categoria === 'Cafés'),
        'Doces': filtered.filter(i => i.categoria === 'Doces'),
        'Salgados': filtered.filter(i => i.categoria === 'Salgados')
      };

      grid.innerHTML = '';

      Object.entries(groups).forEach(([category, list]) => {
        if (!list.length) return;

        const section = document.createElement('article');
        section.className = 'menu-section';
        section.innerHTML = `<h3>${category}</h3>`;

        const ul = document.createElement('ul');
        ul.className = 'menu-items';

        list.forEach(item => {
          const li = document.createElement('li');
          li.innerHTML = `<strong>${item.nome}</strong><p>${item.descricao}</p><div class="price">${window.GuerreiroCart.formatCurrency(item.preco)}</div>`;

          const actions = document.createElement('div');
          actions.style.display = 'flex';
          actions.style.gap = '.45rem';

          const addBtn = document.createElement('button');
          addBtn.type = 'button';
          addBtn.className = 'add-item';
          addBtn.textContent = 'Adicionar';
          addBtn.setAttribute('aria-label', `Adicionar ${item.nome}`);
          addBtn.onclick = () => window.GuerreiroCart.addItem(item, 1);

          const detailsBtn = document.createElement('button');
          detailsBtn.type = 'button';
          detailsBtn.className = 'favorite-btn';
          detailsBtn.textContent = 'Detalhes';
          detailsBtn.setAttribute('aria-label', `Detalhes de ${item.nome}`);
          detailsBtn.onclick = () => window.GuerreiroUI.openModal({
            title: item.nome,
            html: `<p><strong>Categoria:</strong> ${item.categoria}</p><p>${item.descricao}</p><p><strong>Preço:</strong> ${window.GuerreiroCart.formatCurrency(item.preco)}</p>${item.imagem ? `<img src="${item.imagem}" alt="${item.nome}" style="width:100%;border-radius:10px;max-height:220px;object-fit:cover;">` : ''}`
          });

          const favBtn = document.createElement('button');
          favBtn.type = 'button';
          favBtn.className = 'favorite-btn';
          const active = getFavorites().includes(item.id);
          favBtn.textContent = active ? '★' : '☆';
          favBtn.classList.toggle('active', active);
          favBtn.setAttribute('aria-label', `Favoritar ${item.nome}`);
          favBtn.onclick = () => {
            const isActive = toggleFavorite(item);
            favBtn.textContent = isActive ? '★' : '☆';
            favBtn.classList.toggle('active', isActive);
          };

          actions.append(addBtn, detailsBtn, favBtn);
          li.appendChild(actions);
          ul.appendChild(li);
        });

        section.appendChild(ul);
        grid.appendChild(section);
      });

      if (!grid.innerHTML.trim()) {
        grid.innerHTML = '<article class="menu-section"><p>Nenhum item encontrado.</p></article>';
      }
    }

    categoryButtons.forEach(button => {
      button.addEventListener('click', () => {
        categoryButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        selectedCategory = button.dataset.cat || 'all';
        render();
      });
    });

    searchInput?.addEventListener('input', render);
    sortSelect?.addEventListener('change', render);

    render();
    updateFavoritesCount();
  }

  async function renderPromotionsPage() {
    const grid = document.getElementById('promoDynamicGrid');
    if (!grid) return;

    try {
      const items = await loadMenuItems();
      const promos = items.filter(item => item.isPromo);
      grid.innerHTML = '';

      if (!promos.length) {
        grid.innerHTML = '<article class="promo-card"><h3>Sem ofertas no momento</h3><p>Volte mais tarde para novas promoções.</p></article>';
        return;
      }

      promos.forEach(item => {
        const card = document.createElement('article');
        card.className = 'promo-card';
        const discounted = item.preco * 0.9;
        card.innerHTML = `<h3>${item.nome}</h3><p>${item.descricao}</p><p><strong>De:</strong> ${window.GuerreiroCart.formatCurrency(item.preco)}</p><p><strong>Por:</strong> ${window.GuerreiroCart.formatCurrency(discounted)}</p><button class="btn" type="button">Ver oferta</button>`;
        card.querySelector('button')?.addEventListener('click', () => window.GuerreiroCart.addItem(item, 1));
        grid.appendChild(card);
      });
    } catch (_) {
      grid.innerHTML = '<article class="promo-card"><h3>Erro ao carregar promoções</h3><p>Tente novamente mais tarde.</p></article>';
    }
  }

  async function renderFavoritesPage() {
    const list = document.getElementById('favoritesGrid');
    if (!list) return;

    const summary = document.getElementById('favoritesSummary');
    const favIds = getFavorites();

    if (!favIds.length) {
      list.innerHTML = '<li>Nenhum item favoritado ainda.</li>';
      if (summary) summary.textContent = 'Você ainda não favoritou nenhum item.';
      return;
    }

    let items = [];
    try {
      items = await loadMenuItems();
    } catch (_) {
      items = [];
    }

    const favorites = items.filter((item) => favIds.includes(item.id));

    list.innerHTML = '';

    if (!favorites.length) {
      list.innerHTML = '<li>Não foi possível carregar seus favoritos agora.</li>';
      if (summary) summary.textContent = 'Tente novamente em instantes.';
      return;
    }

    favorites.forEach((item) => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${item.nome}</strong><p>${item.descricao}</p><div class="price">${window.GuerreiroCart.formatCurrency(item.preco)}</div>`;

      const actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.gap = '.45rem';
      actions.style.marginTop = '.5rem';

      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'add-item';
      addBtn.textContent = 'Adicionar';
      addBtn.onclick = () => window.GuerreiroCart.addItem(item, 1);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'favorite-btn active';
      removeBtn.textContent = 'Remover dos favoritos';
      removeBtn.onclick = () => {
        toggleFavorite(item);
        renderFavoritesPage();
      };

      actions.append(addBtn, removeBtn);
      li.appendChild(actions);
      list.appendChild(li);
    });

    if (summary) {
      summary.textContent = `Total de favoritos: ${favorites.length}`;
    }
  }

  window.GuerreiroMenu = {
    loadMenuItems,
    renderMenuPage,
    renderPromotionsPage,
    renderFavoritesPage,
    getFavorites,
    toggleFavorite,
    updateFavoritesCount
  };

  window.addEventListener('guerreiro-data-scope-changed', () => {
    updateFavoritesCount();
    renderFavoritesPage();
  });
})();
