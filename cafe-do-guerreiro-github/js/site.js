(function () {
  const CART_KEY = 'guerreiro_cart_v1';
  const FAV_KEY = 'guerreiro_favs_v1';

  function parseJSONSafe(raw, fallback) {
    try {
      return JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
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

  function updateItemQty(itemId, delta) {
    const cart = getCart();
    const item = cart.find(entry => entry.id === itemId);
    if (!item) return;
    item.qty = Math.max(1, Math.min(99, (item.qty || 1) + delta));
    saveCart(cart);
  }

  function removeItem(itemId) {
    const cart = getCart().filter(entry => entry.id !== itemId);
    saveCart(cart);
  }

  function getCartTotals() {
    const cart = getCart();
    const subtotal = cart.reduce((sum, item) => sum + ((item.preco || 0) * (item.qty || 0)), 0);
    return { subtotal, total: subtotal };
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

  function toggleTheme() {
    const root = document.documentElement;
    const current = root.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    document.body.classList.toggle('dark-mode', next === 'dark');
    localStorage.setItem('guerreiro_theme', next);
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) themeToggle.textContent = next === 'dark' ? '🌙' : '🌓';
  }

  function restoreTheme() {
    const saved = localStorage.getItem('guerreiro_theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    document.body.classList.toggle('dark-mode', saved === 'dark');
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) themeToggle.textContent = saved === 'dark' ? '🌙' : '🌓';
  }

  function wireGlobalButtons() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

    const cartBtn = document.getElementById('cartBtn');
    if (cartBtn) {
      cartBtn.addEventListener('click', () => {
        window.location.href = 'checkout.html';
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

  function wireBackToTop() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'back-to-top';
    button.setAttribute('aria-label', 'Voltar ao topo');
    button.textContent = '↑';
    document.body.appendChild(button);

    button.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    const onScroll = () => {
      button.classList.toggle('show', window.scrollY > 320);
    };

    window.addEventListener('scroll', onScroll);
    onScroll();
  }

  async function loadMenuItems() {
    const fallbackItems = [
      { id: 1, nome: 'Café Expresso', categoria: 'Cafés', preco: 4.5, descricao: 'Café forte e encorpado.', isPromo: false },
      { id: 2, nome: 'Cappuccino', categoria: 'Cafés', preco: 8.0, descricao: 'Leite cremoso e canela.', isPromo: true },
      { id: 3, nome: 'Pão de Queijo', categoria: 'Salgados', preco: 3.5, descricao: 'Quentinho e fofinho.', isPromo: false },
      { id: 4, nome: 'Brownie', categoria: 'Doces', preco: 6.0, descricao: 'Chocolate e nozes.', isPromo: true }
    ];

    try {
      const response = await fetch('data/menu.json', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Não foi possível carregar o menu');
      }
      const data = await response.json();
      if (!Array.isArray(data) || !data.length) {
        return fallbackItems;
      }
      return data;
    } catch (_) {
      return fallbackItems;
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
      if (statusEl) statusEl.textContent = '';
    } catch (error) {
      if (statusEl) statusEl.textContent = 'Não foi possível carregar o menu.';
      grid.innerHTML = '<article class="menu-section"><p>Não foi possível carregar o menu.</p></article>';
      return;
    }

    if (statusEl && items.length && items.length <= 4) {
      statusEl.textContent = 'Modo offline: exibindo menu local.';
    }

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
          const activeFav = getFavorites().includes(item.id);
          favBtn.textContent = activeFav ? '★' : '☆';
          favBtn.classList.toggle('active', activeFav);
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

  function renderCartPage() {
    const listEl = document.getElementById('cart-items');
    if (!listEl) return;

    const subtotalEl = document.getElementById('cartSubtotal');
    const totalEl = document.getElementById('cartTotal');

    function draw() {
      const cart = getCart();
      listEl.innerHTML = '';

      if (!cart.length) {
        listEl.innerHTML = '<li>Nenhum item no carrinho.</li>';
      } else {
        cart.forEach(item => {
          const li = document.createElement('li');

          const name = document.createElement('strong');
          name.textContent = item.nome;

          const price = document.createElement('div');
          price.className = 'price';
          price.textContent = `${formatCurrency(item.preco)} × ${item.qty} = ${formatCurrency(item.preco * item.qty)}`;

          const actions = document.createElement('div');
          actions.style.display = 'flex';
          actions.style.gap = '.45rem';
          actions.style.marginTop = '.45rem';

          const minusBtn = document.createElement('button');
          minusBtn.type = 'button';
          minusBtn.className = 'add-item';
          minusBtn.textContent = '−';
          minusBtn.setAttribute('aria-label', `Diminuir ${item.nome}`);
          minusBtn.addEventListener('click', () => {
            updateItemQty(item.id, -1);
            draw();
          });

          const plusBtn = document.createElement('button');
          plusBtn.type = 'button';
          plusBtn.className = 'add-item';
          plusBtn.textContent = '+';
          plusBtn.setAttribute('aria-label', `Aumentar ${item.nome}`);
          plusBtn.addEventListener('click', () => {
            updateItemQty(item.id, 1);
            draw();
          });

          const removeBtn = document.createElement('button');
          removeBtn.type = 'button';
          removeBtn.className = 'favorite-btn';
          removeBtn.textContent = 'Remover';
          removeBtn.addEventListener('click', () => {
            removeItem(item.id);
            draw();
          });

          actions.appendChild(minusBtn);
          actions.appendChild(plusBtn);
          actions.appendChild(removeBtn);

          li.appendChild(name);
          li.appendChild(price);
          li.appendChild(actions);
          listEl.appendChild(li);
        });
      }

      const totals = getCartTotals();
      if (subtotalEl) subtotalEl.textContent = formatCurrency(totals.subtotal);
      if (totalEl) totalEl.textContent = formatCurrency(totals.total);
    }

    draw();
  }

  function renderCheckoutPage() {
    const orderList = document.getElementById('orderList');
    const subtotalEl = document.getElementById('subtotal');
    const totalEl = document.getElementById('total');
    const form = document.getElementById('checkoutForm');
    const errorsEl = document.getElementById('checkoutErrors');
    const resultEl = document.getElementById('checkoutResult');

    if (!orderList || !form) return;

    const cart = getCart();
    orderList.innerHTML = '';

    if (!cart.length) {
      orderList.innerHTML = '<li>Nenhum item no carrinho.</li>';
    } else {
      cart.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${item.nome}</strong><br><span>${item.qty} × ${formatCurrency(item.preco)} = ${formatCurrency(item.preco * item.qty)}</span>`;
        orderList.appendChild(li);
      });
    }

    const totals = getCartTotals();
    subtotalEl.textContent = formatCurrency(totals.subtotal);
    totalEl.textContent = formatCurrency(totals.total);

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (errorsEl) errorsEl.textContent = '';

      const nome = document.getElementById('checkoutNome')?.value.trim() || '';
      const email = document.getElementById('checkoutEmail')?.value.trim() || '';
      const telefone = document.getElementById('checkoutTelefone')?.value.trim() || '';
      const obs = document.getElementById('checkoutObs')?.value.trim() || '';

      const errors = [];
      if (!nome) errors.push('Preencha o nome.');
      if (!email) errors.push('Preencha o email.');
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Email inválido.');
      if (!telefone) errors.push('Preencha o telefone.');
      if (!cart.length) errors.push('Seu carrinho está vazio.');

      if (errors.length) {
        if (errorsEl) errorsEl.textContent = errors.join(' ');
        return;
      }

      if (resultEl) {
        resultEl.style.display = 'block';
        resultEl.innerHTML = `
          <h2>Pedido recebido!</h2>
          <p><strong>Cliente:</strong> ${nome}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Telefone:</strong> ${telefone}</p>
          <p><strong>Observações:</strong> ${obs || 'Nenhuma'}</p>
          <h3>Resumo do Pedido</h3>
          <ul class="menu-items">${cart.map(item => `<li><strong>${item.nome}</strong><br>${item.qty} × ${formatCurrency(item.preco)} = ${formatCurrency(item.preco * item.qty)}</li>`).join('')}</ul>
          <p><strong>Total:</strong> ${formatCurrency(totals.total)}</p>
        `;
      }

      localStorage.removeItem(CART_KEY);
      updateCartCount();
      showToast('Pedido recebido!');
      form.reset();
    });
  }

  async function renderPromotionsPage() {
    const grid = document.getElementById('promoDynamicGrid');
    if (!grid) return;

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

      card.innerHTML = `
        <h3>${item.nome}</h3>
        <p>${item.descricao}</p>
        <p><strong>De:</strong> ${formatCurrency(item.preco)}</p>
        <p><strong>Por:</strong> ${formatCurrency(discounted)}</p>
        <button class="btn" type="button">Ver oferta</button>
      `;

      const action = card.querySelector('button');
      action?.addEventListener('click', () => {
        addToCart(item, 1);
      });

      grid.appendChild(card);
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

  restoreTheme();
  wireGlobalButtons();
  wireMobileNav();
  wireBackToTop();
  sanitizeBrokenText();
  updateCartCount();
  updateFavoritesCount();
  renderMenuPage();
  renderCartPage();
  renderCheckoutPage();
  renderPromotionsPage();
})();
