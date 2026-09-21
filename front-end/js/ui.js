// js/ui.js - menu lateral (sidebar), notificações e toast de aviso

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (!sidebar || !overlay) return;
  sidebar.classList.add('open');
  overlay.classList.add('open');
}

function fecharSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (!sidebar || !overlay) return;
  sidebar.classList.remove('open');
  overlay.classList.remove('open');
}

function toggleNotif() {
  const dropdown = document.getElementById('notifDropdown');
  if (!dropdown) return;
  dropdown.classList.toggle('open');
}

function mostrarToast(mensagem) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = mensagem;
  toast.classList.add('show');
  clearTimeout(toast._timeoutId);
  toast._timeoutId = setTimeout(() => toast.classList.remove('show'), 2500);
}

const TEXTOS_NOTIF = {
  preparando: 'está sendo preparado',
  pronto: 'está pronto para retirada! 🎉',
  entregue: 'já foi entregue'
};

async function carregarNotificacoes() {
  const dropdown = document.getElementById('notifDropdown');
  if (!dropdown) return;
  toggleNotif();
  dropdown.innerHTML = '<div class="notif-item">Carregando...</div>';
  try {
    const { pedidos } = await apiFetch('/api/orders/me');
    if (!pedidos || !pedidos.length) {
      dropdown.innerHTML = '<div class="notif-item">Nenhuma notificação por enquanto.</div>';
      return;
    }
    dropdown.innerHTML = pedidos
      .slice(0, 5)
      .map(
        (p) =>
          `<div class="notif-item">Pedido <strong>${p.codigo}</strong> ${TEXTOS_NOTIF[p.statusGeral] || ''}</div>`
      )
      .join('');
  } catch (e) {
    dropdown.innerHTML = '<div class="notif-item">Não foi possível carregar notificações.</div>';
  }
}
