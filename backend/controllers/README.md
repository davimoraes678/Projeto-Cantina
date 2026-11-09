# backend/controllers/

Um arquivo por recurso, com **uma função por rota**. A função lê a requisição, chama o [service](../services/README.md) e devolve JSON. Nenhuma regra de negócio fica aqui.

| Arquivo | Blueprint | Recurso (Model) | Prefixo |
|---|---|---|---|
| `aluno_controller.py` | `bp_aluno` | `Aluno` | `/api/alunos` |
| `produto_controller.py` | `bp_produto` | `Produto` | `/api/produtos` |
| `item_pedido_controller.py` | `bp_item_pedido` | `ItemPedido` (carrinho) | `/api/carrinho` |
| `pedido_controller.py` | `bp_pedido` | `Pedido` | `/api/pedidos` |
| `avaliacao_controller.py` | `bp_avaliacao` | `Avaliacao` | `/api/pedidos/<id>/avaliacao` |

## Como é um controller

```python
bp_produto = Blueprint('produtos', __name__, url_prefix='/api/produtos')

@bp_produto.route('', methods=['POST'])    # POST /api/produtos
@master_required                           # só o mestre
def criar():
    dados = request.get_json(silent=True) or {}
    resposta, status = CriarProdutoService.executar(dados)
    return jsonify(resposta), status
```

O `@bp_produto.route(...)` diz qual URL e qual método chamam a função, e o `url_prefix` vai na frente. Permissões: `@login_required` (qualquer logado), `@admin_required` (admin ou mestre) e `@master_required` (só mestre). Cada Blueprint é registrado em [`backend/routes.py`](../routes.py).

## Referência das rotas

Todas usam JSON. Erros vêm como `{"erro": "mensagem"}`. **"login" = exige login**; sem login, respondem `401` com `{"erro": "Faça login para continuar."}`. A rota `GET /api` lista tudo o que está registrado.

### `aluno_controller.py` — `/api/alunos`

| Método | Rota | | Corpo | Respostas |
|---|---|---|---|---|
| `POST` | `/registro` | | `{nome, email, senha}` | `201` cadastrado **e logado** · `400` faltou campo · `409` e-mail já existe |
| `POST` | `/login` | | `{email, senha}` | `200` logado · `400` faltou campo · `401` e-mail ou senha errados |
| `POST` | `/logout` | login | — | `200` |
| `GET` | `/atual` | login | — | `200` aluno logado: `{id_aluno, nome, email, saldo, funcao}` |
| `PUT` | `/atual` | login | `{nome?, email?, senha?}` (senha vazia mantém a atual) | `200` |
| `DELETE` | `/atual` | login | — | `200` conta excluída |
| `POST` | `/atual/recarga` | login | `{valor}` | `200` saldo novo · `400` fora de R$ 0,01 a R$ 500,00 |
| `GET` | `` (raiz) | só mestre | — | `200` lista de alunos · `403` |
| `PUT` | `/<id>` | só mestre | — | `200` aluno promovido a `admin` · `404` |
| `DELETE` | `/<id>` | só mestre | — | `200` · `400` se for o próprio mestre · `403` · `404` |

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

Formato: `{ "id_produto", "nome", "quantidade_estoque", "preco_atual", "preco_promocional", "categoria", "ingredientes", "status", "imagem" }`. O `ingredientes` é a descrição mostrada na janela de detalhes do cardápio. Categorias usadas no front: `Salgado`, `Bebida` e `Doce`.

### `item_pedido_controller.py` — `/api/carrinho` (todas exigem login)

Todas as rotas usam o **aluno logado** (`current_user`), então nenhuma recebe `id_aluno`. Cada aluno só vê e altera o próprio carrinho.

| Método | Rota | Corpo | Respostas |
|---|---|---|---|
| `GET` | `` (raiz) | — | `200` carrinho (vazio se ainda não existir) |
| `POST` | `/itens` | `{id_produto, quantidade}` | `201` carrinho atualizado (soma se o produto já estiver) · `400` quantidade inválida · `404` produto |
| `DELETE` | `/itens/<id_item_pedido>` | — | `200` · `404` se o item não for do carrinho do aluno |
| `POST` | `/repetir` | — | `201` carrinho com os itens do último pedido somados · `404` se não houver pedido anterior |
| `POST` | `/repetir/<id_pedido>` | — | `201` carrinho com os itens daquele pedido somados (botão "Pedir de novo") · `404` se o pedido não for do aluno ou nenhum produto dele estiver à venda |
| `POST` | `/finalizar` | — | `200` pedido agora `"Pendente"`, estoque e saldo descontados · `400` carrinho vazio, estoque ou saldo insuficiente |

Formato do carrinho (as rotas acima, menos `/finalizar`, devolvem isto):

```json
{
  "id_aluno": 1, "valor_total": 10.0, "quantidade_itens": 2,
  "itens": [
    { "id_item_pedido": 5, "id_produto": 1, "produto_nome": "Suco de Laranja",
      "quantidade": 2, "preco_unitario_cobrado": 5.0, "subtotal": 10.0, "id_pedido": null }
  ]
}
```

- `quantidade_itens`: soma das quantidades de todos os itens.
- `id_pedido` é `null` porque o item ainda está no carrinho.

Formato de um pedido (`/finalizar` e as rotas de `/api/pedidos`):

```json
{
  "id_pedido": 3, "status": "Pendente", "status_texto": "Em preparo", "valor_total": 10.0,
  "codigo": "4K9P", "quantidade_itens": 2,
  "id_aluno": 1, "aluno_nome": "Ana",
  "data_hora_criacao": "2026-10-13T10:00:00",
  "horario_agendado_retirada": null, "data_hora_retirada": null,
  "itens": [
    { "id_item_pedido": 5, "id_produto": 1, "produto_nome": "Suco de Laranja",
      "quantidade": 2, "preco_unitario_cobrado": 5.0, "subtotal": 10.0, "id_pedido": 3 }
  ],
  "avaliado": false
}
```

- `codigo`: o código de retirada (ex.: `"4K9P"`).
- `status_texto`: o status como aparece na tela: `Pendente` → "Em preparo", `Pronto` → "Pronto para retirar", `Concluído` → "Entregue", `Cancelado` → "Cancelado".

### `pedido_controller.py` — `/api/pedidos`

| Método | Rota | | O que faz |
|---|---|---|---|
| `GET` | `` (raiz) | admin ou mestre | Os pedidos, já separados para a tela do admin: `{preparo: [...], prontos: [...], historico: [...]}`. `preparo` e `prontos` do mais antigo para o mais novo; `historico` (entregues e cancelados) do mais novo para o mais antigo |
| `GET` | `/meus` | login | Os pedidos do aluno logado, já separados: `{andamento: [...], historico: [...]}` (em preparo e prontos / entregues e cancelados), o mais recente primeiro |
| `GET` | `/combinacoes` | login | As 3 duplas de produtos mais pedidas juntas: `[{produtos: [{id_produto, nome}, ...], vezes}]` |
| `GET` | `/<id>` | login | Um pedido (só o dono ou admin/mestre; senão `404`) |
| `POST` | `/<id>/pronto` | admin ou mestre | Marca como `"Pronto"` (o aluno vê "Pronto para retirar") · `400` se não estiver `Pendente` |
| `POST` | `/<id>/concluir` | admin ou mestre | Marca como `"Concluído"` (o aluno retirou; aparece como "Entregue") e grava a hora em `data_hora_retirada` · `400` se já estiver concluído ou cancelado |
| `POST` | `/<id>/cancelar` | admin ou mestre | Marca como `"Cancelado"` e **devolve o valor ao aluno e os produtos ao estoque** · `400` se já estiver concluído ou cancelado |

Status de um pedido: `Pendente` (criado ao finalizar o carrinho) → `Pronto` (admin avisa que pode retirar) → `Concluído` (o aluno retirou no balcão). Enquanto não for concluído, o pedido pode ser `Cancelado`.

### `avaliacao_controller.py` — `/api/pedidos/<id>/avaliacao`

| Método | Rota | | Corpo | Respostas |
|---|---|---|---|---|
| `POST` | `/<id>/avaliacao` | login | `{nota, comentario?}` | `201` · `400` pedido não concluído, já avaliado ou nota fora de 1 a 5 · `404` pedido de outro aluno |
