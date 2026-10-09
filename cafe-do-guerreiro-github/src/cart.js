const STORAGE_KEY = 'guerreiro_cart_v1';

let cart = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
const listeners = new Set();

function persist(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  broadcast();
}

function broadcast(){
  listeners.forEach(fn=>fn(getState()));
}

export function subscribe(fn){ listeners.add(fn); return ()=>listeners.delete(fn); }

export function getState(){
  const items = cart.map(i=>({ ...i }));
  const total = items.reduce((s,i)=>s + i.preco * i.qty,0);
  const count = items.reduce((s,i)=>s + i.qty,0);
  return {items,total,count};
}

export function addItem(item){
  const existing = cart.find(i=>i.id===item.id);
  if(existing){ existing.qty += 1; }
  else { cart.push({...item,qty:1}); }
  persist();
}

export function removeItem(id){ cart = cart.filter(i=>i.id!==id); persist(); }

export function setQty(id,qty){
  cart = cart.map(i=> i.id===id ? {...i, qty: Math.max(0,qty)} : i).filter(i=>i.qty>0);
  persist();
}

export function clearCart(){ cart=[]; persist(); }

export function initCart(){ broadcast(); }

export default {addItem,removeItem,setQty,subscribe,getState,clearCart,initCart};
