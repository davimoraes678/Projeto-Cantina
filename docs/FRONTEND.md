# Front-end

HTML, CSS e JavaScript puro, sem framework. As páginas ficam em `front-end/` e são servidas pelo Flask em `/front-end/...` (o `index.html` também em `/`).

## Páginas

| Página | Endereço | Login | Para quê |
|---|---|---|---|
| `index.html` | `/` | Sim (sem login, vai para o cadastro) | Cantina: produtos, filtros, carrinho e pedidos |
| `login.html` | `/front-end/login.html` | | Entrar |
| `cadastro.html` | `/front-end/cadastro.html` | | Criar conta |
| `admin.html` | `/front-end/admin.html` | | Cadastrar/editar alunos e produtos (com imagem) |

> **Caminhos:** use sempre caminhos que começam com `/` (ex.: `/front-end/css/style.css`). O `index.html` é aberto em `/`, então um caminho relativo como `css/style.css` viraria `/css/style.css` e daria 404.

## `js/alunos.js`

Um único arquivo atende **todas** as páginas. Ele é carregado no fim de cada HTML e, no evento `DOMContentLoaded`, chama as funções de carregamento e liga os formulários.

Cada função **confere se os elementos dela existem na página** antes de agir (`if (!tabela) return;`, `if (formLogin) {...}`). É isso que permite o mesmo arquivo rodar no login, que não tem tabela de produtos, e na cantina, que não tem formulário de login.

> ⚠️ **Um erro no topo do arquivo derruba todas as páginas.** Um erro de sintaxe (ex.: `await` fora de uma função `async`) ou uma função chamada com o nome errado dentro do `DOMContentLoaded` impede que os formulários sejam ligados, e eles passam a recarregar a página sem chamar a API. Depois de mexer no arquivo, abra o console do navegador (F12) e confira se não há erros em vermelho.

### `API_BASE_URL`

```js
const API_BASE_URL = "/api";
```
Caminho relativo: a API é chamada no mesmo endereço da página. Funciona no `127.0.0.1:5000`, no Codespaces e em qualquer servidor, e é necessário para o cookie de login (veja [LOGIN.md](LOGIN.md)).

### Funções por assunto

| Assunto | Funções | Rotas usadas |
|---|---|---|
| Login | listener do `#form-aluno-login`, listener do `#btn-logout`, `alunoInf()` | `POST /alunos/login`, `POST /alunos/logout`, `GET /alunos/atual` |
| Alunos | listener do `#form-aluno` (cadastro e edição), `carregarAlunos`, `editarAluno`, `sairModoEdicaoAluno`, `removerAluno` | `POST /alunos/registro`, `GET /alunos`, `PUT /alunos/<id>`, `DELETE /alunos/<id>` |
| Produtos | listener do `#form-produto`, `enviarImagem`, `carregarProdutos`, `buscarProdutos`, `filtrar`, `editarProduto`, `sairModoEdicaoProduto`, `removerProduto` | `/produtos`, `/produtos/buscar`, `/produtos/<id>/imagem` |
| Carrinho | `adicionarItemAoCarrinho`, `removerItemDoCarrinho`, `carregarCarrinho`, `renderizarCarrinho`, `finalizarPedido` | `/carrinho`, `/carrinho/itens`, `/carrinho/finalizar` |
| Pedidos | `carregarPedidos`, `editarPedido`, `fecharEdicaoPedido`, `salvarEdicaoPedido`, `concluirPedido` | `GET /pedidos`, `PUT /pedidos/<id>` |
| Util | `escapeAttr` | — |

### O formulário `#form-aluno` faz duas coisas

A variável `editandoAlunoId` decide o modo:
- `null` → **cadastro** (`POST /alunos/registro`); depois de cadastrar, leva para `/`.
- um número → **edição** no admin (`PUT /alunos/<id>`); senha em branco mantém a atual.

O formulário de produto funciona igual, com `editandoProdutoId`.

### Padrão de uma chamada à API

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
} catch (erro) {                          // servidor fora do ar, sem rede
    console.error(erro);
    alert("Ocorreu um erro...");
}
```

Lembre do `await` antes de `fetch`, `res.json()` e de qualquer função `async` (ex.: `await carregarCarrinho()`); sem ele, você recebe uma *Promise* em vez do valor.

## Pontos a melhorar

- `enviarImagem` está definida duas vezes no `alunos.js` (uma dentro do `DOMContentLoaded` e outra global). A de dentro é a usada ao salvar o produto.
- O `index.html` tem um `<p id="aluno">` que nenhum código usa.
- Dados vindos da API (nomes, e-mails) são colocados com `innerHTML` sem escapar HTML; um nome com `<script>` seria executado. O `escapeAttr` só trata aspas simples.
