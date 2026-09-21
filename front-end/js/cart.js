// js/cart.js - carrinho de compras (guardado no localStorage do navegador)

const CART_KEY = 'cr_cart';

function getCart() {
  const raw = localStorage.getItem(CART_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  atualizarBadgeCarrinho();
}

// aceita tanto itens do cardápio (campo "id") quanto promoções (campo "itemId")
function addToCart(item) {
  const itemId = item.itemId || item.id;
  const cart = getCart();
  const existente = cart.find((i) => i.itemId === itemId);
  if (existente) {
    existente.qtd += 1;
  } else {
    cart.push({
      itemId,
      nome: item.nome,
      preco: item.preco,
      emoji: item.emoji || '🍽️',
      qtd: 1
    });
  }
  saveCart(cart);
}

function updateQty(itemId, delta) {
  const cart = getCart();
  const item = cart.find((i) => i.itemId === itemId);
  if (!item) return;
  item.qtd += delta;
  const novoCart = item.qtd <= 0 ? cart.filter((i) => i.itemId !== itemId) : cart;
  saveCart(novoCart);
}

function removeFromCart(itemId) {
  saveCart(getCart().filter((i) => i.itemId !== itemId));
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  atualizarBadgeCarrinho();
}

function cartTotal() {
  return getCart().reduce((soma, i) => soma + i.preco * i.qtd, 0);
}

function formatMoney(valor) {
  return 'R$ ' + Number(valor).toFixed(2).replace('.', ',');
}

// atualiza o numerinho do carrinho (🛒) em todas as páginas que tiverem o badge
function atualizarBadgeCarrinho() {
  const totalItens = getCart().reduce((soma, i) => soma + i.qtd, 0);
  document.querySelectorAll('.cart-badge').forEach((badge) => {
    badge.textContent = totalItens;
  });
}

document.addEventListener('DOMContentLoaded', atualizarBadgeCarrinho);
