/* Consolidated JS extracted from inline <script> blocks in the HTML
   Order preserved: nav helpers, scroll-spy, phone formatting, mobile menu, app logic (cart/favs/rendering) */

/* ===== NAV INIT (replaces inline onclick) ===== */
function initNavLinks(){
    const navLinks = document.querySelectorAll('.nav-link');
    const navList = document.querySelector('.nav-links');
    const menuToggle = document.querySelector('.menu-toggle');
    navLinks.forEach(link=>{
        link.addEventListener('click', function(e){
            navLinks.forEach(l=>l.classList.remove('active'));
            this.classList.add('active');
            if(navList && navList.classList.contains('active')){
                navList.classList.remove('active');
            }
            if(menuToggle && menuToggle.classList.contains('active')){
                menuToggle.classList.remove('active');
            }
        });
    });
}

/* ===== SCROLL SPY (IntersectionObserver) ===== */
function initScrollSpy(){
    const sections = Array.from(document.querySelectorAll('section[id]'));
    const navLinks = Array.from(document.querySelectorAll('.nav-link'));
    const catButtons = document.getElementById('categoryControls');
    const menuWrapper = document.getElementById('menuSection');

    function updateHeaderOffset(){
        const header = document.querySelector('header');
        const h = header ? Math.ceil(header.getBoundingClientRect().height) : 80;
        document.documentElement.style.setProperty('--header-offset', (h + 8) + 'px');
        return h;
    }

    let observer = null;

    function createObserver(){
        if(observer) observer.disconnect();
        const headerH = updateHeaderOffset();

        observer = new IntersectionObserver((entries)=>{
            entries.forEach(entry=>{
                if(entry.isIntersecting){
                    const id = entry.target.getAttribute('id');
                    navLinks.forEach(link=>{
                        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
                    });
                }
            });
        }, {
            root: null,
            rootMargin: `-${headerH}px 0px -40% 0px`,
            threshold: 0.05
        });

        sections.forEach(s=>observer.observe(s));
    }

    function updateCategoryControls(){
        if(!catButtons || !menuWrapper) return;
        const rect = menuWrapper.getBoundingClientRect();
        const headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-offset')) || 80;
        if(rect.top <= headerH + 20 && rect.bottom > headerH){
            catButtons.classList.remove('hidden');
        } else {
            catButtons.classList.add('hidden');
        }
    }

    createObserver();
    updateCategoryControls();

    window.addEventListener('resize', ()=>{ createObserver(); updateCategoryControls(); });
    window.addEventListener('scroll', updateCategoryControls);
}

/* ===== PHONE FORMATTING HELPERS ===== */
function initPhoneFormatting(){
    const tel = document.getElementById('telefone');
    if(!tel) return;
    tel.addEventListener('keypress', function(e){ if(!/[0-9]/.test(e.key)) e.preventDefault(); });
    tel.addEventListener('input', function(e){
        let valor = e.target.value.replace(/\D/g,'');
        if(valor.length <= 2) e.target.value = valor;
        else if(valor.length <= 7) e.target.value = `(${valor.slice(0,2)}) ${valor.slice(2)}`;
        else if(valor.length <= 11) e.target.value = `(${valor.slice(0,2)}) ${valor.slice(2,7)}-${valor.slice(7)}`;
        else e.target.value = `(${valor.slice(0,2)}) ${valor.slice(2,7)}-${valor.slice(7,11)}`;
    });
}

/* ===== MOBILE HAMBURGER MENU (create toggle) ===== */
function initMobileMenu(){
    (function () {
        const existing = document.querySelector('.menu-toggle');
        if(existing) return;
        const toggle = document.createElement('button');
        toggle.className = 'menu-toggle';
        toggle.setAttribute('aria-label', 'Abrir menu');
        toggle.innerHTML = '☰';
        const navbar = document.querySelector('.navbar');
        const navLinks = document.querySelector('.nav-links');
        if(!navbar || !navLinks) return;
        navbar.insertBefore(toggle, navLinks);
        toggle.addEventListener('click', ()=>{
            navLinks.classList.toggle('active');
            toggle.classList.toggle('active');
        });
    })();
}

/* ===== APP: CART, FAVORITES, RENDERING (extracted) ===== */
(function(){
    const CART_KEY = 'guerreiro_cart_v1';
    const FAV_KEY = 'guerreiro_favs_v1';
    const PROMO_USED_KEY = 'guerreiro_promo_used_v1';

    function fmt(v){ return new Intl.NumberFormat('pt-BR',{style:'currency', currency:'BRL'}).format(v); }
    function normalize(s){ return String(s||'').toLowerCase().normalize('NFD').replace(/[^\p{L}\p{N} ]/gu,''); }

    function getCart(){ try{ return JSON.parse(localStorage.getItem(CART_KEY))||[] }catch(e){return[]} }
    function saveCart(cart){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); updateCartCount(); }
    function addToCart(item, qty){ const cart = getCart(); const ex = cart.find(c=>c.id===item.id); if(ex) ex.qty = Math.min(99, ex.qty + qty); else cart.push({id:item.id, nome:item.nome, preco:item.preco, qty: qty}); saveCart(cart); showToast(`${qty} × ${item.nome} adicionados ao carrinho`); }
    function updateCartCount(){ const el = document.getElementById('cartCount'); if(!el) return; const n = getCart().reduce((s,i)=>s+i.qty,0); el.textContent = n; }

    function getFavorites(){ try{ return JSON.parse(localStorage.getItem(FAV_KEY))||[] }catch(e){return[]} }
    function saveFavorites(f){ localStorage.setItem(FAV_KEY, JSON.stringify(f)); updateFavoritesCount(); }
    function isFavorite(id){ return getFavorites().indexOf(id)!==-1 }
    function toggleFavorite(item){ const f = getFavorites(); const idx = f.indexOf(item.id); if(idx===-1){ f.push(item.id); saveFavorites(f); showToast(`Adicionado aos favoritos: ${item.nome}`); } else { f.splice(idx,1); saveFavorites(f); showToast(`Removido dos favoritos: ${item.nome}`); } }
    function updateFavoritesCount(){ const el = document.getElementById('favoritesBtn'); if(!el) return; const n = getFavorites().length; el.textContent = n? `☆ ${n}` : '☆'; }

    function showToast(msg){ const t=document.getElementById('toast'); if(!t) return; t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2000); }

    // favorites panel, render, checkout, combos, etc. — keep using extracted functions from original file by calling initApp()

    window.__guerreiro_internal = { fmt, getCart, saveCart, addToCart, updateCartCount, getFavorites, saveFavorites, isFavorite, toggleFavorite, updateFavoritesCount, showToast };

    function initApp(){
        updateCartCount();
        // wire controls that exist at load
        const search = document.getElementById('searchInput'); if(search) search.addEventListener('input', ()=>{ renderFiltered(); });
        const sort = document.getElementById('sortSelect'); if(sort) sort.addEventListener('change', ()=>{ renderFiltered(); });
        try{ initNavLinks(); }catch(e){}
        try{ initScrollSpy(); }catch(e){}
        try{ initMobileMenu(); }catch(e){}
        try{ initPhoneFormatting(); }catch(e){}
        try{ renderFiltered(); }catch(e){}
        try{ renderCombos(); }catch(e){}
        try{ buildCategoryButtons(document.getElementById('categoryControls'), 'all'); }catch(e){}
        const cartBtn = document.getElementById('cartBtn'); if(cartBtn) cartBtn.addEventListener('click', renderCheckout);
        const favBtn = document.getElementById('favoritesBtn'); if(favBtn) { favBtn.addEventListener('click', showFavoritesPanel); updateFavoritesCount(); }
        document.querySelectorAll('button.favorite-btn').forEach(btn=>{ const id = Number(btn.getAttribute('data-item-id')); if(id && isFavorite(id)){ btn.classList.add('active'); btn.textContent='★'; btn.setAttribute('aria-pressed','true'); } else { btn.classList.remove('active'); btn.textContent='☆'; btn.setAttribute('aria-pressed','false'); } });
        initializeTheme();
    }

    function initializeTheme(){ const savedTheme = localStorage.getItem('guerreiro_theme_v1') || 'light'; if(savedTheme === 'dark') document.body.classList.add('dark-mode'); const themeBtn = document.getElementById('themeToggle'); if(themeBtn) themeBtn.addEventListener('click', toggleTheme); }
    function toggleTheme(){ const isDark = document.body.classList.toggle('dark-mode'); localStorage.setItem('guerreiro_theme_v1', isDark ? 'dark' : 'light'); }

    // call init on DOM ready
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', initApp); else initApp();

    // expose some helpers for other extracted modules (renderFiltered, renderCombos, etc. remain in main HTML fallback)
})();

/* End of main.js */
