(function () {
  const CART_KEY = 'guerreiro_cart_v1';
  const FAV_KEY = 'guerreiro_favs_v1';

  function parseJSONSafe(raw, fallback) {
    try { return JSON.parse(raw); } catch (_) { return fallback; }
  }

  function getCart() {
    return parseJSONSafe(localStorage.getItem(CART_KEY), []);
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
  }

  function getFavorites() {
    return parseJSONSafe(localStorage.getItem(FAV_KEY), []);
  }

  function saveFavorites(favorites) {
    localStorage.setItem(FAV_KEY, JSON.stringify(favorites));
    updateFavoritesCount();
  }

  function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1800);
  }

  function updateCartCount() {
    const countEl = document.getElementById('cartCount');
    if (!countEl) return;
    const count = getCart().reduce((sum, item) => sum + (item.qty || 0), 0);
    countEl.textContent = count;
  }

  function updateFavoritesCount() {
    const button = document.getElementById('favoritesBtn');
    if (!button) return;
    const count = getFavorites().length;
    button.textContent = count ? `☆ ${count}` : '☆';
  }

  function toggleTheme() {
    const root = document.documentElement;
    const current = root.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('guerreiro_theme', next);
  }

  function restoreTheme() {
    const saved = localStorage.getItem('guerreiro_theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
  }

  function wireGlobalButtons() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', toggleTheme);
    }

    const cartBtn = document.getElementById('cartBtn');
    if (cartBtn) {
      cartBtn.addEventListener('click', () => {
        const items = getCart();
        if (!items.length) {
          showToast('Carrinho vazio');
          return;
        }
        showToast(`Itens no carrinho: ${items.length}`);
      });
    }

    const favoritesBtn = document.getElementById('favoritesBtn');
    if (favoritesBtn) {
      favoritesBtn.addEventListener('click', () => {
        const favs = getFavorites();
        showToast(favs.length ? `Favoritos: ${favs.length}` : 'Nenhum favorito ainda');
      });
    }
  }

  function wireMobileNav() {
    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');
    if (!toggle || !links) return;

    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
      const expanded = links.classList.contains('open');
      toggle.setAttribute('aria-expanded', String(expanded));
    });
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  function addToCart(item, qty) {
    const cart = getCart();
    const existing = cart.find(entry => entry.id === item.id);
    if (existing) {
      existing.qty = Math.min(99, (existing.qty || 0) + qty);
    } else {
      cart.push({ id: item.id, nome: item.nome, preco: item.preco, qty });
    }
    saveCart(cart);
    showToast(`${qty} × ${item.nome} adicionado`);
  }

  function toggleFavorite(item) {
    const favorites = getFavorites();
    const index = favorites.indexOf(item.id);
    if (index === -1) {
      favorites.push(item.id);
      saveFavorites(favorites);
      showToast('Adicionado aos favoritos');
      return true;
    }
    favorites.splice(index, 1);
    saveFavorites(favorites);
    showToast('Removido dos favoritos');
    return false;
  }

  function renderMenuPage() {
    const grid = document.getElementById('menuGrid');
    const dataEl = document.getElementById('menu-data');
    if (!grid || !dataEl) return;

    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    const categoryButtons = Array.from(document.querySelectorAll('.cat-btn'));

    const items = parseJSONSafe(dataEl.textContent || '[]', []);
    let selectedCategory = 'all';

    function render() {
      const term = (searchInput?.value || '').toLowerCase().trim();
      const sort = sortSelect?.value || 'default';

      let filtered = items.filter(item => {
        const inCategory = selectedCategory === 'all' || item.categoria === selectedCategory;
        const text = `${item.nome} ${item.descricao}`.toLowerCase();
        const inSearch = !term || text.includes(term);
        return inCategory && inSearch;
      });

      if (sort === 'price-asc') filtered.sort((a, b) => a.preco - b.preco);
      if (sort === 'price-desc') filtered.sort((a, b) => b.preco - a.preco);
      if (sort === 'name-asc') filtered.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

      const byCategory = {
        'Cafés': filtered.filter(item => item.categoria === 'Cafés'),
        'Salgados': filtered.filter(item => item.categoria === 'Salgados'),
        'Doces': filtered.filter(item => item.categoria === 'Doces')
      };

      grid.innerHTML = '';

      Object.entries(byCategory).forEach(([category, list]) => {
        if (!list.length) return;

        const section = document.createElement('article');
        section.className = 'menu-section';

        const title = document.createElement('h3');
        title.textContent = category;
        section.appendChild(title);

        const ul = document.createElement('ul');
        ul.className = 'menu-items';

        list.forEach(item => {
          const li = document.createElement('li');

          const name = document.createElement('strong');
          name.textContent = item.nome;

          const desc = document.createElement('p');
          desc.textContent = item.descricao;

          const price = document.createElement('div');
          price.className = 'price';
          price.textContent = formatCurrency(item.preco);

          const actions = document.createElement('div');
          actions.style.display = 'flex';
          actions.style.gap = '.45rem';

          const addBtn = document.createElement('button');
          addBtn.type = 'button';
          addBtn.className = 'add-item';
          addBtn.textContent = 'Adicionar';
          addBtn.addEventListener('click', () => addToCart(item, 1));

          const favBtn = document.createElement('button');
          favBtn.type = 'button';
          favBtn.className = 'favorite-btn';
          favBtn.textContent = getFavorites().includes(item.id) ? '★' : '☆';
          if (getFavorites().includes(item.id)) favBtn.classList.add('active');
          favBtn.addEventListener('click', () => {
            const active = toggleFavorite(item);
            favBtn.textContent = active ? '★' : '☆';
            favBtn.classList.toggle('active', active);
          });

          actions.appendChild(addBtn);
          actions.appendChild(favBtn);

          li.appendChild(name);
          li.appendChild(desc);
          li.appendChild(price);
          li.appendChild(actions);
          ul.appendChild(li);
        });

        section.appendChild(ul);
        grid.appendChild(section);
      });

      if (!grid.innerHTML.trim()) {
        grid.innerHTML = '<div class="menu-section"><p>Nenhum item encontrado.</p></div>';
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
  }

  function sanitizeBrokenText() {
    document.querySelectorAll('*').forEach(node => {
      if (node.childNodes.length === 1 && node.childNodes[0].nodeType === Node.TEXT_NODE) {
        node.textContent = node.textContent.replace(/CafÃ©/g, 'Café').replace(/PromoÃ§Ãµes/g, 'Promoções').replace(/Ã“/g, 'Ó').replace(/Ã§/g, 'ç');
      }
    });
  }

  restoreTheme();
  wireGlobalButtons();
  wireMobileNav();
  renderMenuPage();
  sanitizeBrokenText();
  updateCartCount();
  updateFavoritesCount();
})();
