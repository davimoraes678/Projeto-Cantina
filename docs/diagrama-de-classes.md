# Diagrama de classes do domínio

As classes abaixo são as **Models** de `backend/models/`. Cada uma é uma tabela do banco
(script em `backend/database/create-database.sql`). A imagem está em
[`diagrama-de-classes.png`](diagrama-de-classes.png); o mesmo diagrama em Mermaid
(que o GitHub desenha sozinho) está logo abaixo.

```mermaid
classDiagram
    direction LR

    class db_Model["db.Model (SQLAlchemy)"]
    class UserMixin["UserMixin (Flask-Login)"]

    class Aluno {
        +int id_aluno
        +str nome
        +str email
        +str senha
        +float saldo
        +str funcao
        +salvar()
        +atualizar(nome, email, senha, funcao, saldo)
        +deletar()
        +listar_todos()$
        +buscar_por_id(id_aluno)$
        +is_admin() bool
        +get_id() str
        +to_dict() dict
    }

    class Produto {
        +int id_produto
        +str nome
        +int quantidade_estoque
        +float preco_atual
        +float preco_promocional
        +str categoria
        +str ingredientes
        +str tabela_nutricional
        +bool status
        +str imagem
        +salvar()
        +atualizar(nome, quantidade_estoque, preco_atual, ...)
        +deletar()
        +listar_todos()$
        +buscar_por_id(id_produto)$
        +to_dict() dict
    }

    class Pedido {
        +int id_pedido
        +datetime data_hora_criacao
        +str status
        +float valor_total
        +datetime horario_agendado_retirada
        +datetime data_hora_retirada
        +int id_aluno
        +str nome_aluno
        +calcular_total() float
        +salvar()
        +atualizar(status, data_hora_retirada, horario_agendado_retirada)
        +deletar()
        +listar_todos()$
        +buscar_por_id(id_pedido)$
        +buscar_carrinho(id_aluno)$
        +to_dict() dict
    }

    class ItemPedido {
        +int id_item_pedido
        +int quantidade
        +float preco_unitario_cobrado
        +int id_pedido
        +int id_produto
        +str nome_produto
        +salvar()
        +atualizar(quantidade, preco_unitario_cobrado)
        +deletar()
        +listar_todos()$
        +buscar_por_id(id_item_pedido)$
        +to_dict() dict
    }

    class Avaliacao {
        +int id_avaliacao
        +int nota
        +str comentario
        +datetime data_avaliacao
        +int id_pedido
        +salvar()
        +atualizar(nota, comentario)
        +deletar()
        +listar_todos()$
        +buscar_por_id(id_avaliacao)$
        +to_dict() dict
    }

    class RateioPagamento {
        +int id_rateio
        +float valor_parte
        +str status_pagamento
        +int id_aluno
        +int id_pedido
        +salvar()
        +atualizar(valor_parte, status_pagamento)
        +deletar()
        +listar_todos()$
        +buscar_por_id(id_rateio)$
        +to_dict() dict
    }

    %% Herança
    db_Model <|-- Aluno
    UserMixin <|-- Aluno
    db_Model <|-- Produto
    db_Model <|-- Pedido
    db_Model <|-- ItemPedido
    db_Model <|-- Avaliacao
    db_Model <|-- RateioPagamento

    %% Composição (a parte não existe sem o todo)
    Pedido "1" *-- "1..*" ItemPedido : contém
    Pedido "1" *-- "0..1" Avaliacao : recebe
    Pedido "1" *-- "0..*" RateioPagamento : é dividido em

    %% Agregação (a parte continua existindo sem o todo)
    Aluno "0..1" o-- "0..*" Pedido : faz
    Produto "0..1" o-- "0..*" ItemPedido : aparece em
    Aluno "0..1" o-- "0..*" RateioPagamento : paga
```

## Herança

| Classe | Herda de | Por quê |
|---|---|---|
| Todas | `db.Model` | É o que faz a classe virar uma tabela no SQLAlchemy (CRUD convencional) |
| `Aluno` | `UserMixin` também | O aluno é o usuário do login (Flask-Login). O `get_id()` devolve o `id_aluno` para o cookie |

## Relacionamentos

| Relação | Tipo | Como aparece no código |
|---|---|---|
| `Pedido` → `ItemPedido` | **Composição** | `cascade='all, delete-orphan'`: o item só existe dentro do pedido; apagar o pedido (ou tirar o item do carrinho) apaga o item |
| `Pedido` → `Avaliacao` | **Composição** | `uselist=False` e `id_pedido` obrigatório e único: no máximo uma avaliação por pedido, que não existe sem ele |
| `Pedido` → `RateioPagamento` | **Composição** | `id_pedido` obrigatório: cada parte do rateio pertence a um pedido |
| `Aluno` → `Pedido` | **Agregação** | `id_aluno` aceita nulo: ao excluir o aluno, os pedidos continuam no histórico com o `nome_aluno` guardado |
| `Produto` → `ItemPedido` | **Agregação** | `id_produto` aceita nulo: ao excluir o produto, os itens dos pedidos antigos continuam com o `nome_produto` guardado |
| `Aluno` → `RateioPagamento` | **Agregação** | `id_aluno` aceita nulo |

**Carrinho:** não é uma classe à parte. É um `Pedido` com `status = "Carrinho"`; ao finalizar,
o status vira `"Pendente"`. Status possíveis: `Carrinho`, `Pendente`, `Concluído`, `Cancelado`.

**RateioPagamento:** a classe e a tabela existem (pensadas para o requisito "dividir conta"),
mas ainda não há tela nem rota para ela.

`$` no diagrama = método estático (`@staticmethod`), chamado pela classe: `Aluno.buscar_por_id(1)`.
