# front-end/js/

| Arquivo | O que faz |
|---|---|
| `alunos.js` | Todo o JavaScript do sistema: login, conta, produtos, carrinho, pedidos e avaliação. É carregado por **todas** as páginas |

## Como um arquivo atende todas as páginas

No evento `DOMContentLoaded`, o arquivo primeiro **liga os formulários e botões** que existirem na página e depois chama as funções de carregamento (`alunoInf`, `carregarCategorias`, `carregarProdutos`, `carregarPedidos`, `carregarCarrinho`). Cada função **confere se os elementos dela existem** antes de agir (e antes de chamar a API):

```js
const tabela = document.getElementById("tabela-carrinho");
if (!tabela) return;          // esta página não tem carrinho: não faz nada
```

É isso que permite o mesmo arquivo rodar no login, que não tem produtos, e na cantina, que não tem formulário de login.

> ⚠️ **Um erro no topo do arquivo derruba todas as páginas.** Um erro de sintaxe, ou uma função chamada com o nome errado dentro do `DOMContentLoaded` (ex.: `AlunoInf()` em vez de `alunoInf()`), impede que os formulários sejam ligados: eles passam a recarregar a página sem chamar a API. Depois de mexer, abra o console (F12) e confira se não há erros em vermelho.

## `API_BASE_URL`

```js
const API_BASE_URL = "/api";
```

Caminho relativo: a API é chamada no mesmo endereço da página. Funciona no `127.0.0.1:5000`, no Codespaces e em qualquer servidor, e é necessário para o cookie de login. Não troque por um endereço fixo.

## Variáveis globais

| Variável | Para quê |
|---|---|
| `alunoAtual` | O aluno logado (preenchido por `alunoInf`); a lista de pedidos usa para saber quais pedidos são dele |
| `produtosCache` | Produtos da última busca; `editarProduto(id)` procura o produto aqui |
| `pedidosCache` | Pedidos da última busca; `editarPedido(id)` procura o pedido aqui |
| `editandoProdutoId` | Id do produto em edição (`null` = o formulário está em modo "cadastrar") |

## Funções por assunto

| Assunto | Funções | Rotas usadas |
|---|---|---|
| Login | listener de `#form-aluno-login`, `realizarLogout`, `alunoInf` (nome no topo) | `POST /alunos/login`, `POST /alunos/logout`, `GET /alunos/atual` |
| Conta | listener de `#form-aluno` (cadastro), `editarDados`, `removerAluno` | `POST /alunos/registro`, `PUT` e `DELETE /alunos/atual` |
| Categorias | `carregarCategorias`, `filtrar` | `GET /produtos/categorias` |
| Produtos | listener de `#form-produto`, `enviarImagem`, `carregarProdutos`, `buscarProdutos`, `renderizarCardsProdutos`, `renderizarTabelaProdutos`, `editarProduto`, `sairModoEdicaoProduto`, `removerProduto` | `/produtos`, `/produtos/buscar`, `/produtos/<id>/imagem` |
| Carrinho | `adicionarItemAoCarrinho`, `removerItemDoCarrinho`, `carregarCarrinho`, `renderizarCarrinho`, `finalizarPedido` | `/carrinho`, `/carrinho/itens`, `/carrinho/finalizar` |
| Pedidos | `carregarPedidos`, `editarPedido`, `fecharEdicaoPedido`, `salvarEdicaoPedido`, `concluirPedido` | `GET /pedidos`, `PUT /pedidos/<id>` |
| Avaliação | `abrirAvaliacao`, `enviarAvaliacao` | `POST /pedidos/<id>/avaliacao` |
| Util | `escapeHtml`, `formatarMoeda` | — |

**O formulário `#form-produto` faz duas coisas.** Com `editandoProdutoId = null`, ele **cadastra** (`POST /produtos`). Com um número, ele **edita** (`PUT /produtos/<id>`). Se o upload da imagem falhar, o produto já foi salvo e o formulário continua em modo de edição, para tentar de novo sem duplicar o produto.

## Padrão de uma chamada à API

```js
try {
    const res = await fetch(`${API_BASE_URL}/carrinho/itens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_produto, quantidade })
    });
    const dados = await res.json();
    if (!res.ok) {                       // 400, 401, 404...
        alert(dados.erro || "Mensagem padrão");
        return;
    }
    renderizarCarrinho(dados);           // deu certo
} catch (erro) {                          // servidor fora do ar
    console.error(erro);
}
```

- Use `await` antes de `fetch`, `res.json()` e de qualquer função `async`; sem ele, você recebe uma *Promise* em vez do valor.
- `await` só funciona **dentro** de uma `async function`; solto no arquivo, ele quebra o script inteiro.

## Texto da API dentro do HTML

Nome de produto, ingredientes, nome de aluno e os outros textos vindos da API passam por `escapeHtml(...)` antes de entrar num `innerHTML`; sem isso, um nome como `<script>...` seria executado (XSS). Os `onclick` dos botões recebem **só números** (ids), nunca texto da API.

## Convenções de nomes

- `camelCase` para funções e variáveis (`carregarCarrinho`, `pedidosCache`).
- Sufixo `El` para variáveis que guardam um elemento do HTML (`totalEl`, `nomeEl`), para diferenciar dos dados.

## Pontos a melhorar

- O arquivo faz tudo para todas as páginas (e funções de administração rodam em páginas de aluno). Será dividido em módulos na Fase 4.
- Os `onclick` inline ainda existem (só com ids); a Fase 4 troca por `data-*` e delegação de eventos.
- Os avisos ainda usam `alert()`; a Fase 4 troca por toasts do Bootstrap.
