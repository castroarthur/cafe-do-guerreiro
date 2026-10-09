import menu from './menu.js';
import ui from './ui.js';
import cart from './cart.js';
import checkout from './checkout.js';
import extras from './extras.js';

document.addEventListener('DOMContentLoaded', async ()=>{
  ui.initUI(); cart.initCart(); checkout.initCheckout();
  await menu.loadAndRender();
  extras.applyTheme();
  extras.initRouter();

  // favorites button
  document.getElementById('favoritesBtn').addEventListener('click', async ()=>{
    const favs = extras.getFavs();
    const content = document.createElement('div');
    const title = document.createElement('h2'); title.textContent = 'Favoritos'; content.appendChild(title);
    if(favs.length===0){ const p=document.createElement('p'); p.textContent='Nenhum favorito ainda.'; content.appendChild(p); ui.openModal(content); return; }
    const all = await (async ()=>{
      try{
        const inline = document.getElementById('menu-data');
        if(inline) return JSON.parse(inline.textContent);
        const r = await fetch('data/menu.json'); return await r.json();
      }catch{ return []; }
    })();
    const chosen = all.filter(i=> favs.includes(i.id));
    const grid = document.createElement('div'); grid.style.display='grid'; grid.style.gridTemplateColumns='repeat(auto-fit,minmax(200px,1fr))'; grid.style.gap='8px';
    chosen.forEach(it=>{
      const card = document.createElement('div'); card.className='card';
      const img = document.createElement('img'); img.src = it.imagem; img.alt = it.nome; img.style.height='120px'; img.style.objectFit='cover'; img.style.borderRadius='6px';
      const h = document.createElement('h3'); h.textContent = it.nome;
      const p = document.createElement('p'); p.style.color = '#666'; p.textContent = it.descricao;
      const meta = document.createElement('div'); meta.className = 'meta';
      const price = document.createElement('div'); price.textContent = `R$ ${it.preco.toFixed(2)}`;
      const addBtn = document.createElement('button'); addBtn.textContent = 'Adicionar'; addBtn.addEventListener('click', ()=>{ cart.addItem(it); ui.showToast('Adicionado do favoritos'); });
      meta.appendChild(price); meta.appendChild(addBtn);
      if(it.isPromo){
        const badge = document.createElement('div'); badge.className = 'promo-badge'; badge.textContent = 'PROMO';
        card.appendChild(badge);
        card.classList.add('promo');
      }
      card.appendChild(img); card.appendChild(h); card.appendChild(p); card.appendChild(meta);
      grid.appendChild(card);
    });
    content.appendChild(grid); ui.openModal(content);
  });

  // wire controls
  const search = document.getElementById('searchInput');
  const cat = document.getElementById('categoryFilter');
  const sort = document.getElementById('sortSelect');
  function apply(){ menu.applyFilters({ search: search.value, category: cat.value, sort: sort.value }); }
  if(search) search.addEventListener('input', apply);
  if(cat) cat.addEventListener('change', apply);
  if(sort) sort.addEventListener('change', apply);
});
