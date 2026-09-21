USE cantina_db;

-- Execute uma única vez somente em bancos criados antes da integração
-- com o front-end Cantina Real. Bancos novos já recebem essa coluna pelo
-- arquivo create-database.sql.
ALTER TABLE aluno
    ADD COLUMN matricula VARCHAR(30) NULL UNIQUE AFTER nome;

