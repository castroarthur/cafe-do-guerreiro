import menu from './menu.js';

const FAV_KEY = 'guerreiro_favs_v1';
const THEME_KEY = 'guerreiro_theme_v1';

export function getFavs(){
  return JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
}

export function isFav(id){ return getFavs().includes(id); }

export function toggleFav(id){
  const arr = getFavs();
  const i = arr.indexOf(id);
  if(i>=0) arr.splice(i,1); else arr.push(id);
  localStorage.setItem(FAV_KEY, JSON.stringify(arr));
}

export function applyTheme(){
  const t = localStorage.getItem(THEME_KEY) || 'light';
  if(t==='dark') document.documentElement.setAttribute('data-theme','dark');
  else document.documentElement.removeAttribute('data-theme');
}

export function toggleTheme(){
  const now = document.documentElement.hasAttribute('data-theme') ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, now);
  applyTheme();
  return now;
}

export function initRouter(){
  function handle(){
    const hash = location.hash.replace('#','') || '/menu';
    if(hash.startsWith('/promocoes')){
      const items = menu.promoItems();
      const hero = document.querySelector('.menu-hero');
      if(hero){
        const h = hero.querySelector('h1'); if(h) h.textContent = 'Promoções';
        const p = hero.querySelector('p'); if(p) p.textContent = 'Aproveite nossas ofertas especiais';
      }
      document.getElementById('loading').style.display = items.length? 'none' : 'block';
      menu.render(items);
      window.scrollTo({top: document.getElementById('menuSection').offsetTop - 80, behavior:'smooth'});
    } else if(hash.startsWith('/menu') || hash==='/' || hash===''){
      const hero = document.querySelector('.menu-hero');
      if(hero){
        const h = hero.querySelector('h1'); if(h) h.textContent = 'Nosso Menu';
        const p = hero.querySelector('p'); if(p) p.textContent = 'Sabor artesanal em cada preparação';
      }
      menu.loadAndRender();
      window.scrollTo({top: document.getElementById('menuSection').offsetTop - 80, behavior:'smooth'});
    } else if(hash.startsWith('/contato')){
      const el = document.getElementById('contato'); if(el) el.scrollIntoView({behavior:'smooth'});
    }
  }
  window.addEventListener('hashchange', handle);
  handle();
}

export default {getFavs,isFav,toggleFav,applyTheme,toggleTheme,initRouter};
