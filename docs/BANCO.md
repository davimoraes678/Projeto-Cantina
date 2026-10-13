# Banco de dados

Os models ficam em `backend/models/` (um arquivo por tabela). Em desenvolvimento o banco é um arquivo SQLite (`cantina.db`, criado automaticamente); em produção é MySQL, configurado pela variável `DATABASE_URL` no `.env`.

## Tabelas e relacionamentos

```mermaid
erDiagram
    aluno ||--o{ pedido : "faz"
    pedido ||--|{ itens_pedido : "contém"
    produto ||--o{ itens_pedido : "aparece em"
    pedido ||--o| avaliacao : "recebe"
    pedido ||--o{ rateio : "é dividido em"
    aluno ||--o{ rateio : "paga"

    aluno {
        int id_aluno PK
        string nome
        string email "único"
        string senha "hash, nunca o texto"
        float saldo
    }
    produto {
        int id_produto PK
        string nome
        int quantidade_estoque
        float preco_atual
        float preco_promocional
        string categoria
        bool status "disponível?"
        string imagem
        string ingredientes
        string tabela_nutricional
    }
    pedido {
        int id_pedido PK
        string status "Carrinho, Pendente, ..."
        float valor_total
        datetime data_hora_criacao
        datetime horario_agendado_retirada
        datetime data_hora_retirada
        int id_aluno FK "pode ficar vazio"
        string nome_aluno "cópia do nome"
    }
    itens_pedido {
        int id_item_pedido PK
        int quantidade
        float preco_unitario_cobrado
        int id_pedido FK
        int id_produto FK "pode ficar vazio"
        string nome_produto "cópia do nome"
    }
    avaliacao {
        int id_avaliacao PK
        int nota
        string comentario
        int id_pedido FK
    }
    rateio {
        int id_rateio PK
        float valor_parte
        string status_pagamento
        int id_aluno FK
        int id_pedido FK
    }
```

| Model (arquivo) | Tabela | Para quê |
|---|---|---|
| `Aluno` (`aluno_model.py`) | `aluno` | Usuário do sistema. Também é o usuário do login (`UserMixin`). |
| `Produto` (`produto_model.py`) | `produto` | Itens vendidos pela cantina |
| `Pedido` (`pedido_model.py`) | `pedido` | Um pedido **ou o carrinho** de um aluno (veja abaixo) |
| `ItemPedido` (`item_pedido.py`) | `itens_pedido` | Cada produto dentro de um pedido |
| `Avaliacao` (`avaliacao_model.py`) | `avaliacao` | Nota de um pedido. **Ainda sem rotas.** |
| `RateioPagamento` (`rateio_model.py`) | `rateio` | Divisão do valor entre alunos. **Ainda sem rotas.** |

## O carrinho é um pedido

Não existe tabela de carrinho. O carrinho de um aluno é um **`Pedido` com `status = "Carrinho"`**, e cada produto adicionado é um `ItemPedido` desse pedido. Isso faz o carrinho:
- continuar salvo se o aluno recarregar a página ou trocar de computador;
- virar pedido só trocando o status, sem copiar dados.

```mermaid
stateDiagram-v2
    [*] --> Carrinho: aluno adiciona o 1º produto
    Carrinho --> Pendente: "Finalizar Pedido"
    Pendente --> EmPreparo: cantina
    EmPreparo --> Pronto: cantina
    Pronto --> Concluído: aluno retirou
    Pendente --> Cancelado
    EmPreparo --> Cancelado
    note right of Carrinho: GET /api/pedidos não mostra pedidos com status "Carrinho"
```

Cada aluno tem no máximo um carrinho aberto: o service procura um pedido `"Carrinho"` do aluno logado e só cria outro se não houver.

## Histórico preservado ("fotos" dos nomes)

`pedido.nome_aluno` e `itens_pedido.nome_produto` guardam uma cópia do nome **no momento do pedido**. Ao excluir um aluno ou um produto, o service solta o vínculo (`id_aluno` / `id_produto` ficam vazios) em vez de apagar os pedidos, e o pedido antigo continua mostrando o nome pela cópia.

Pelo mesmo motivo, `preco_unitario_cobrado` guarda o preço do produto **no momento em que entrou no carrinho**: se o preço mudar depois, os pedidos antigos não mudam.

## Como as tabelas são criadas

- **SQLite (desenvolvimento):** automático. Ao iniciar, o `app.py` roda `db.create_all()`, que cria as tabelas que faltam. Para recomeçar, apague `cantina.db`.
- **MySQL:** rode `backend/database/create-database.sql`. Ele cria o banco `cantina_db`, as tabelas, as 4 procedures de busca de produto e alguns dados de exemplo.

> `db.create_all()` **não altera** tabelas que já existem. Se você adicionar uma coluna num model, no SQLite apague o `cantina.db`; no MySQL faça um `ALTER TABLE` (e atualize o `create-database.sql`).

### Stored procedures (só MySQL)

Usadas pela rota `GET /api/produtos/buscar`, via `backend/repositories/produto_repository.py`:

| Procedure | Parâmetros |
|---|---|
| `sp_produtos_por_categoria` | categoria |
| `sp_produtos_por_faixa_de_preco` | preço mínimo, preço máximo |
| `sp_produtos_ordenar_por_preco` | — |
| `sp_produtos_ordenar_por_nome` | — |

No SQLite elas não existem; o `produto_service.py` detecta o erro e faz a mesma busca pelo ORM.

## Métodos comuns dos models

Todos os models seguem o mesmo padrão:

| Método | O que faz |
|---|---|
| `salvar()` | Adiciona e faz commit |
| `atualizar(...)` | Muda só os campos passados (os `None` são ignorados) e faz commit |
| `deletar()` | Apaga e faz commit |
| `Model.listar_todos()` | Todos os registros |
| `Model.buscar_por_id(id)` | Um registro, ou `None` |
| `to_dict()` | Converte para dicionário (é o que vira JSON na API) |
