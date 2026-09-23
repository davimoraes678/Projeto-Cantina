/* HTML/CSS: CANTINA-REAL. Integração: API existente do Projeto-Cantina. */
'use strict';
const $ = (id) => document.getElementById(id);
const money = (value) => Number(value).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
const key = 'projeto-cantina:carrinho:v1';
let produtos = [];
let categoria = '';
let enviando = false;
let carrinho = [];
try {
  const saved = JSON.parse(localStorage.getItem(key) || '[]');
  if (Array.isArray(saved)) carrinho = saved.filter(i => Number.isInteger(i.id_produto) && Number.isInteger(i.quantidade) && i.quantidade > 0);
} catch { /* Um carrinho inválido não impede abrir o cardápio. */ }
function message(text, error = false) {
  $('mensagem').textContent = text;
  $('mensagem').classList.toggle('error', error);
}
function node(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}
function button(text, label, action, className = '') {
  const el = node('button', className, text);
  el.type = 'button'; el.setAttribute('aria-label', label);
  el.addEventListener('click', action);
  return el;
}
async function api(path, options = {}) {
  const response = await fetch('/api' + path, { ...options, headers: {'Content-Type': 'application/json', ...options.headers} });
  const data = await response.json();
  if (!response.ok) throw new Error(data.erro || 'Não foi possível concluir a operação.');
  return data;
}
function save() {
  try { localStorage.setItem(key, JSON.stringify(carrinho)); }
  catch { message('Seu navegador não permitiu salvar o carrinho entre páginas.', true); }
  document.querySelectorAll('.cart-badge').forEach(el => { el.textContent = carrinho.reduce((sum, i) => sum + i.quantidade, 0); });
}
const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
function picture(product) {
  const el = node('div', 'food-emoji');
  const images = {'coxinha':'coxinha.jpg','kitkat':'kitkat.jpg','pao de queijo':'pao-de-queijo.jpg','hamburguer':'pao-hamburguer.jpg','refrigerante':'refrigerante.jpg','suco de laranja':'suco-laranja.jpg'};
  const file = images[normalize(product.nome)];
  if (file) {
    const img = node('img'); img.src = 'img/produtos/' + file; img.alt = product.nome;
    img.addEventListener('error', () => { el.textContent = '🍽️'; }); el.append(img);
  } else { el.textContent = '🍽️'; el.setAttribute('aria-hidden', 'true'); }
  return el;
}
function change(id, delta) {
  const product = produtos.find(p => p.id_produto === id);
  const item = carrinho.find(i => i.id_produto === id);
  const quantity = (item?.quantidade || 0) + delta;
  if (delta > 0 && (!product?.status || quantity > product.quantidade_estoque)) return message('Quantidade indisponível no estoque informado.', true);
  if (quantity <= 0) carrinho = carrinho.filter(i => i.id_produto !== id);
  else if (item) item.quantidade = quantity;
  else carrinho.push({id_produto: id, quantidade: quantity});
  save();
  if ($('listaCarrinho')) renderCart();
  else message('Produto adicionado ao carrinho.');
}
function renderMenu() {
  const grid = $('grid'); grid.replaceChildren();
  const search = normalize($('busca').value.trim());
  const visible = produtos.filter(p => p.status && (!categoria || p.categoria === categoria) && normalize(p.nome).includes(search));
  for (const p of visible) {
    const card = node('article', 'food-card');
    card.append(picture(p), node('div','food-nome',p.nome), node('div','food-preco',money(p.preco_atual)));
    const row = node('div','food-add-row');
    const add = button(p.quantidade_estoque > 0 ? '+' : 'Esgotado', 'Adicionar ' + p.nome, () => change(p.id_produto, 1), p.quantidade_estoque > 0 ? 'fab-add' : 'btn-esgotado');
    add.disabled = p.quantidade_estoque <= 0; row.append(add); card.append(row); grid.append(card);
  }
  if (!visible.length) grid.append(node('p','empty-msg','Nenhum produto encontrado.'));
}
function renderCart() {
  const list = $('listaCarrinho'); list.replaceChildren(); let total = 0; let valid = carrinho.length > 0;
  for (const i of carrinho) {
    const p = produtos.find(p => p.id_produto === i.id_produto);
    const available = p?.status && i.quantidade <= p.quantidade_estoque;
    if (!available) valid = false;
    const row = node('div','order-row'); const info = node('div','order-row-info');
    info.append(node('div','order-row-nome',p?.nome || 'Produto removido'),node('div','order-row-preco',p ? money(p.preco_atual * i.quantidade) : 'Indisponível'));
    if (!available) info.append(node('p','error-msg','Remova o item ou ajuste a quantidade.'));
    const qty = node('div','qty-control');
    qty.append(button('−','Diminuir quantidade',()=>change(i.id_produto,-1)),node('span','',i.quantidade),button('+','Aumentar quantidade',()=>change(i.id_produto,1)));
    info.append(qty); row.append(info,button('🗑️','Remover produto',()=>change(i.id_produto,-i.quantidade),'trash-btn'));list.append(row);
    if (p) total += p.preco_atual * i.quantidade;
  }
  if (!carrinho.length) list.append(node('p','empty-msg','Seu carrinho está vazio. Volte ao cardápio para adicionar itens.'));
  $('totalCarrinho').textContent = money(total);
  $('btnConfirmar').disabled = !valid || enviando;
  return valid;
}
async function loadAlunos() {
  const alunos = await api('/alunos');
  for (const a of alunos) { const option = node('option','',a.nome + ' — ' + a.email); option.value = a.id_aluno; $('aluno').append(option); }
}
function orderCard(p, detail = false) {
  const card = node(detail ? 'section' : 'a', 'kitchen-card');
  if (!detail) card.href = 'order-status.html?id=' + p.id_pedido;
  const info = node('div');
  info.append(node('div','kitchen-codigo','Pedido #' + p.id_pedido),node('div','kitchen-nome',p.aluno_nome));
  for (const item of p.itens) info.append(node('p','',`${item.quantidade}× ${item.produto_nome} — ${money(item.subtotal)}`));
  info.append(node('strong','',money(p.valor_total)));
  if (p.horario_agendado_retirada) info.append(node('p','kitchen-time','Retirada: ' + new Date(p.horario_agendado_retirada).toLocaleString('pt-BR')));
  card.append(info,node('span','status-pill',p.status)); return card;
}
async function loadOrders() {
  const list = $('listaPedidos'); const pedidos = await api('/pedidos'); list.replaceChildren();
  for (const p of pedidos.filter(p => !$('aluno').value || p.id_aluno === Number($('aluno').value)).reverse()) list.append(orderCard(p));
  if (!list.children.length) list.append(node('p','empty-msg','Nenhum pedido encontrado.'));
}
async function loadDetail() {
  const id = new URLSearchParams(location.search).get('id');
  if (!/^\d+$/.test(id || '')) throw new Error('Pedido inválido.');
  const p = await api('/pedidos/' + id); $('detalhePedido').replaceChildren(orderCard(p,true));
}
async function guard(action) { try { await action(); } catch (e) { message(e.message || 'Falha de conexão. Tente novamente.',true); } }
async function checkout(event) {
  event.preventDefault(); if (enviando) return;
  enviando = true; $('btnConfirmar').disabled = true;
  try {
    // Confere novamente o catálogo antes do envio; o servidor calcula o total.
    produtos = await api('/produtos');
    if (!renderCart()) throw new Error('Revise os itens indisponíveis antes de confirmar.');
    const p = await api('/pedidos',{method:'POST',body:JSON.stringify({id_aluno:Number($('aluno').value),itens:carrinho,horario_agendado_retirada:$('horario').value || null})});
    carrinho = []; save(); location.href = 'order-status.html?id=' + p.id_pedido;
  } catch (e) { message(e.message,true); }
  finally { enviando = false; renderCart(); }
}
guard(async () => {
  save();
  switch (document.body.dataset.page) {
    case 'index':
      produtos = await api('/produtos'); renderMenu();
      $('busca').addEventListener('input', renderMenu);
      document.querySelectorAll('[data-cat]').forEach(tab => tab.addEventListener('click', () => {
        categoria = tab.dataset.cat;
        document.querySelectorAll('[data-cat]').forEach(t => t.classList.toggle('active', t === tab)); renderMenu();
      })); break;
    case 'cart':
      produtos = await api('/produtos'); await loadAlunos(); renderCart();
      $('checkout').addEventListener('submit', checkout); break;
    case 'orders':
      await loadAlunos(); await loadOrders();
      $('aluno').addEventListener('change',()=>guard(loadOrders));
      $('atualizar').addEventListener('click',()=>guard(loadOrders)); break;
    case 'order-status':
      await loadDetail(); $('atualizar').addEventListener('click',()=>guard(loadDetail)); break;
  }
});
