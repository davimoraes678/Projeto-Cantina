# backend/repositories/

Acesso ao banco por **stored procedures do MySQL**. Hoje é usado só na busca de produtos.

| Arquivo | O que faz |
|---|---|
| `produto_repository.py` | `ProdutoRepository`: executa `CALL sp_produtos_...` e devolve as linhas como dicionários. É o único lugar do projeto que monta essas chamadas |
| `aluno_repository.py` | **Sem uso** (só tem imports). Pode ser removido |
| `app.py` | **Sem uso** (importa `create_app` de um lugar onde ela não existe; dá `ImportError` se executado). Pode ser removido |

## Fluxo da busca de produtos

```
GET /api/produtos/buscar → produto_controller → ProdutoService.buscar → ProdutoRepository → CALL sp_... → MySQL
```

| Método do repository | Procedure |
|---|---|
| `buscar_por_categoria(categoria)` | `sp_produtos_por_categoria` |
| `buscar_por_faixa_de_preco(min, max)` | `sp_produtos_por_faixa_de_preco` |
| `ordenar_por_preco()` | `sp_produtos_ordenar_por_preco` |
| `ordenar_por_nome()` | `sp_produtos_ordenar_por_nome` |

As procedures são criadas pelo [`create-database.sql`](../database/README.md).

**Fora do MySQL** (ex.: SQLite em desenvolvimento), as procedures não existem: o repository lança um `RuntimeError`, e o `ProdutoService.buscar` faz a mesma busca pelo ORM. Por isso a busca funciona nos dois bancos.
