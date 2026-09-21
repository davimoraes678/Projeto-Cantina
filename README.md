# Projeto-Cantina
Integrantes
Caio Antunes Guedes Alves da SIlva -12501719
Davi Pimentel de Moraes - 12502120
Ana Julia Gois do Nascimento - 22401369
João Vitor Marques de Sampaio - 22400540
Felipe Ferreira da Fonseca - 12502537
Maria Eduarda Fidelis Correa - 12401595
Stack front end
HTML, CSS, JavaScript 
Stack back end
Python, Flask
Banco de dados 
MySQL 

## Front-end Cantina Real integrado

O front-end mobile da Cantina Real agora é servido pelo próprio Flask. Não é
necessário iniciar o antigo servidor Node: execute somente `python app.py` e
abra `http://localhost:5000`.

Fluxos integrados:

- cadastro e login por matrícula ou email;
- cardápio, busca e filtro por categoria;
- carrinho e escolha de horário;
- criação e acompanhamento de pedidos;
- painel da cozinha e atualização de status;
- redução de estoque e cálculo do preço exclusivamente no servidor.

Copie `.env.example` para `.env`, configure `DATABASE_URL` e defina uma
`AUTH_SECRET_KEY` longa e aleatória. Se o banco MySQL já existia antes desta
integração, execute uma vez:

```
mysql -u root -p < backend/database/migrate_add_matricula.sql
```

## Rodando com MySQL (necessário para a busca de produtos)

A busca/filtro de produtos (`GET /api/produtos/buscar`) chama stored procedures
via `backend/repositories/produto_repository.py` (fluxo `Controller -> Service ->
Repository -> CALL sp_...(...) -> MySQL`). Isso só funciona com MySQL - o
fallback padrão em SQLite não suporta procedures.

1. Crie o banco e as procedures:
   ```
   mysql --default-character-set=utf8mb4 -u root -p < backend/database/create-database.sql
   ```
2. Copie `.env.example` para `.env` e ajuste usuário/senha e a chave de autenticação:
   ```
   DATABASE_URL=mysql+pymysql://usuario:senha@localhost/cantina_db?charset=utf8mb4
   ```
3. Rode a aplicação normalmente (`python app.py`).

Sem essa configuração, o resto do app (cadastro/listagem de alunos, produtos e
pedidos) continua funcionando em SQLite, mas a busca retorna erro 503 pedindo
pra configurar o MySQL.
