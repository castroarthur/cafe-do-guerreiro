(function () {
  const CART_KEY_BASE = 'guerreiro_cart_v1';
  const ORDER_HISTORY_KEY_BASE = 'guerreiro_order_history_v1';

  function scopedKey(baseKey) {
    const scope = window.GuerreiroAuth?.getStorageScope?.() || 'guest';
    return `${baseKey}__${scope}`;
  }

  function readList(baseKey) {
    const key = scopedKey(baseKey);
    try {
      const value = JSON.parse(localStorage.getItem(key));
      if (Array.isArray(value)) return value;

      // Backward compatibility for data saved before per-user scoping.
      const legacy = JSON.parse(localStorage.getItem(baseKey));
      if (Array.isArray(legacy)) {
        localStorage.setItem(key, JSON.stringify(legacy));
        return legacy;
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  function saveList(baseKey, list) {
    localStorage.setItem(scopedKey(baseKey), JSON.stringify(list));
    window.dispatchEvent(new Event('guerreiro-cart-updated'));
  }

  function getCart() {
    return readList(CART_KEY_BASE);
  }

  function saveCart(cart) {
    saveList(CART_KEY_BASE, cart);
    updateCartCount();
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  }

  function addItem(item, qty) {
    const cart = getCart();
    const existing = cart.find(entry => entry.id === item.id);
    if (existing) existing.qty = Math.min(99, (existing.qty || 0) + qty);
    else cart.push({ id: item.id, nome: item.nome, preco: item.preco, qty });
    saveCart(cart);
    window.GuerreiroUI?.showToast(`${qty} × ${item.nome} adicionado`);
  }

  function updateQty(itemId, delta) {
    const cart = getCart();
    const item = cart.find(entry => entry.id === itemId);
    if (!item) return;
    item.qty = Math.max(1, Math.min(99, (item.qty || 1) + delta));
    saveCart(cart);
  }

  function removeItem(itemId) {
    saveCart(getCart().filter(entry => entry.id !== itemId));
  }

  function clearCart() {
    localStorage.removeItem(scopedKey(CART_KEY_BASE));
    window.dispatchEvent(new Event('guerreiro-cart-updated'));
    updateCartCount();
  }

  function getOrderHistory() {
    return readList(ORDER_HISTORY_KEY_BASE);
  }

  function saveOrderHistory(history) {
    saveList(ORDER_HISTORY_KEY_BASE, history);
  }

  function addOrderToHistory(order) {
    const history = getOrderHistory();
    history.unshift(order);
    saveOrderHistory(history);
  }

  function removeOrderFromHistory(orderId) {
    const next = getOrderHistory().filter((order) => order.id !== orderId);
    saveOrderHistory(next);
  }

  function clearOrderHistory() {
    localStorage.removeItem(scopedKey(ORDER_HISTORY_KEY_BASE));
  }

  function totals() {
    const subtotal = getCart().reduce((sum, item) => sum + (item.preco * item.qty), 0);
    return { subtotal, total: subtotal };
  }

  function updateCartCount() {
    const el = document.getElementById('cartCount');
    if (!el) return;
    const count = getCart().reduce((sum, item) => sum + (item.qty || 0), 0);
    el.textContent = count;
  }

  function refreshForCurrentScope() {
    updateCartCount();
    renderCartPage();
    renderCheckoutPage();
    renderOrderHistoryPage();
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
          li.className = 'cart-item-row';
          li.innerHTML = `
            <div class="cart-item-main">
              <strong>${item.nome}</strong>
              <div class="price">${formatCurrency(item.preco)} × ${item.qty} = ${formatCurrency(item.preco * item.qty)}</div>
            </div>
          `;

          const controls = document.createElement('div');
          controls.className = 'cart-item-controls';

          const minus = document.createElement('button');
          minus.className = 'qty-btn';
          minus.type = 'button';
          minus.textContent = '−';
          minus.setAttribute('aria-label', `Diminuir ${item.nome}`);
          minus.onclick = () => { updateQty(item.id, -1); draw(); };

          const qtyValue = document.createElement('span');
          qtyValue.className = 'qty-value';
          qtyValue.textContent = String(item.qty);

          const plus = document.createElement('button');
          plus.className = 'qty-btn';
          plus.type = 'button';
          plus.textContent = '+';
          plus.setAttribute('aria-label', `Aumentar ${item.nome}`);
          plus.onclick = () => { updateQty(item.id, 1); draw(); };

          const remove = document.createElement('button');
          remove.className = 'btn-text remove-item-btn';
          remove.type = 'button';
          remove.textContent = 'Remover';
          remove.setAttribute('aria-label', `Remover ${item.nome}`);
          remove.onclick = () => { removeItem(item.id); draw(); };

          controls.append(minus, qtyValue, plus, remove);
          li.appendChild(controls);
          listEl.appendChild(li);
        });
      }

      const amount = totals();
      if (subtotalEl) subtotalEl.textContent = formatCurrency(amount.subtotal);
      if (totalEl) totalEl.textContent = formatCurrency(amount.total);
      updateCartCount();
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
    const couponInput = document.getElementById('checkoutCoupon');
    const applyCouponBtn = document.getElementById('applyCouponBtn');

    if (!orderList || !form) return;

    let discountPercent = 0;

    function drawOrder() {
      const cart = getCart();
      orderList.innerHTML = '';
      if (!cart.length) {
        orderList.innerHTML = '<li>Nenhum item no carrinho.</li>';
      } else {
        cart.forEach(item => {
          const li = document.createElement('li');
          li.className = 'checkout-item-row';
          li.innerHTML = `
            <span class="checkout-item-name">${item.nome}</span>
            <span class="checkout-item-value">${item.qty} × ${formatCurrency(item.preco)} = ${formatCurrency(item.preco * item.qty)}</span>
          `;
          orderList.appendChild(li);
        });
      }

      const base = totals();
      const discount = base.subtotal * (discountPercent / 100);
      const finalTotal = base.subtotal - discount;
      subtotalEl.textContent = formatCurrency(base.subtotal);
      totalEl.textContent = formatCurrency(finalTotal);
    }

    applyCouponBtn?.addEventListener('click', () => {
      const code = (couponInput?.value || '').trim().toUpperCase();
      const rules = {
        GUERREIRO10: 10,
        GLADIADOR15: 15
      };

      if (!rules[code]) {
        discountPercent = 0;
        window.GuerreiroUI?.showToast('Cupom inválido');
      } else {
        const base = totals().subtotal;
        if (base < 20) {
          discountPercent = 0;
          window.GuerreiroUI?.showToast('Cupom válido para compras acima de R$ 20,00');
        } else {
          discountPercent = rules[code];
          window.GuerreiroUI?.showToast(`Cupom aplicado: ${code}`);
        }
      }
      drawOrder();
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      errorsEl.textContent = '';

      const nome = document.getElementById('checkoutNome')?.value.trim() || '';
      const email = document.getElementById('checkoutEmail')?.value.trim() || '';
      const telefone = document.getElementById('checkoutTelefone')?.value.trim() || '';
      const telefoneDigits = telefone.replace(/\D/g, '');
      const pagamento = document.getElementById('checkoutPayment')?.value.trim() || '';
      const obs = document.getElementById('checkoutObs')?.value.trim() || '';

      const errors = [];
      if (!nome) errors.push('Preencha o nome.');
      if (!email) errors.push('Preencha o email.');
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Email inválido.');
      if (!telefone) errors.push('Preencha o telefone.');
      if (telefone && !/^\d{10,11}$/.test(telefoneDigits)) errors.push('Telefone inválido. Use DDD + número.');
      if (!pagamento) errors.push('Selecione a forma de pagamento.');
      if (!getCart().length) errors.push('Seu carrinho está vazio.');

      if (errors.length) {
        errorsEl.textContent = errors.join(' ');
        return;
      }

      const cart = getCart();
      const finalizedOrderItems = cart.map((item) => ({ ...item }));
      const submittedItems = cart.map((item) => ({ ...item }));

      const submittedSubtotal = submittedItems.reduce((sum, item) => sum + (item.preco * item.qty), 0);
      const submittedDiscount = submittedSubtotal * (discountPercent / 100);
      const submittedTotal = submittedSubtotal - submittedDiscount;

      addOrderToHistory({
        id: `PED-${Date.now()}`,
        createdAt: new Date().toISOString(),
        customer: { nome, email, telefone },
        paymentMethod: pagamento,
        notes: obs || '',
        discountPercent,
        subtotal: submittedSubtotal,
        discount: submittedDiscount,
        total: submittedTotal,
        items: submittedItems
      });

      function calcItemsTotal(items) {
        return items.reduce((sum, item) => sum + (item.preco * item.qty), 0);
      }

      function renderResult() {
        const itemsTotal = calcItemsTotal(finalizedOrderItems);
        const effectiveDiscount = itemsTotal * (discountPercent / 100);
        const effectiveFinalTotal = itemsTotal - effectiveDiscount;

        const itemsHtml = finalizedOrderItems.length
          ? finalizedOrderItems.map((item, index) => `
              <li class="checkout-item-row">
                <span class="checkout-item-name">${item.nome}</span>
                <span class="checkout-item-value">${item.qty} × ${formatCurrency(item.preco)} = ${formatCurrency(item.preco * item.qty)}</span>
                <div class="checkout-item-actions">
                  <button type="button" class="btn-text" data-remove-order-item="${index}">Excluir item</button>
                </div>
              </li>
            `).join('')
          : '<li>Nenhum item no pedido.</li>';

        resultEl.innerHTML = `
          <h2>Pedido recebido!</h2>
          <p><strong>Cliente:</strong> ${nome}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Telefone:</strong> ${telefone}</p>
          <p><strong>Pagamento:</strong> ${pagamento}</p>
          <p><strong>Observações:</strong> ${obs || 'Nenhuma'}</p>
          <h3>Resumo do Pedido</h3>
          <ul class="menu-items">${itemsHtml}</ul>
          <div class="checkout-result-actions">
            <button type="button" class="btn-text" id="removeAllOrderItemsBtn">Excluir todos os itens</button>
            <a href="historico.html" class="btn-text checkout-history-link">Ver histórico de pedidos</a>
          </div>
          <p><strong>Desconto:</strong> ${formatCurrency(effectiveDiscount)}</p>
          <p><strong>Total:</strong> ${formatCurrency(effectiveFinalTotal)}</p>
        `;

        resultEl.querySelector('#removeAllOrderItemsBtn')?.addEventListener('click', () => {
          if (!finalizedOrderItems.length) return;
          const shouldClear = window.confirm('Tem certeza que deseja excluir todos os itens do resumo?');
          if (!shouldClear) return;

          finalizedOrderItems.length = 0;
          renderResult();
          window.GuerreiroUI?.showToast('Todos os itens foram removidos do resumo do pedido.');
        });

        resultEl.querySelectorAll('[data-remove-order-item]').forEach((button) => {
          button.addEventListener('click', () => {
            const index = Number(button.getAttribute('data-remove-order-item'));
            const item = finalizedOrderItems[index];
            if (!item) return;

            const shouldRemove = window.confirm(`Excluir "${item.nome}" do pedido exibido?`);
            if (!shouldRemove) return;

            finalizedOrderItems.splice(index, 1);
            renderResult();
            window.GuerreiroUI?.showToast('Item removido do resumo do pedido.');
          });
        });
      }

      resultEl.style.display = 'block';
      renderResult();

      clearCart();
      form.reset();
      drawOrder();
      window.GuerreiroUI?.showToast('Pedido recebido!');
    });

    drawOrder();
  }

  function renderOrderHistoryPage() {
    const listEl = document.getElementById('orderHistoryList');
    const emptyEl = document.getElementById('orderHistoryEmpty');
    const clearBtn = document.getElementById('clearHistoryBtn');
    if (!listEl) return;

    function render() {
      const history = getOrderHistory();
      listEl.innerHTML = '';

      if (!history.length) {
        if (emptyEl) emptyEl.hidden = false;
        return;
      }

      if (emptyEl) emptyEl.hidden = true;

      history.forEach((order) => {
        const article = document.createElement('article');
        article.className = 'history-order card';

        const createdAt = new Date(order.createdAt || Date.now());
        const formattedDate = new Intl.DateTimeFormat('pt-BR', {
          dateStyle: 'short',
          timeStyle: 'short'
        }).format(createdAt);

        const itemsHtml = (order.items || []).map((item) => (
          `<li><strong>${item.nome}</strong> - ${item.qty} x ${formatCurrency(item.preco)} = ${formatCurrency(item.preco * item.qty)}</li>`
        )).join('');

        article.innerHTML = `
          <h3>${order.id || 'Pedido'}</h3>
          <p><strong>Data:</strong> ${formattedDate}</p>
          <p><strong>Cliente:</strong> ${order.customer?.nome || '-'}</p>
          <p><strong>Pagamento:</strong> ${order.paymentMethod || '-'}</p>
          <ul class="menu-items">${itemsHtml || '<li>Nenhum item registrado.</li>'}</ul>
          <p><strong>Desconto:</strong> ${formatCurrency(order.discount || 0)}</p>
          <p><strong>Total:</strong> ${formatCurrency(order.total || 0)}</p>
          <div style="margin-top:.45rem;">
            <button type="button" class="btn-text" data-delete-history-order="${order.id}">Excluir pedido</button>
          </div>
        `;

        listEl.appendChild(article);
      });

      listEl.querySelectorAll('[data-delete-history-order]').forEach((button) => {
        button.addEventListener('click', () => {
          const orderId = button.getAttribute('data-delete-history-order');
          if (!orderId) return;

          const ok = window.confirm('Confirmar exclusão deste pedido do histórico?');
          if (!ok) return;

          removeOrderFromHistory(orderId);
          render();
          window.GuerreiroUI?.showToast('Pedido removido do histórico.');
        });
      });
    }

    clearBtn?.addEventListener('click', () => {
      const ok = window.confirm('Tem certeza que deseja apagar todo o histórico de pedidos?');
      if (!ok) return;
      clearOrderHistory();
      render();
      window.GuerreiroUI?.showToast('Histórico de pedidos apagado.');
    });

    render();
  }

  window.GuerreiroCart = {
    getCart,
    addItem,
    updateQty,
    removeItem,
    clearCart,
    totals,
    getOrderHistory,
    clearOrderHistory,
    formatCurrency,
    updateCartCount,
    renderCartPage,
    renderCheckoutPage,
    renderOrderHistoryPage
  };

  window.addEventListener('guerreiro-data-scope-changed', refreshForCurrentScope);
})();
