# backend/repositories/

Acesso ao banco por **stored procedures do MySQL**. É aqui que ficam as **consultas não-CRUD** do projeto (as que têm regra de negócio: filtrar, ordenar, juntar tabelas, contar): a busca de produtos, o "repetir último pedido" e as combinações mais pedidas.

| Arquivo | O que faz |
|---|---|
| `produto_repository.py` | `ProdutoRepository`: executa `CALL sp_produtos_...` e devolve as linhas como dicionários. É o único lugar do projeto que monta essas chamadas |
| `pedido_repository.py` | `PedidoRepository`: `itens_do_ultimo_pedido(id_aluno)` → `CALL sp_repetir_ultimo_pedido` e `combinacoes_mais_pedidas()` → `CALL sp_combinacoes_mais_pedidas`. Reaproveita o `ProdutoRepository._chamar_procedure` |
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

## Consultas de pedidos

```
POST /api/carrinho/repetir     → ItemPedidoService.repetir_ultimo_pedido → PedidoRepository → CALL sp_repetir_ultimo_pedido(id_aluno)
GET  /api/pedidos/combinacoes  → PedidoService.combinacoes_mais_pedidas  → PedidoRepository → CALL sp_combinacoes_mais_pedidas()
```

As duas seguem a mesma regra da busca: fora do MySQL o service faz a mesma consulta pelo ORM (`_itens_do_ultimo_pedido_orm` e `_combinacoes_fallback_orm`), com o mesmo resultado.

**Ao mudar o `create-database.sql`, rode o script de novo no MySQL** para recriar as procedures (ele usa `DROP PROCEDURE IF EXISTS`, então pode rodar várias vezes).
