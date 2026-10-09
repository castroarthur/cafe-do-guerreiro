import cart from './cart.js';
import ui from './ui.js';
import extras from './extras.js';

let ITEMS = [];

function el(tag,props={},...children){ const e=document.createElement(tag); Object.assign(e,props); children.forEach(c=>e.append(typeof c==='string'?document.createTextNode(c):c)); return e; }

export async function loadAndRender(){
  const loading = document.getElementById('loading'); const grid = document.getElementById('menuGrid');
  loading.style.display='block'; grid.innerHTML='';
  try{
    // Try inline JSON (for file://) first
    const inline = document.getElementById('menu-data');
    if(inline){
      ITEMS = JSON.parse(inline.textContent);
    } else {
      const res = await fetch('data/menu.json');
      if(!res.ok) throw new Error('HTTP '+res.status);
      ITEMS = await res.json();
    }
    loading.style.display='none';
    render(ITEMS);
  }catch(err){ loading.textContent='Não foi possível carregar o menu.'; console.error(err); }
}

export function render(items){
  // Always render grouped layout: Cafés / Doces / Salgados
  const container = document.getElementById('menuGrid'); container.innerHTML='';
  const cats = ['Cafés','Doces','Salgados'];
  cats.forEach(cat=>{
    const section = document.createElement('article'); section.className = 'menu-section';
    const h2 = document.createElement('h2'); h2.textContent = (cat==='Cafés'? '☕ Cafés' : cat==='Doces'? '🍰 Doces' : '🥐 Salgados');
    section.appendChild(h2);
    const ul = document.createElement('ul'); ul.className = 'menu-items';
    const list = items.filter(i=>i.categoria===cat);
    list.forEach(it=>{
      const li = document.createElement('li');
      const strong = document.createElement('strong'); strong.textContent = it.nome;
      const p = document.createElement('p'); p.textContent = it.descricao;
      const btn = document.createElement('button'); btn.textContent = 'Adicionar'; btn.addEventListener('click', ()=>{ cart.addItem(it); ui.showToast('Item adicionado ao carrinho'); });
      const fav = document.createElement('button'); fav.textContent = extras.isFav(it.id)?'★':'☆'; fav.className='fav-toggle'; fav.setAttribute('aria-pressed', String(extras.isFav(it.id))); fav.addEventListener('click', ()=>{ extras.toggleFav(it.id); const active = extras.isFav(it.id); fav.textContent = active ? '★' : '☆'; fav.setAttribute('aria-pressed', String(active)); ui.showToast(active?'Adicionado aos favoritos':'Removido dos favoritos'); });
      const detail = document.createElement('button'); detail.textContent='Detalhes'; detail.addEventListener('click', ()=>{ const content = document.createElement('div'); content.innerHTML = `<h2>${it.nome}</h2><img src="${it.imagem}" style="width:100%;height:200px;object-fit:cover;border-radius:6px"/><p>${it.descricao}</p><p><strong>R$ ${it.preco.toFixed(2)}</strong></p>`; const buy = document.createElement('button'); buy.textContent='Adicionar ao carrinho'; buy.addEventListener('click', ()=>{ cart.addItem(it); ui.showToast('Item adicionado ao carrinho'); }); content.appendChild(buy); ui.openModal(content); });
      li.appendChild(strong); li.appendChild(p); li.appendChild(btn); li.appendChild(fav); li.appendChild(detail);
      ul.appendChild(li);
    });
    section.appendChild(ul);
    container.appendChild(section);
  });
}

export function applyFilters({search,category,sort}){
  let out = ITEMS.slice();
  if(category && category!=='all') out = out.filter(i=>i.categoria===category);
  if(search) out = out.filter(i=> (i.nome+ ' ' + i.descricao).toLowerCase().includes(search.toLowerCase()));
  if(sort==='price-asc') out.sort((a,b)=>a.preco-b.preco);
  if(sort==='price-desc') out.sort((a,b)=>b.preco-a.preco);
  if(sort==='name-asc') out.sort((a,b)=>a.nome.localeCompare(b.nome));
  render(out);
}

export function promoItems(){ return ITEMS.filter(i=>i.isPromo); }

export default {loadAndRender,applyFilters,promoItems};
