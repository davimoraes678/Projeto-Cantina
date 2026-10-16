# backend/database/

| Arquivo | O que faz |
|---|---|
| `create-database.sql` | Cria o banco **MySQL** `cantina_db`: as tabelas, a stored procedure de busca de produto e 4 produtos de exemplo |

## Quando usar

- **Desenvolvimento com SQLite (padrão):** não precisa deste arquivo. As tabelas são criadas sozinhas pelo `db.create_all()` quando o `app.py` inicia. Os produtos de exemplo **não** entram no SQLite: cadastre pela tela de administração.
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
| Procedure | `sp_produtos_buscar(categoria, preco_min, preco_max, ordenar, apenas_ativos)`, usada pelo [repository](../repositories/README.md). Substitui as quatro procedures antigas (`sp_produtos_por_categoria` etc.), que o script apaga se existirem |
| Acerto de categoria | `UPDATE ... 'Lanche' → 'Salgado'`, para bancos criados por versões antigas do script |
| Dados de exemplo | 4 produtos (`Bebida`, `Salgado`, `Doce`). Só entram se ainda não existirem, então rodar o script de novo não duplica |

## Cuidados

- **Mantenha o script igual aos models.** Ao mudar um model, mude a tabela aqui também (e rode um `ALTER TABLE` no banco existente). O `db.create_all()` não altera tabelas que já existem.
- **Bancos criados antes da Fase 1** ainda têm a coluna `imagem` em `produto` (ela saiu do model e do script; é inofensiva). Se quiser limpar: `ALTER TABLE produto DROP COLUMN imagem;`.
- O script **não cria alunos**: cadastre pela tela de cadastro (as senhas são guardadas como hash).
- **A procedure nunca foi executada num MySQL real durante a Fase 1** (só no SQLite); teste a busca no MySQL antes de depender dela.
