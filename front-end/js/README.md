# front-end/js/

O JavaScript do site: **um arquivo por página**, mais o `comum.js`, que todas usam.

| Arquivo | Página | O que faz |
|---|---|---|
| `comum.js` | todas | `api()` (chama o back-end), `avisar()` (aviso rápido), `carregarAluno()` (nome, saldo e o que é de admin/mestre), botões Sair, `reais()`, `formatarData()`, `escapeHtml()`, `codigoPedido()` |
| `login.js` | `login.html` e `cadastro.html` | Envia o login e o cadastro |
| `cardapio.js` | `index.html` | Produtos, categorias e filtros; combos; carrinho (adicionar, remover, repetir, finalizar); aviso de pedido em andamento |
| `pedidos.js` | `pedidos.html` | Meus pedidos: em andamento e histórico; "Pedir de novo"; avaliação |
| `carteira.js` | `carteira.html` | Recarga de saldo |
| `conta.js` | `conta.html` | Editar dados e remover a conta |
| `admin.js` | `admin.html` | Pedidos (entregar e cancelar) e histórico; produtos (novo, editar, excluir, foto); alunos (tornar admin, excluir) |

## Como uma página carrega o JavaScript

No fim do `<body>`, sempre nesta ordem:

```html
<script src="https://cdn.jsdelivr.net/.../bootstrap.bundle.min.js" defer></script>
<script src="/front-end/js/comum.js" defer></script>
<script src="/front-end/js/cardapio.js" defer></script>
```

Com `defer`, os arquivos rodam **depois** que o HTML terminou de ser lido e **na ordem em que aparecem**. Por isso o arquivo da página já pode usar os elementos do HTML, o Bootstrap e as funções do `comum.js`.

## O padrão de uma chamada à API

Toda conversa com o back-end passa pela função `api()` do `comum.js`, que devolve `{ ok, dados }`:

```js
const { ok, dados } = await api("/carrinho/itens", "POST", { id_produto: 1, quantidade: 2 });
if (!ok) return avisar(dados.erro || "Não foi possível adicionar.", "erro");  // deu errado: mostra o erro do back-end
desenharCarrinho(dados);                                                        // deu certo: usa a resposta
```

- `ok` é `true` quando o back-end respondeu com sucesso (2xx).
- `dados` é a resposta em JSON. Quando dá errado, o back-end manda `{ "erro": "mensagem" }`.
- A única chamada que não usa `api()` é o envio da foto do produto (`enviarImagem` no `admin.js`), porque arquivo vai como `FormData`, não como JSON.

## O padrão de uma lista na tela

As listas (produtos, pedidos, alunos) são montadas assim: a API devolve uma lista, cada item vira um pedaço de HTML e tudo vai para o `innerHTML`:

```js
lista.innerHTML = produtos.map(cardProduto).join("");
```

- Texto que veio do usuário (nome, e-mail) passa pelo `escapeHtml()` antes de entrar no HTML.
- Os botões de cada item chamam uma função com o **id**: `onclick="editarProduto(5)"`. A função acha o resto dos dados na lista que já foi carregada.

## API usada por cada página

| Página | Rotas |
|---|---|
| login / cadastro | `POST /alunos/login`, `POST /alunos/registro` |
| todas (comum.js) | `GET /alunos/atual`, `POST /alunos/logout` |
| cardápio | `GET /produtos/buscar`, `GET /pedidos/combinacoes`, `GET /carrinho`, `POST /carrinho/itens`, `DELETE /carrinho/itens/<id>`, `POST /carrinho/repetir`, `POST /carrinho/finalizar`, `GET /pedidos/meus` |
| meus pedidos | `GET /pedidos/meus`, `POST /carrinho/repetir/<id>`, `POST /pedidos/<id>/avaliacao` |
| carteira | `POST /alunos/atual/recarga` |
| perfil | `PUT /alunos/atual`, `DELETE /alunos/atual` |
| admin | `GET /pedidos`, `POST /pedidos/<id>/concluir`, `POST /pedidos/<id>/cancelar`, `GET` `POST` `PUT` `DELETE /produtos`, `POST /produtos/<id>/imagem`, `GET /alunos`, `PUT` `DELETE /alunos/<id>` |

> **Atenção:** um erro de sintaxe num arquivo `.js` faz aquela página parar de funcionar. Depois de mexer, abra o console do navegador (F12) e confira se não há erros em vermelho.
