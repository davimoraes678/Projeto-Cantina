# backend/database/

| Arquivo | O que faz |
|---|---|
| `create-database.sql` | Cria o banco **MySQL** `cantina_db`: as tabelas, as stored procedures (busca de produtos, repetir último pedido e combinações mais pedidas) e alguns dados de exemplo (4 alunos e 4 produtos) |

## Quando usar

- **Desenvolvimento com SQLite (padrão):** não precisa deste arquivo. As tabelas são criadas sozinhas pelo `db.create_all()` quando o `app.py` inicia.
- **MySQL:** rode o script uma vez, e depois aponte o `.env` para o banco:
  ```bash
  mysql -u root -p < backend/database/create-database.sql
  ```
  ```env
  DATABASE_URL=mysql+pymysql://usuario:senha@localhost/cantina_db?charset=utf8mb4
  ```

## O que o script cria

| Parte | Conteúdo |
|---|---|
| Tabelas | `aluno`, `produto`, `pedido`, `itens_pedido`, `avaliacao`, `rateio`. Os mesmos campos dos [models](../models/README.md) |
| Procedures | `sp_produtos_por_categoria`, `sp_produtos_por_faixa_de_preco`, `sp_produtos_ordenar_por_preco`, `sp_produtos_ordenar_por_nome`, `sp_repetir_ultimo_pedido`, `sp_combinacoes_mais_pedidas`, usadas pelos [repositories](../repositories/README.md) |
| Dados de exemplo | Alunos e produtos (`Bebida`, `Lanche`, `Doce`) |

## Cuidados

- **Mantenha o script igual aos models.** Ao mudar um model, mude a tabela aqui também (e rode um `ALTER TABLE` no banco existente). O `db.create_all()` não altera tabelas que já existem.
- **As senhas dos alunos de exemplo** (`'hashed_password_1'` etc.) não são hashes de verdade, então esses alunos não conseguem fazer login. Para testar, cadastre um aluno pela tela de cadastro.
- **Rodar o script de novo** falha nos `INSERT` de alunos (o e-mail é único) e duplica os produtos de exemplo.
