# backend/repositories/

Aqui ficam as **consultas não-CRUD** (filtrar, ordenar, juntar tabelas e contar). Elas usam o que está nos arquivos `.sql`: **stored procedures** no MySQL e **views** nos dois bancos. O CRUD simples fica nos models.

| Arquivo | O que faz |
|---|---|
| `produto_repository.py` | `ProdutoRepository`: busca por categoria, por faixa de preço e ordenação. Devolve uma lista de objetos `Produto` |
| `pedido_repository.py` | `PedidoRepository`: itens do último pedido e combinações mais pedidas. Devolve dicionários (o resultado não é um model) |
| `avaliacao_repository.py` | `AvaliacaoRepository`: lista das avaliações para o admin. Devolve dicionários |

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
- **Em outro banco** (SQLite), as procedures não existem. Os métodos de produto fazem a consulta equivalente pelo ORM. Os de pedido e avaliação leem direto das **views** do [`views.sql`](../database/README.md), que existem nos dois bancos:

```python
if banco == "mysql":
    sql = text("CALL sp_combinacoes_mais_pedidas()")     # a procedure lê da view
else:
    sql = text("SELECT * FROM vw_combinacoes_mais_pedidas")
```

  Assim a consulta fica escrita uma vez só, dentro do `.sql`, e o resultado é igual nos dois bancos.
- O **service** só chama o repository e usa o resultado; ele não sabe qual banco está em uso.

## Os métodos e as procedures

```
GET  /api/produtos/buscar      → FiltrarProdutosService         → ProdutoRepository
POST /api/carrinho/repetir     → RepetirUltimoPedidoService     → PedidoRepository
GET  /api/pedidos/combinacoes  → CombinacoesMaisPedidasService  → PedidoRepository
GET  /api/pedidos/avaliacao    → ListarAvaliacaoService         → AvaliacaoRepository
```

| Método | MySQL | SQLite | Devolve |
|---|---|---|---|
| `ProdutoRepository.buscar_por_categoria(categoria)` | `sp_produtos_por_categoria` | ORM | lista de `Produto` |
| `ProdutoRepository.buscar_por_faixa_de_preco(min, max)` | `sp_produtos_por_faixa_de_preco` | ORM | lista de `Produto` |
| `ProdutoRepository.ordenar_por_preco()` | `sp_produtos_ordenar_por_preco` | ORM | lista de `Produto` |
| `ProdutoRepository.ordenar_por_nome()` | `sp_produtos_ordenar_por_nome` | ORM | lista de `Produto` |
| `PedidoRepository.itens_do_ultimo_pedido(id_aluno)` | `sp_repetir_ultimo_pedido` | `vw_itens_ultimo_pedido` | `[{"id_produto", "quantidade"}, ...]` |
| `PedidoRepository.combinacoes_mais_pedidas()` | `sp_combinacoes_mais_pedidas` | `vw_combinacoes_mais_pedidas` | `[{"id_produto_1", "nome_1", "id_produto_2", "nome_2", "vezes"}, ...]` |
| `AvaliacaoRepository.listar()` | `sp_listar_avaliacoes` | `vw_avaliacoes` | `[{"id_avaliacao", "nota", "comentario", "data_avaliacao", "id_pedido", "codigo", "aluno_nome"}, ...]` |

Ao mudar uma view, basta reiniciar o app. Ao mudar uma procedure no `create-database.sql`, rode o script de novo no MySQL.
