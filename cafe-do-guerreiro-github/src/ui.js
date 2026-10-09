import { getState, subscribe, removeItem, setQty } from './cart.js';

const modal = document.getElementById('modal');
const toastEl = document.getElementById('toast');
let lastFocused = null;

export function showToast(msg, timeout=2000){
  toastEl.textContent = msg; toastEl.classList.add('show');
  setTimeout(()=>toastEl.classList.remove('show'), timeout);
}

export function openModal(content, opts={label:''}){
  lastFocused = document.activeElement;
  modal.innerHTML = '';
  const sheet = document.createElement('div'); sheet.className='sheet';
  sheet.tabIndex = -1;
  if(opts.label){ sheet.setAttribute('aria-label', opts.label); }
  const header = document.createElement('div'); header.style.marginBottom='8px';
  sheet.appendChild(header);
  sheet.appendChild(content);
  modal.appendChild(sheet);
  modal.setAttribute('aria-hidden','false');
  sheet.focus();
  trapFocus(sheet);
}

export function closeModal(){
  modal.setAttribute('aria-hidden','true');
  modal.innerHTML='';
  if(lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
}

modal.addEventListener('click', (e)=>{ if(e.target===modal) closeModal(); });
window.addEventListener('keydown',(e)=>{ if(e.key==='Escape') closeModal(); });

function trapFocus(container){
  function getFocusables(){
    return Array.from(container.querySelectorAll('a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])')).filter(el=>!el.hasAttribute('disabled'));
  }
  let focusables = getFocusables();
  if(focusables.length) focusables[0].focus();
  container.addEventListener('keydown', (e)=>{
    if(e.key !== 'Tab') return;
    focusables = getFocusables();
    const first = focusables[0]; const last = focusables[focusables.length-1];
    if(!first) return;
    if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  });
}

export function initUI(){
  // cart counter
  const cartCount = document.getElementById('cartCount');
  subscribe(state=>{ cartCount.textContent = state.count; });

  // cart modal
  document.getElementById('cartBtn').addEventListener('click', ()=>{
    const content = buildCartContent(); openModal(content);
  });

  // hamburger
  document.getElementById('hamburger').addEventListener('click', ()=>{
    const nav = document.getElementById('mobileNav');
    const shown = nav.getAttribute('aria-hidden')==='false';
    nav.setAttribute('aria-hidden', String(!shown));
  });

  // back to top
  const back = document.createElement('button'); back.className='back-to-top'; back.textContent='↑';
  document.body.appendChild(back);
  back.addEventListener('click', ()=>window.scrollTo({top:0,behavior:'smooth'}));
  window.addEventListener('scroll', ()=>{ if(window.scrollY>300) back.classList.add('show'); else back.classList.remove('show'); });
}

function buildCartContent(){
  const container = document.createElement('div');
  const state = getState();
  const title = document.createElement('h2'); title.textContent='Carrinho'; container.appendChild(title);
  if(state.items.length===0){ const p=document.createElement('p'); p.textContent='Carrinho vazio'; container.appendChild(p); return container; }
  const list = document.createElement('div');
  state.items.forEach(it=>{
    const row = document.createElement('div'); row.style.display='flex'; row.style.gap='8px'; row.style.alignItems='center';
    row.innerHTML = `<div style="flex:1"><strong>${it.nome}</strong><div style="color:#666">R$ ${it.preco.toFixed(2)}</div></div>`;
    const minus = document.createElement('button'); minus.textContent='-'; minus.addEventListener('click', ()=>{ setQty(it.id, it.qty-1); updateCartModal(container); });
    const plus = document.createElement('button'); plus.textContent='+'; plus.addEventListener('click', ()=>{ setQty(it.id, it.qty+1); updateCartModal(container); });
    const rm = document.createElement('button'); rm.textContent='Remover'; rm.addEventListener('click', ()=>{ removeItem(it.id); updateCartModal(container); });
    row.appendChild(minus); row.appendChild(document.createTextNode(' ' + it.qty + ' ')); row.appendChild(plus); row.appendChild(rm);
    list.appendChild(row);
  });
  container.appendChild(list);
  const total = document.createElement('div'); total.style.marginTop='1rem'; total.innerHTML = `<strong>Total: R$ ${state.total.toFixed(2)}</strong>`;
  container.appendChild(total);
  const checkoutBtn = document.createElement('button'); checkoutBtn.textContent='Finalizar pedido'; checkoutBtn.addEventListener('click', ()=>{
    const evt = new CustomEvent('open-checkout'); window.dispatchEvent(evt);
  });
  container.appendChild(checkoutBtn);
  return container;
}

function updateCartModal(container){
  const newContent = buildCartContent(); container.replaceWith(newContent);
}

export default {initUI,openModal,closeModal,showToast};
