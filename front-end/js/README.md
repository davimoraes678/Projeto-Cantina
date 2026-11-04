# front-end/js/

O JavaScript do site: **um arquivo por página**, mais o `comum.js`, que todas usam.

| Arquivo | Página | O que faz |
|---|---|---|
| `comum.js` | todas | `API_BASE_URL`, `alunoInf()` (nome, saldo etc. do aluno logado), `funcaoPorAluno()` (mostra o que é de admin/mestre), botões Sair, `avisar()` (aviso verde), `formatarPreco()` e `escaparTexto()` |
| `login.js` | `login.html` e `cadastro.html` | Envia o login e o cadastro |
| `cardapio.js` | `index.html` | Produtos, janela de detalhes, categorias e filtros; combos; carrinho (adicionar, remover, repetir, finalizar); aviso de pedido em andamento |
| `pedidos.js` | `pedidos.html` | Meus pedidos: em andamento e histórico; "Pedir de novo"; avaliação |
| `carteira.js` | `carteira.html` | Recarga de saldo |
| `conta.js` | `conta.html` | Editar dados e remover a conta |
| `admin.js` | `admin.html` | Pedidos (pronto, entregar, cancelar) e histórico; produtos (novo, editar, excluir, foto); alunos (tornar admin, excluir) |

## Como uma página carrega o JavaScript

No fim do `<body>`, sempre nesta ordem:

```html
<script src="https://cdn.jsdelivr.net/.../bootstrap.bundle.min.js" defer></script>
<script src="/front-end/js/comum.js" defer></script>
<script src="/front-end/js/cardapio.js" defer></script>
```

Com `defer`, os arquivos rodam **depois** que o HTML terminou de ser lido e **na ordem em que aparecem**. Por isso o arquivo da página já pode usar os elementos do HTML, o Bootstrap e as funções do `comum.js`.

## O padrão de uma chamada à API

Toda função que fala com o back-end segue o mesmo modelo:

```js
async function removerItemDoCarrinho(id_item_pedido) {
  try {
    const res = await fetch(`${API_BASE_URL}/carrinho/itens/${id_item_pedido}`, { method: "DELETE" });
    const dados = await res.json();          // lê a resposta (JSON) como objeto
    if (!res.ok) {                           // deu errado (o back-end respondeu com erro)
      alert(dados.erro || "Não foi possível remover o item.");
      return;
    }
    renderizarCarrinho(dados);               // deu certo: usa a resposta
  } catch (erro) {
    console.error("Erro ao remover item:", erro);   // erro de rede: aparece no console (F12)
  }
}
```

- `res.ok` é `true` quando o back-end respondeu com sucesso (2xx).
- Quando dá errado, o back-end manda `{ "erro": "mensagem" }`, que aparece num `alert`. Quando dá certo, algumas ações mostram o aviso verde com `avisar("...")`.
- Para enviar dados (POST/PUT), a chamada leva `headers: { "Content-Type": "application/json" }` e `body: JSON.stringify({...})`.
- A foto do produto é a exceção: vai como `FormData` (formulário com arquivo), não como JSON (`enviarImagem` no `admin.js`).

## O padrão de uma lista na tela

A API devolve uma lista, o `forEach` junta o HTML de cada item numa variável, e no fim ela vai para a tela:

```js
let html = "";
produtos.forEach((produto) => {
  html += cardProduto(produto);   // junta o texto (ainda não mexe na tela)
});
lista.innerHTML = html;           // escreve na tela uma vez só
```

- Juntar numa variável e escrever **uma vez só** é mais rápido do que fazer `lista.innerHTML +=` dentro do `forEach`: a cada `+=`, o navegador apaga e redesenha a lista inteira (inclusive as fotos).
- Texto que veio do usuário (nome, e-mail, nome do produto) passa pelo `escaparTexto()` antes de entrar no HTML.
- Os botões de cada item chamam uma função com o **id**: `onclick="editarProduto(5)"`. A função acha o resto dos dados na lista que já foi carregada, com `produtos.find(...)`.

## Dados do aluno nas páginas

O `alunoInf()` do `comum.js` preenche os elementos pelas classes:

| Classe no HTML | Mostra |
|---|---|
| `nome-aluno` | Davi Moraes |
| `primeiro-nome-aluno` | Davi |
| `iniciais-aluno` | DM |
| `email-aluno` | davi@... |
| `saldo-aluno` | R$ 136,50 |
| `funcao-aluno` | mestre |

Exemplo: `<span class="saldo-aluno">R$ 0,00</span>` mostra o saldo. Pode haver vários na mesma página (no topo e no carrinho, por exemplo).

## API usada por cada página

| Página | Rotas |
|---|---|
| login / cadastro | `POST /alunos/login`, `POST /alunos/registro` |
| todas (comum.js) | `GET /alunos/atual`, `POST /alunos/logout` |
| cardápio | `GET /produtos/buscar`, `GET /pedidos/combinacoes`, `GET /carrinho`, `POST /carrinho/itens`, `DELETE /carrinho/itens/<id>`, `POST /carrinho/repetir`, `POST /carrinho/finalizar`, `GET /pedidos/meus` |
| meus pedidos | `GET /pedidos/meus`, `POST /carrinho/repetir/<id>`, `POST /pedidos/<id>/avaliacao` |
| carteira | `POST /alunos/atual/recarga` |
| perfil | `PUT /alunos/atual`, `DELETE /alunos/atual` |
| admin | `GET /pedidos`, `POST /pedidos/<id>/pronto`, `POST /pedidos/<id>/concluir`, `POST /pedidos/<id>/cancelar`, `GET` `POST` `PUT` `DELETE /produtos`, `POST /produtos/<id>/imagem`, `GET /alunos`, `PUT` `DELETE /alunos/<id>` |

> **Atenção:** um erro de sintaxe num arquivo `.js` faz aquela página parar de funcionar. Depois de mexer, abra o console do navegador (F12) e confira se não há erros em vermelho.
