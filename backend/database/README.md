# backend/database/

| Arquivo | O que faz |
|---|---|
| `create-database.sql` | Cria o banco MySQL `cantina_db`, as tabelas e as stored procedures |

## Como usar

```bash
mysql -u root -p < backend/database/create-database.sql
```

Depois, aponte o `.env` para o banco:

```env
DATABASE_URL=mysql+pymysql://usuario:senha@localhost/cantina_db?charset=utf8mb4
```

O script pode rodar mais de uma vez: as tabelas usam `CREATE TABLE IF NOT EXISTS` e as procedures são apagadas e criadas de novo. Com SQLite, este arquivo não é usado, porque o `app.py` cria as tabelas sozinho.

## O que o script cria

| Parte | Conteúdo |
|---|---|
| Tabelas | `aluno`, `produto`, `pedido`, `itens_pedido`, `avaliacao` e `rateio`, com os mesmos campos dos [models](../models/README.md) |
| Procedures | `sp_produtos_por_categoria`, `sp_produtos_por_faixa_de_preco`, `sp_produtos_ordenar_por_preco`, `sp_produtos_ordenar_por_nome`, `sp_repetir_ultimo_pedido` e `sp_combinacoes_mais_pedidas`, chamadas pelos [repositories](../repositories/README.md) |

Ao mudar um model, mude a tabela no script também. O `db.create_all()` não altera tabelas que já existem.
