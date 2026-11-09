# backend/repositories/

Aqui ficam as **consultas não-CRUD** (filtrar, ordenar, juntar tabelas e contar), feitas por **stored procedures do MySQL**. O CRUD simples fica nos models.

| Arquivo | O que faz |
|---|---|
| `produto_repository.py` | `ProdutoRepository`: busca por categoria, por faixa de preço e ordenação. Devolve uma lista de objetos `Produto` |
| `pedido_repository.py` | `PedidoRepository`: itens do último pedido e combinações mais pedidas. Devolve dicionários (o resultado não é um model) |

## Como é um método do repository

Cada método decide, pelo banco em uso, como fazer a consulta:

```python
@staticmethod
def buscar_por_categoria(categoria):
    banco = db.session.get_bind().dialect.name          # "mysql" ou "sqlite"

    if banco == "mysql":
        sql = text("CALL sp_produtos_por_categoria(:categoria)")      # chama a procedure
        resultado = db.session.execute(sql, {"categoria": categoria}) # o valor vai separado (sem risco de SQL injection)
        linhas = resultado.mappings().all()     # cada linha vira um dicionário {"nome": ..., "preco_atual": ...}
        resultado.close()                       # libera a conexão (o CALL deixa um resultado extra aberto)

        return [Produto(**dict(linha)) for linha in linhas]   # cada linha vira um objeto Produto

    # Sem MySQL (ex.: SQLite no Codespaces): a mesma busca pelo ORM
    return Produto.query.filter_by(categoria=categoria).all()
```

- **No MySQL**, a consulta é a stored procedure. As procedures são criadas pelo [`create-database.sql`](../database/README.md).
- **Em outro banco** (SQLite), as procedures não existem, então o mesmo método faz a consulta equivalente pelo ORM. Por isso o site funciona nos dois bancos.
- O **service** só chama o repository e usa o resultado; ele não sabe qual banco está em uso.

## Os métodos e as procedures

```
GET  /api/produtos/buscar      → FiltrarProdutosService         → ProdutoRepository
POST /api/carrinho/repetir     → RepetirUltimoPedidoService     → PedidoRepository
GET  /api/pedidos/combinacoes  → CombinacoesMaisPedidasService  → PedidoRepository
```

| Método | Procedure (MySQL) | Devolve |
|---|---|---|
| `ProdutoRepository.buscar_por_categoria(categoria)` | `sp_produtos_por_categoria` | lista de `Produto` |
| `ProdutoRepository.buscar_por_faixa_de_preco(min, max)` | `sp_produtos_por_faixa_de_preco` | lista de `Produto` |
| `ProdutoRepository.ordenar_por_preco()` | `sp_produtos_ordenar_por_preco` | lista de `Produto` |
| `ProdutoRepository.ordenar_por_nome()` | `sp_produtos_ordenar_por_nome` | lista de `Produto` |
| `PedidoRepository.itens_do_ultimo_pedido(id_aluno)` | `sp_repetir_ultimo_pedido` | `[{"id_produto", "quantidade"}, ...]` |
| `PedidoRepository.combinacoes_mais_pedidas()` | `sp_combinacoes_mais_pedidas` | `[{"id_produto_1", "nome_1", "id_produto_2", "nome_2", "vezes"}, ...]` |

Ao mudar uma procedure no `create-database.sql`, rode o script de novo no MySQL.
