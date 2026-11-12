# backend/database/

| Arquivo | O que faz | Banco |
|---|---|---|
| `create-database.sql` | Cria o banco `cantina_db`, as tabelas e as stored procedures | Só MySQL |
| `views.sql` | Cria as views com as consultas especiais | SQLite e MySQL |

## As views

As views guardam as consultas mais complexas do projeto. Elas funcionam nos dois bancos, e o `app.py` roda o `views.sql` sozinho toda vez que inicia.

| View | O que devolve | Usada em |
|---|---|---|
| `vw_itens_ultimo_pedido` | Os itens do último pedido de cada aluno | "Repetir último pedido" |
| `vw_combinacoes_mais_pedidas` | As 3 duplas de produtos mais pedidas juntas (cancelados não contam) | Combos mais pedidos |
| `vw_avaliacoes` | As avaliações com o código do pedido e o nome do aluno | Aba Avaliações do admin |

## As procedures (MySQL)

| Procedure | O que faz |
|---|---|
| `sp_produtos_por_categoria` | Produtos de uma categoria |
| `sp_produtos_por_faixa_de_preco` | Produtos entre dois preços |
| `sp_produtos_ordenar_por_preco` / `sp_produtos_ordenar_por_nome` | Produtos ordenados |
| `sp_repetir_ultimo_pedido` | Lê da `vw_itens_ultimo_pedido` |
| `sp_combinacoes_mais_pedidas` | Lê da `vw_combinacoes_mais_pedidas` |
| `sp_listar_avaliacoes` | Lê da `vw_avaliacoes` |

As três últimas procedures só leem das views, então a consulta fica escrita num lugar só.

## Como usar

**SQLite:** não precisa fazer nada. O `app.py` cria as tabelas (`db.create_all()`) e as views (`views.sql`) ao iniciar.

**MySQL:** rode o script uma vez e aponte o `.env` para o banco:

```bash
mysql -u root -p < backend/database/create-database.sql
```

```env
DATABASE_URL=mysql+pymysql://usuario:senha@localhost/cantina_db?charset=utf8mb4
```

As views são criadas quando o app inicia. Para testar as procedures direto no MySQL Workbench antes de iniciar o app, rode também o `views.sql` (com o banco `cantina_db` selecionado).

Os dois scripts podem rodar mais de uma vez: as tabelas usam `CREATE TABLE IF NOT EXISTS`, e as views e procedures são apagadas e criadas de novo.

Ao mudar um model, mude a tabela no `create-database.sql` também. O `db.create_all()` não altera tabelas que já existem.
