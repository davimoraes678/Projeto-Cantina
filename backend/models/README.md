# backend/models/

Uma classe por **tabela do banco** (SQLAlchemy). Os [services](../services/README.md) usam essas classes para ler e gravar.

| Arquivo | Classe | Tabela | Para quê |
|---|---|---|---|
| `aluno_model.py` | `Aluno` | `aluno` | Usuário do sistema. Também é o usuário do login (`UserMixin` + `get_id()`) |
| `produto_model.py` | `Produto` | `produto` | Itens vendidos pela cantina |
| `pedido_model.py` | `Pedido` | `pedido` | Um pedido **ou o carrinho** de um aluno |
| `item_pedido.py` | `ItemPedido` | `itens_pedido` | Cada produto dentro de um pedido |
| `avaliacao_model.py` | `Avaliacao` | `avaliacao` | Nota e comentário de um pedido concluído (uma por pedido) |
| `rateio_model.py` | `RateioPagamento` | `rateio` | Divisão do valor entre alunos. **Ainda sem rotas** |

> ⚠️ Todos os models precisam ser **importados no `models/__init__.py`** (que o `app.py` carrega), mesmo os sem rotas. Sem isso, o SQLAlchemy não encontra as classes citadas nos relacionamentos (`'Avaliacao'`, `'RateioPagamento'`) e **toda consulta dá erro 500**. Ao criar um model novo, acrescente-o nesse import.

## Relacionamentos

```mermaid
erDiagram
    aluno ||--o{ pedido : "faz"
    pedido ||--|{ itens_pedido : "contém"
    produto ||--o{ itens_pedido : "aparece em"
    pedido ||--o| avaliacao : "recebe"
    pedido ||--o{ rateio : "é dividido em"
    aluno ||--o{ rateio : "paga"
```

| Tabela | Campos principais |
|---|---|
| `aluno` | `id_aluno`, `nome`, `email` (único), `senha` (hash), `saldo` |
| `produto` | `id_produto`, `nome`, `quantidade_estoque`, `preco_atual`, `preco_promocional`, `categoria`, `status` (disponível?), `ingredientes`, `tabela_nutricional` (a imagem não é coluna: o arquivo é achado pelo nome, veja [`arquivos/`](../../arquivos/README.md)) |
| `pedido` | `id_pedido`, `status`, `valor_total`, `data_hora_criacao`, `horario_agendado_retirada`, `data_hora_retirada`, `id_aluno`, `nome_aluno` |
| `itens_pedido` | `id_item_pedido`, `quantidade`, `preco_unitario_cobrado`, `id_pedido`, `id_produto`, `nome_produto` |

## O carrinho é um pedido

Não existe tabela de carrinho. O carrinho é um **`Pedido` com `status = "Carrinho"`**, e cada produto é um `ItemPedido`. Assim ele continua salvo ao recarregar a página e vira pedido só trocando o status. Cada aluno tem no máximo um carrinho aberto.

```mermaid
stateDiagram-v2
    [*] --> Carrinho: adiciona o 1º produto
    Carrinho --> Pendente: Finalizar Pedido
    Pendente --> EmPreparo
    EmPreparo --> Pronto
    Pronto --> Concluído
    Pendente --> Cancelado
    EmPreparo --> Cancelado
```

`Pedido.itens` usa `cascade='all, delete-orphan'`: tirar um item da lista (`carrinho.itens.remove(item)`) já apaga o `ItemPedido` do banco.

## Histórico preservado

- `pedido.nome_aluno` e `itens_pedido.nome_produto` guardam uma **cópia do nome** no momento do pedido.
- `preco_unitario_cobrado` guarda o **preço daquele momento**; se o preço do produto mudar, os pedidos antigos não mudam.
- Ao excluir um aluno ou produto, o service solta o vínculo (`id_aluno` / `id_produto` ficam vazios) em vez de apagar os pedidos. O `to_dict()` usa o nome atual se o registro ainda existir, senão a cópia.

## Métodos comuns

| Método | O que faz |
|---|---|
| `salvar()` | Adiciona e faz commit |
| `atualizar(...)` | Muda só os campos passados (os `None` são ignorados) e faz commit |
| `deletar()` | Apaga e faz commit |
| `Model.listar_todos()` | Todos os registros |
| `Model.buscar_por_id(id)` | Um registro, ou `None` |
| `to_dict()` | Converte para dicionário (é o que vira JSON na API) |
| `Pedido.calcular_total()` | Soma `preco_unitario_cobrado × quantidade` dos itens |

## Mudando uma tabela

O `db.create_all()` (no `app.py`) cria tabelas novas, mas **não altera** as que já existem. Ao adicionar uma coluna num model:
- **SQLite:** apague o `instance/cantina.db` e rode de novo;
- **MySQL:** faça um `ALTER TABLE` e atualize o [`create-database.sql`](../database/README.md).
