# backend/repositories/

Acesso ao banco por **stored procedures do MySQL**. Hoje é usado só na busca de produtos.

| Arquivo | O que faz |
|---|---|
| `produto_repository.py` | `ProdutoRepository`: executa `CALL sp_produtos_buscar(...)` e devolve as linhas como dicionários. É o único lugar do projeto que monta essa chamada |

## Fluxo da busca de produtos

```
GET /api/produtos/buscar → produto_controller → ProdutoService.buscar → ProdutoRepository → CALL sp_produtos_buscar → MySQL
```

| Método do repository | O que faz |
|---|---|
| `usa_procedures()` | `True` só no MySQL (nos outros bancos as procedures não existem) |
| `buscar(categoria, preco_min, preco_max, ordenar, apenas_ativos)` | `CALL sp_produtos_buscar(...)`. Todos os parâmetros são opcionais (`None` = não filtrar) e **se combinam** |

A procedure é criada pelo [`create-database.sql`](../database/README.md). Ela substituiu as quatro procedures antigas (uma por filtro), que não combinavam os critérios.

**Fora do MySQL** (ex.: SQLite em desenvolvimento), o `ProdutoService.buscar` não chama o repository e faz a mesma busca pelo ORM (`_buscar_orm`). **A regra precisa ser igual nos dois lugares:** ao mudar a procedure, mude o `_buscar_orm` também (e vice-versa).
