# backend/controllers/

Os controllers definem as **rotas da API**: a URL, o método HTTP e, se for o caso, o `@login_required`. Eles só leem a requisição, chamam o [service](../services/README.md) e devolvem JSON; não têm regra de negócio.

Cada arquivo é um `Blueprint` com um prefixo de URL, registrado em [`backend/routes.py`](../routes.py).

| Arquivo | Prefixo | Assunto |
|---|---|---|
| `aluno_controller.py` | `/api/alunos` | Cadastro, login, logout e a conta do aluno logado |
| `produto_controller.py` | `/api/produtos` | CRUD de produtos, busca e imagem |
| `item_pedido_controller.py` | `/api/carrinho` | Carrinho do aluno logado |
| `pedido_controller.py` | `/api/pedidos` | Listar, consultar, atualizar e avaliar pedidos |

## Referência das rotas

Todas usam JSON. Erros vêm como `{"erro": "mensagem"}`. **🔒 = exige login**; sem login, respondem `401` com `{"erro": "Faça login para continuar."}`. A rota `GET /api` lista tudo o que está registrado.

### `aluno_controller.py` — `/api/alunos`

| Método | Rota | | Corpo | Respostas |
|---|---|---|---|---|
| `POST` | `/registro` | | `{nome, email, senha}` | `201` cadastrado **e logado** · `400` faltou campo · `409` e-mail já existe |
| `POST` | `/login` | | `{email, senha}` | `200` logado · `400` faltou campo · `401` e-mail ou senha errados |
| `POST` | `/logout` | 🔒 | — | `200` |
| `GET` | `/atual` | 🔒 | — | `200` aluno logado |
| `PUT` | `/atual` | 🔒 | `{nome?, email?, senha?}` (senha vazia mantém a atual) | `200` · `409` e-mail já existe |
| `DELETE` | `/atual` | 🔒 | — | `200`. Os pedidos ficam no histórico; o carrinho em aberto é apagado |

Não existe mais listagem de alunos nem exclusão por id: toda ação sobre a conta usa o aluno logado (`/atual`).

Formato de um aluno: `{ "id_aluno": 1, "nome": "Ana", "email": "ana@email.com", "saldo": 0.0 }`. A senha nunca é devolvida.

### `produto_controller.py` — `/api/produtos`

| Método | Rota | O que faz |
|---|---|---|
| `GET` | `` (raiz) | Lista todos |
| `GET` | `/categorias` | Lista de categorias aceitas (`["Bebida", "Salgado", "Doce"]`); o front monta filtros e formulários com ela |
| `GET` | `/buscar?categoria=&preco_min=&preco_max=&ordenar=nome\|preco&ativos=1` | Busca com filtros (todos opcionais e **combináveis**; `ativos=1` esconde os indisponíveis). `400` se a categoria, a ordenação ou os preços forem inválidos |
| `GET` | `/<id>` | Um produto (`404` se não existir) |
| `POST` | `` (raiz) | Cria. `nome` e `preco_atual` obrigatórios (`400`); opcionais `quantidade_estoque`, `categoria` (uma de `/categorias`), `preco_promocional`, `ingredientes`, `tabela_nutricional`, `status`. Responde `201` |
| `PUT` | `/<id>` | Edita só os campos enviados (mesmos campos do `POST`) |
| `DELETE` | `/<id>` | Exclui, e apaga o arquivo da imagem (os pedidos antigos mantêm o nome do produto) |
| `POST` | `/<id>/imagem` | Upload `multipart/form-data`, campo `imagem`. PNG, JPG ou WEBP até 5 MB |
| `GET` | `/<id>/imagem` | Devolve a imagem (PNG), ou `404` |

Formato: `{ "id_produto", "nome", "quantidade_estoque", "preco_atual", "preco_promocional", "categoria", "status", "ingredientes", "tabela_nutricional", "imagem_url" }`. `imagem_url` é o endereço da imagem, ou `null` se o produto ainda não tem uma. As categorias vêm da constante `CATEGORIAS` (`backend/constantes.py`): `Bebida`, `Salgado` e `Doce`.

### `item_pedido_controller.py` — `/api/carrinho` 🔒

Todas as rotas usam o **aluno logado** (`current_user`), então nenhuma recebe `id_aluno`. Cada aluno só vê e altera o próprio carrinho.

| Método | Rota | Corpo | Respostas |
|---|---|---|---|
| `GET` | `` (raiz) | — | `200` carrinho (vazio se ainda não existir) |
| `POST` | `/itens` | `{id_produto, quantidade}` | `201` carrinho atualizado (soma se o produto já estiver) · `400` quantidade inválida · `404` produto |
| `DELETE` | `/itens/<id_item_pedido>` | — | `200` · `404` se o item não for do carrinho do aluno |
| `POST` | `/finalizar` | — | `200` pedido agora `"Pendente"` · `400` carrinho vazio |

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
| `GET` | `/<id>` | | Um pedido |
| `PUT` | `/<id>` | | `{status?, horario_agendado_retirada?, data_hora_retirada?}`. Status do front: `Pendente`, `Em Preparo`, `Pronto`, `Concluído`, `Cancelado`. Datas em `AAAA-MM-DDTHH:MM` |
| `POST` | `/<id>/avaliacao` | 🔒 | `{nota, comentario?}`. Só o dono do pedido, só pedido `Concluído`, uma vez. `201` · `400` nota fora de 1 a 5 (inteira) ou pedido não concluído · `404` pedido de outro aluno · `409` já avaliado |

Os pedidos trazem `"avaliado": true/false`. Não existe mais `POST /api/pedidos` (criar pedido sem carrinho): todo pedido nasce do carrinho.

## Ao criar uma rota

- Os nomes entre `< >` na URL precisam ser parâmetros da função (`/<int:id_aluno>` → `def f(id_aluno)`), senão dá `TypeError`.
- Leia o corpo com `request.get_json(silent=True) or {}`, que não quebra se o corpo vier vazio.
- Registre o blueprint novo em `routes.py`, acrescente a rota no `GET /api` (`app.py`) e nesta tabela.
