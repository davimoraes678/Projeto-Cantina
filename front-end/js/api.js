// js/api.js - sessão do aluno (login) e chamadas para a API do backend

const TOKEN_KEY = 'cr_token';
const ALUNO_KEY = 'cr_aluno';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getAluno() {
  const raw = localStorage.getItem(ALUNO_KEY);
  return raw ? JSON.parse(raw) : null;
}

function setSession(token, aluno) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ALUNO_KEY, JSON.stringify(aluno));
}

function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ALUNO_KEY);
  localStorage.removeItem('cr_cart');
  window.location.href = 'login.html';
}

// redireciona para o login se o aluno não estiver autenticado
function exigirLogin() {
  if (!getToken()) {
    window.location.href = 'login.html';
  }
}

// wrapper de fetch: adiciona o token de autenticação e trata erros da API
async function apiFetch(url, options = {}) {
  const headers = Object.assign(
    { 'Content-Type': 'application/json' },
    options.headers || {}
  );

  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;

  let res;
  try {
    res = await fetch(url, Object.assign({}, options, { headers }));
  } catch (e) {
    throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão.');
  }

  let data = {};
  try {
    data = await res.json();
  } catch (e) {
    data = {};
  }

  if (!res.ok) {
    // sessão expirada/token inválido -> manda de volta pro login
    if (res.status === 401) {
      logout();
    }
    throw new Error(data.error || 'Erro ao comunicar com o servidor.');
  }

  return data;
}
