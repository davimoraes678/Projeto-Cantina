# backend/controllers/

Os controllers definem as **rotas da API**: a URL, o método HTTP e, se for o caso, o `@login_required`. Eles só leem a requisição, chamam o [service](../services/README.md) e devolvem JSON; não têm regra de negócio.

Cada arquivo é um `Blueprint` com um prefixo de URL, registrado em [`backend/routes.py`](../routes.py).

| Arquivo | Prefixo | Assunto |
|---|---|---|
| `aluno_controller.py` | `/api/alunos` | Cadastro, login, logout, aluno atual, CRUD de alunos |
| `produto_controller.py` | `/api/produtos` | CRUD de produtos, busca e imagem |
| `item_pedido_controller.py` | `/api/carrinho` | Carrinho do aluno logado |
| `pedido_controller.py` | `/api/pedidos` | Listar, consultar e atualizar pedidos |

## Referência das rotas

Todas usam JSON. Erros vêm como `{"erro": "mensagem"}`. **🔒 = exige login**; sem login, respondem `401` com `{"erro": "Faça login para continuar."}`. A rota `GET /api` lista tudo o que está registrado.

### `aluno_controller.py` — `/api/alunos`

| Método | Rota | | Corpo | Respostas |
|---|---|---|---|---|
| `POST` | `/registro` | | `{nome, email, senha}` | `201` cadastrado **e logado** · `400` faltou campo · `409` e-mail já existe |
| `POST` | `/login` | | `{email, senha}` | `200` logado · `400` faltou campo · `401` e-mail ou senha errados |
| `POST` | `/logout` | 🔒 | — | `200` |
| `GET` | `/atual` | 🔒 | — | `200` aluno logado |
| `PUT` | `/atual` | 🔒 | `{nome?, email?, senha?, recarga?}`. `recarga` soma ao saldo (carteira) | `200` · `400` recarga fora de R$ 0,01 a R$ 500,00 |
| `GET` | `` (raiz) | só mestre | — | `200` lista de alunos · `403` |
| `PUT` | `/<id>` | | `{nome?, email?, senha?}` (senha vazia mantém a atual) | `200` · `404` |
| `DELETE` | `/<id>` | só mestre | — | `200` · `403` · `404` |

Formato de um aluno: `{ "id_aluno": 1, "nome": "Ana", "email": "ana@email.com", "saldo": 0.0 }`. A senha nunca é devolvida.

### `produto_controller.py` — `/api/produtos`

| Método | Rota | O que faz |
|---|---|---|
| `GET` | `` (raiz) | Lista todos |
| `GET` | `/buscar?categoria=&preco_min=&preco_max=&ordenar=nome\|preco` | Busca com filtros (todos opcionais) |
| `GET` | `/<id>` | Um produto (`404` se não existir) |
| `POST` | `` (raiz) | Cria. `nome` e `preco_atual` obrigatórios (`400`); opcionais `quantidade_estoque`, `categoria`, `preco_promocional`, `ingredientes`, `tabela_nutricional`, `status`. Responde `201` |
| `PUT` | `/<id>` | Edita só os campos enviados |
| `DELETE` | `/<id>` | Exclui (os pedidos antigos mantêm o nome do produto) |
| `POST` | `/<id>/imagem` | Upload `multipart/form-data`, campo `imagem`. PNG, JPG ou WEBP até 5 MB |
| `GET` | `/<id>/imagem` | Devolve a imagem (PNG), ou `404` |

Formato: `{ "id_produto", "nome", "quantidade_estoque", "preco_atual", "preco_promocional", "categoria", "status", "imagem" }`. Categorias usadas no front: `Bebida`, `Lanche` (exibido como "Salgado") e `Doce`.

### `item_pedido_controller.py` — `/api/carrinho` 🔒

Todas as rotas usam o **aluno logado** (`current_user`), então nenhuma recebe `id_aluno`. Cada aluno só vê e altera o próprio carrinho.

| Método | Rota | Corpo | Respostas |
|---|---|---|---|
| `GET` | `` (raiz) | — | `200` carrinho (vazio se ainda não existir) |
| `POST` | `/itens` | `{id_produto, quantidade}` | `201` carrinho atualizado (soma se o produto já estiver) · `400` quantidade inválida · `404` produto |
| `DELETE` | `/itens/<id_item_pedido>` | — | `200` · `404` se o item não for do carrinho do aluno |
| `POST` | `/repetir` | — | `201` carrinho com os itens do último pedido somados · `404` se não houver pedido anterior |
| `POST` | `/finalizar` | — | `200` pedido agora `"Pendente"`, estoque e saldo descontados · `400` carrinho vazio, estoque ou saldo insuficiente |

Formato do carrinho (igual ao de um pedido):

```json
{
  "id_pedido": 3, "status": "Carrinho", "valor_total": 17.5,
  "id_aluno": 1, "aluno_nome": "Ana",
  "data_hora_criacao": "2026-10-13T10:00:00",
  "horario_agendado_retirada": null, "data_hora_retirada": null,
  "itens": [
    { "id_item_pedido": 5, "id_produto": 1, "produto_nome": "Suco de Laranja",
      "quantidade": 2, "preco_unitario_cobrado": 5.0, "subtotal": 10.0, "id_pedido": 3 }
  ]
}
```

### `pedido_controller.py` — `/api/pedidos`

| Método | Rota | | O que faz |
|---|---|---|---|
| `GET` | `` (raiz) | | Lista os pedidos (**sem** os carrinhos em aberto) |
| `GET` | `/combinacoes` | 🔒 | As 3 duplas de produtos mais pedidas juntas: `[{produtos: [{id_produto, nome}, ...], vezes}]` |
| `GET` | `/<id>` | | Um pedido |
| `PUT` | `/<id>` | admin ou mestre | `{status?, horario_agendado_retirada?, data_hora_retirada?}`. Status do front: `Pendente`, `Em Preparo`, `Pronto`, `Concluído`, `Cancelado`. Datas em `AAAA-MM-DDTHH:MM` |
| `POST` | `/<id>` | 🔒 | Avalia o pedido: `{nota, comentario?}`. Só o dono do pedido, uma vez (`404` / `400`) |
| `POST` | `` (raiz) | 🔒 | Cria um pedido direto, sem carrinho: `{itens: [{id_produto, quantidade}]}` (o front não usa) |

## Ao criar uma rota

- Os nomes entre `< >` na URL precisam ser parâmetros da função (`/<int:id_aluno>` → `def f(id_aluno)`), senão dá `TypeError`.
- Leia o corpo com `request.get_json(silent=True) or {}`, que não quebra se o corpo vier vazio.
- Registre o blueprint novo em `routes.py`, acrescente a rota no `GET /api` (`app.py`) e nesta tabela.
