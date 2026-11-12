# front-end/js/

Um arquivo por página, mais o `comum.js`, que todas usam.

| Arquivo | Página | O que faz |
|---|---|---|
| `comum.js` | todas | `alunoInf()` (dados do aluno logado), `funcaoPorAluno()` (mostra o que é de admin e mestre), botão Sair, `avisar()`, `formatarPreco()` e `escaparTexto()` |
| `login.js` | `login.html` e `cadastro.html` | Login e cadastro |
| `cardapio.js` | `index.html` | Produtos, detalhes, filtros, combos, carrinho e aviso de pedido em andamento |
| `pedidos.js` | `pedidos.html` | Meus pedidos, "Pedir de novo" e avaliação |
| `carteira.js` | `carteira.html` | Recarga de saldo |
| `conta.js` | `conta.html` | Editar dados e excluir a conta |
| `admin.js` | `admin.html` | Pedidos (pronto, entregar, cancelar), histórico, produtos e alunos |

Cada página carrega, no fim do `<body>`, o Bootstrap, o `comum.js` e o arquivo dela, todos com `defer`, que roda os arquivos na ordem depois que o HTML carregou.

## Uma chamada à API

Toda função que fala com o back-end segue o mesmo modelo:

```js
async function removerItemDoCarrinho(id_item_pedido) {
  try {
    const res = await fetch(`${API_BASE_URL}/carrinho/itens/${id_item_pedido}`, { method: "DELETE" });
    const dados = await res.json();
    if (!res.ok) {
      alert(dados.erro || "Não foi possível remover o item.");
      return;
    }
    renderizarCarrinho(dados);
  } catch (erro) {
    console.error("Erro ao remover item:", erro);
  }
}
```

- `res.ok` é `true` quando o back-end respondeu com sucesso.
- Em caso de erro, o back-end manda `{ "erro": "mensagem" }`, que aparece num `alert`. Em caso de sucesso, o `avisar("...")` mostra um aviso verde.
- Para enviar dados, a chamada leva `headers: { "Content-Type": "application/json" }` e `body: JSON.stringify({...})`. A foto do produto é a exceção: vai como `FormData`.

## Uma lista na tela

```js
let html = "";
produtos.forEach((produto) => {
  html += cardProduto(produto);
});
lista.innerHTML = html;
```

- O HTML é montado numa variável e vai para a tela uma vez só, o que é mais rápido do que usar `innerHTML +=` dentro do `forEach`.
- Texto digitado pelo usuário passa pelo `escaparTexto()` antes de entrar no HTML.
- Os botões chamam uma função com o id (`onclick="editarProduto(5)"`), e a função acha o produto na lista já carregada com `produtos.find(...)`.

## Busca e "Ver mais"

O Histórico, os Produtos, os Alunos e as Avaliações do admin, e o Histórico de Meus pedidos, mostram 10 itens por vez. Cada lista tem uma variável com o limite (`limiteAlunos = 10`) e uma função `mostrar...()`:

```js
function mostrarAlunos() {
  const busca = paraBusca(document.getElementById("busca-alunos").value);
  const encontrados = alunos.filter((aluno) => paraBusca(aluno.nome + " " + aluno.email).includes(busca));
  // monta o HTML só de encontrados.slice(0, limiteAlunos)
  // e esconde o "Ver mais" quando não sobra nenhum
}
```

- O campo de busca chama `limiteAlunos = 10; mostrarAlunos()` a cada letra digitada.
- O "Ver mais" chama `limiteAlunos += 10; mostrarAlunos()`.
- O `paraBusca()` do `comum.js` tira maiúsculas e acentos, então "agua" encontra "Água".
- A busca é feita na lista que já foi carregada, sem chamar o back-end de novo.

## Dados do aluno

O `alunoInf()` preenche os elementos pelas classes `nome-aluno`, `email-aluno`, `saldo-aluno` e `funcao-aluno`. Exemplo: `<span class="saldo-aluno">R$ 0,00</span>` mostra o saldo.

## Rotas usadas por página

| Página | Rotas |
|---|---|
| login / cadastro | `POST /alunos/login`, `POST /alunos/registro` |
| todas | `GET /alunos/atual`, `POST /alunos/logout` |
| cardápio | `GET /produtos/buscar`, `GET /pedidos/combinacoes`, `GET /carrinho`, `POST /carrinho/itens`, `DELETE /carrinho/itens/<id>`, `POST /carrinho/repetir`, `POST /carrinho/finalizar`, `GET /pedidos/meus` |
| meus pedidos | `GET /pedidos/meus`, `POST /carrinho/repetir/<id>`, `POST /pedidos/<id>/avaliacao` |
| carteira | `POST /alunos/atual/recarga` |
| perfil | `PUT /alunos/atual`, `DELETE /alunos/atual` |
| admin | `GET /pedidos`, `POST /pedidos/<id>/pronto`, `POST /pedidos/<id>/concluir`, `POST /pedidos/<id>/cancelar`, `/produtos` (GET, POST, PUT, DELETE), `POST /produtos/<id>/imagem`, `GET /alunos`, `PUT` e `DELETE /alunos/<id>` |
