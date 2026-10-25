# front-end/js/

| Arquivo | O que faz |
|---|---|
| `alunos.js` | Todo o JavaScript do sistema: login, alunos, produtos, carrinho e pedidos. É carregado por **todas** as páginas |

## Como um arquivo atende todas as páginas

No evento `DOMContentLoaded`, o arquivo chama as funções de carregamento (`carregarProdutos`, `carregarCarrinho`, `carregarPedidos`, `alunoInf`...) e liga os formulários. Cada função **confere se os elementos dela existem** antes de agir:

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

## Funções por assunto

| Assunto | Funções | Rotas usadas |
|---|---|---|
| Login | listener de `#form-aluno-login`, listener de `#btn-logout`, `alunoInf()` (nome, e-mail e saldo) | `POST /alunos/login`, `POST /alunos/logout`, `GET /alunos/atual` |
| Carteira | listener de `#form-recarga`, `somarRecarga` (botões + R$ 5/10/20, até R$ 500) | `POST /alunos/atual/recarga` com `{valor}` |
| Alunos | listener de `#form-aluno`, `carregarAlunos`, `promoverAluno`, `excluirAluno`, `editarDados`, `removerAluno`, `funcaoPorAluno` | `POST /alunos/registro`, `GET /alunos`, `PUT` e `DELETE /alunos/<id>`, `PUT` e `DELETE /alunos/atual` |
| Produtos | listener de `#form-produto`, `enviarImagem`, `carregarProdutos`, `buscarProdutos`, `filtrar`, `editarProduto`, `sairModoEdicaoProduto`, `removerProduto` | `/produtos`, `/produtos/buscar`, `/produtos/<id>/imagem` |
| Carrinho | `adicionarItemAoCarrinho`, `removerItemDoCarrinho`, `carregarCarrinho`, `renderizarCarrinho`, `finalizarPedido`, `repetirUltimoPedido`, `avisarCarrinho` (toast "adicionado ao carrinho") | `/carrinho`, `/carrinho/itens`, `/carrinho/finalizar`, `/carrinho/repetir` |
| Combinações | `carregarCombinacoes`, `adicionarCombinacao` | `GET /pedidos/combinacoes`, `POST /carrinho/itens` |
| Pedidos | `carregarPedidos` (no `admin.html` mostra os em andamento; no `historico.html`, marcado com `data-historico="sim"`, os concluídos e cancelados), `concluirPedido`, `cancelarPedido` (os dois usam `mudarPedido`) | `GET /pedidos`, `POST /pedidos/<id>/concluir`, `POST /pedidos/<id>/cancelar` |
| Avaliação | `verificarAvaliacao`, listener de `#form-avaliacao` | `GET /pedidos/<id>`, `POST /pedidos/<id>/avaliacao` |

**Como a avaliação chega ao aluno:** ao finalizar, o `finalizarPedido` guarda o número do pedido no navegador (`localStorage`, chave `pedidoParaAvaliar`). Ao abrir o `index.html`, o `verificarAvaliacao` consulta esse pedido e, se estiver `Concluído`, abre a janela. Depois de avaliar (ou no logout) a chave é apagada. A janela só aparece no navegador onde o pedido foi feito.
| Util | `escapeAttr` | — |

**O formulário `#form-aluno` faz duas coisas.** Com `editandoAlunoId = null`, ele **cadastra** (`POST /alunos/registro`) e leva para `/`. Com um número, ele **edita** no admin (`PUT /alunos/<id>`). O formulário de produto funciona igual, com `editandoProdutoId`.

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

## Convenções de nomes

- `camelCase` para funções e variáveis (`carregarCarrinho`, `pedidosCache`).
- Sufixo `El` para variáveis que guardam um elemento do HTML (`totalEl`, `nomeEl`), para diferenciar dos dados.

## Pontos a melhorar

- `enviarImagem` está definida duas vezes (uma dentro do `DOMContentLoaded` e outra global); a de dentro é a usada ao salvar o produto.
- Dados vindos da API são colocados com `innerHTML` sem escapar HTML; um nome com `<script>` seria executado. O `escapeAttr` só trata aspas simples.
