import cart from './cart.js';
import ui from './ui.js';

export function initCheckout(){
  window.addEventListener('open-checkout', ()=>{
    const content = buildForm(); ui.openModal(content);
  });
}

function buildForm(){
  const container = document.createElement('div');
  const title = document.createElement('h2'); title.textContent='Finalizar pedido'; container.appendChild(title);
  const form = document.createElement('form');
  form.innerHTML = `
    <label>Nome<br><input name="nome" required></label>
    <label>Email<br><input name="email" type="email" required></label>
    <label>Telefone<br><input name="telefone" required></label>
    <label>Cupom (opcional)<br><input name="cupom" placeholder="GUERREIRO10"></label>
    <label>Observações<br><textarea name="obs"></textarea></label>
    <div style="margin-top:.8rem"><button type="submit">Enviar pedido</button></div>
  `;
  form.addEventListener('submit',(e)=>{ e.preventDefault(); handleSubmit(new FormData(form)); });
  container.appendChild(form);
  return container;
}

function handleSubmit(fd){
  const nome = fd.get('nome'); const email = fd.get('email'); const tel = fd.get('telefone');
  if(!nome || !email || !tel){ ui.showToast('Preencha nome, email e telefone'); return; }
  const state = cart.getState();
  const cupom = (fd.get('cupom')||'').trim();
  let discount = 0;
  if(cupom.toUpperCase()==='GUERREIRO10') discount = 0.10;
  const summary = document.createElement('div');
  summary.innerHTML = `<h2>Pedido recebido!</h2><p>Obrigado, ${nome}.</p>`;
  const ul = document.createElement('ul'); state.items.forEach(it=>{ const li=document.createElement('li'); li.textContent = `${it.qty}x ${it.nome} — R$ ${(it.preco*it.qty).toFixed(2)}`; ul.appendChild(li); });
  summary.appendChild(ul);
  const total = state.total;
  const discountAmount = +(total * discount).toFixed(2);
  const final = +(total - discountAmount).toFixed(2);
  if(discount>0) summary.innerHTML += `<p>Subtotal: R$ ${total.toFixed(2)}<br>Desconto: R$ ${discountAmount.toFixed(2)} (${(discount*100).toFixed(0)}%)</p>`;
  summary.innerHTML += `<p><strong>Total: R$ ${final.toFixed(2)}</strong></p>`;
  cart.clearCart();
  ui.openModal(summary);
}

export default {initCheckout};
