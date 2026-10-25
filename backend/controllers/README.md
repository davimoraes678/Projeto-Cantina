# backend/controllers/

Os controllers recebem as **requisições HTTP**. **Cada controller é uma classe**, ligada a um recurso (Model) do sistema, com um método por rota. O método lê a requisição, chama o [service](../services/README.md) do caso de uso e devolve JSON. **Nenhuma regra de negócio fica aqui.**

| Arquivo | Classe | Recurso (Model) | Prefixo |
|---|---|---|---|
| `aluno_controller.py` | `AlunoController` | `Aluno` | `/api/alunos` |
| `produto_controller.py` | `ProdutoController` | `Produto` | `/api/produtos` |
| `item_pedido_controller.py` | `ItemPedidoController` | `ItemPedido` (carrinho) | `/api/carrinho` |
| `pedido_controller.py` | `PedidoController` | `Pedido` | `/api/pedidos` |
| `avaliacao_controller.py` | `AvaliacaoController` | `Avaliacao` | `/api/pedidos/<id>/avaliacao` |

## Como é um controller

```python
class ProdutoController:
    @staticmethod
    @master_required                       # permissão (backend/autenticacao.py)
    def criar():
        dados = request.get_json(silent=True) or {}          # 1. lê a requisição
        resposta, status = CriarProdutoService.executar(dados)  # 2. chama o service
        return jsonify(resposta), status                     # 3. devolve JSON

# No fim do arquivo, as URLs do recurso são ligadas aos métodos:
bp_produto = Blueprint('produtos', __name__, url_prefix='/api/produtos')
bp_produto.add_url_rule('', view_func=ProdutoController.criar, methods=['POST'])
```

O `Blueprint` de cada arquivo é registrado em [`backend/routes.py`](../routes.py). Permissões: `@login_required` (qualquer logado), `@admin_required` (admin ou mestre), `@master_required` (só mestre).

## Referência das rotas

Todas usam JSON. Erros vêm como `{"erro": "mensagem"}`. **🔒 = exige login**; sem login, respondem `401` com `{"erro": "Faça login para continuar."}`. A rota `GET /api` lista tudo o que está registrado.

### `aluno_controller.py` — `/api/alunos`

| Método | Rota | | Corpo | Respostas |
|---|---|---|---|---|
| `POST` | `/registro` | | `{nome, email, senha}` | `201` cadastrado **e logado** · `400` faltou campo · `409` e-mail já existe |
| `POST` | `/login` | | `{email, senha}` | `200` logado · `400` faltou campo · `401` e-mail ou senha errados |
| `POST` | `/logout` | 🔒 | — | `200` |
| `GET` | `/atual` | 🔒 | — | `200` aluno logado |
| `PUT` | `/atual` | 🔒 | `{nome?, email?, senha?}` (senha vazia mantém a atual) | `200` |
| `DELETE` | `/atual` | 🔒 | — | `200` conta excluída |
| `POST` | `/atual/recarga` | 🔒 | `{valor}` | `200` saldo novo · `400` fora de R$ 0,01 a R$ 500,00 |
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
| `GET` | `` (raiz) | admin ou mestre | Lista os pedidos (**sem** os carrinhos em aberto) |
| `GET` | `/combinacoes` | 🔒 | As 3 duplas de produtos mais pedidas juntas: `[{produtos: [{id_produto, nome}, ...], vezes}]` |
| `GET` | `/<id>` | 🔒 | Um pedido (só o dono ou admin/mestre; senão `404`) |
| `POST` | `/<id>/concluir` | admin ou mestre | Marca como `"Concluído"` · `400` se já estiver concluído ou cancelado |
| `POST` | `/<id>/cancelar` | admin ou mestre | Marca como `"Cancelado"` e **devolve o valor ao aluno e os produtos ao estoque** · `400` se já estiver concluído ou cancelado |

Status de um pedido: `Carrinho` → `Pendente` (ao finalizar) → `Concluído` ou `Cancelado`.

### `avaliacao_controller.py` — `/api/pedidos/<id>/avaliacao`

| Método | Rota | | Corpo | Respostas |
|---|---|---|---|---|
| `POST` | `/<id>/avaliacao` | 🔒 | `{nota, comentario?}` | `201` · `400` pedido não concluído, já avaliado ou nota fora de 1 a 5 · `404` pedido de outro aluno |

## Ao criar uma rota

- Crie um **método na classe do controller** e ligue a URL com `bp.add_url_rule(...)` no fim do arquivo. O método só lê a requisição e chama um service.
- Os nomes entre `< >` na URL precisam ser parâmetros do método (`/<int:id_aluno>` → `def promover(id_aluno)`), senão dá `TypeError`.
- Dentro de um mesmo controller, os métodos precisam ter **nomes diferentes** (o Flask usa o nome para identificar a rota).
- Leia o corpo com `request.get_json(silent=True) or {}`, que não quebra se o corpo vier vazio.
- Controller novo: registre o blueprint em `routes.py` e acrescente as rotas nesta página. O `GET /api` lista as rotas sozinho.
