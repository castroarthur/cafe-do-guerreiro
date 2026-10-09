import extras from './extras.js';
import ui from './ui.js';

document.addEventListener('DOMContentLoaded', ()=>{
  // theme toggle
  const themeBtn = document.getElementById('themeToggle');
  if(themeBtn){
    themeBtn.addEventListener('click', ()=>{ extras.toggleTheme(); themeBtn.setAttribute('aria-pressed', String(document.documentElement.hasAttribute('data-theme'))); themeBtn.focus(); });
    themeBtn.setAttribute('aria-pressed', String(document.documentElement.hasAttribute('data-theme')));
  }

  // improve buttons touch targets
  Array.from(document.querySelectorAll('button')).forEach(b=>{
    b.style.minHeight = b.style.minHeight || '44px';
    b.style.minWidth = b.style.minWidth || '44px';
    b.setAttribute('tabindex', b.getAttribute('tabindex') || '0');
  });

  // ensure modal traps focus already implemented in ui.js; add role and aria-modal
  const modal = document.getElementById('modal');
  if(modal){ modal.setAttribute('role','dialog'); modal.setAttribute('aria-modal','true'); }

  // skip link focus
  const skip = document.querySelector('.skip-to-main'); if(skip) skip.addEventListener('click', ()=>{ document.getElementById('main').focus(); });
});
