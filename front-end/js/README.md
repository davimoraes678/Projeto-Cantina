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

> **Atenção:** **Um erro no topo do arquivo derruba todas as páginas.** Um erro de sintaxe, ou uma função chamada com o nome errado dentro do `DOMContentLoaded` (ex.: `AlunoInf()` em vez de `alunoInf()`), impede que os formulários sejam ligados: eles passam a recarregar a página sem chamar a API. Depois de mexer, abra o console (F12) e confira se não há erros em vermelho.

## `API_BASE_URL`

```js
const API_BASE_URL = "/api";
```

Caminho relativo: a API é chamada no mesmo endereço da página. Funciona no `127.0.0.1:5000`, no Codespaces e em qualquer servidor, e é necessário para o cookie de login. Não troque por um endereço fixo.

## Funções por assunto

| Assunto | Funções | Rotas usadas |
|---|---|---|
| Login | listener de `#form-aluno-login`, `sair` (botões `.btn-logout`), `alunoInf()` (preenche todos os `data-aluno="nome\|primeiro-nome\|email\|saldo\|iniciais\|funcao"`) | `POST /alunos/login`, `POST /alunos/logout`, `GET /alunos/atual` |
| Carteira | listener de `#form-recarga`, `somarRecarga` (botões + R$ 5/10/20/50, até R$ 500) | `POST /alunos/atual/recarga` com `{valor}` |
| Alunos | listener de `#form-aluno`, `carregarAlunos`, `desenharListaAlunos`, `promoverAluno`, `excluirAluno`, listener de `#form-editar-aluno`, `removerAluno`, `funcaoPorAluno` | `POST /alunos/registro`, `GET /alunos`, `PUT` e `DELETE /alunos/<id>`, `PUT` e `DELETE /alunos/atual` |
| Produtos | listener de `#form-produto`, `enviarImagem`, `carregarProdutos`, `buscarProdutos`, `desenharCardsProdutos` (busca pelo nome sem chamar a API), `cardProduto`, `mudarQuantidade`, `desenharListaProdutosAdmin`, `filtrar`, `novoProduto`, `editarProduto` (os dois abrem a janela `#modal-produto`), `mostrarPreviaProduto`, `removerProduto` | `/produtos`, `/produtos/buscar`, `/produtos/<id>/imagem` |
| Carrinho | `adicionarItemAoCarrinho`, `removerItemDoCarrinho`, `carregarCarrinho`, `renderizarCarrinho`, `finalizarPedido`, `repetirUltimoPedido`, `atualizarAvisoSaldo` ("Saldo insuficiente") | `/carrinho`, `/carrinho/itens`, `/carrinho/finalizar`, `/carrinho/repetir` |
| Combinações | `carregarCombinacoes`, `adicionarCombinacao` | `GET /pedidos/combinacoes`, `POST /carrinho/itens` |
| Meus pedidos | `carregarMeusPedidos` (aviso no cardápio e as abas do `pedidos.html`), `cardPedidoAndamento`, `cardPedidoHistorico`, `pedirDeNovo` | `GET /pedidos/meus`, `POST /carrinho/repetir/<id>` |
| Pedidos (admin) | `carregarPedidos` (resumo do dia e a aba Pedidos, com `cardPedidoAdmin`), `desenharHistoricoAdmin` (aba Histórico, com filtro e busca), `abrirAba`, `concluirPedido` (botão Entregar), `cancelarPedido` (os dois usam `mudarPedido`) | `GET /pedidos`, `POST /pedidos/<id>/concluir`, `POST /pedidos/<id>/cancelar` |
| Avaliação | `verificarAvaliacao`, `abrirAvaliacao`, listener de `#form-avaliacao` | `GET /pedidos/<id>`, `POST /pedidos/<id>/avaliacao` |

**Como a avaliação chega ao aluno:** ao finalizar, o `finalizarPedido` guarda o número do pedido no navegador (`localStorage`, chave `pedidoParaAvaliar`). Ao abrir o cardápio, o `verificarAvaliacao` consulta esse pedido e, se estiver `Concluído` e ainda sem avaliação, abre a janela. Depois de avaliar (ou no logout) a chave é apagada. Em qualquer navegador, o aluno também pode avaliar pelo botão "Avaliar" do histórico em `pedidos.html`.
| Util | `avisar` (toast do Bootstrap no topo da tela), `icone` (ícone do Google Fonts), `reais` (12.5 → "R$ 12,50"), `dataLocal` e `formatarData` (UTC do back-end → horário local), `tempoDesde` ("há 5 min"), `escapeHtml`, `escapeAttr` | — |

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
