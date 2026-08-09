CREATE DATABASE IF NOT EXISTS cantina_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE cantina_db;

CREATE TABLE IF NOT EXISTS aluno (
    id_aluno INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    saldo DECIMAL(10, 2) NOT NULL DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS produto (
    id_produto INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    quantidade_estoque INT NOT NULL DEFAULT 0,
    tabela_nutricional VARCHAR(500),
    preco_atual DECIMAL(10, 2) NOT NULL,
    preco_promocional DECIMAL(10, 2),
    ingredientes VARCHAR(500),
    categoria VARCHAR(100),
    status BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS pedido (
    id_pedido INT AUTO_INCREMENT PRIMARY KEY,
    data_hora_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Pendente',
    valor_total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    horario_agendado_retirada DATETIME DEFAULT NULL,
    data_hora_retirada DATETIME DEFAULT NULL,
    id_aluno INT NOT NULL,
    FOREIGN KEY (id_aluno) REFERENCES aluno(id_aluno)
);

CREATE TABLE IF NOT EXISTS itens_pedido (
    id_item_pedido INT AUTO_INCREMENT PRIMARY KEY,
    quantidade INT NOT NULL DEFAULT 1,
    preco_unitario_cobrado DECIMAL(10, 2) NOT NULL,
    id_pedido INT NOT NULL,
    id_produto INT NOT NULL,
    FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido),
    FOREIGN KEY (id_produto) REFERENCES produto(id_produto)
);

CREATE TABLE IF NOT EXISTS avaliacao (
    id_avaliacao INT AUTO_INCREMENT PRIMARY KEY,
    nota INT NOT NULL,
    comentario VARCHAR(500),
    data_avaliacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    id_pedido INT NOT NULL UNIQUE,
    FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido)
);

CREATE TABLE IF NOT EXISTS rateio (
    id_rateio INT AUTO_INCREMENT PRIMARY KEY,
    valor_parte DECIMAL(10, 2) NOT NULL,
    status_pagamento VARCHAR(50) DEFAULT 'Pendente',
    id_aluno INT NOT NULL,
    id_pedido INT NOT NULL,
    FOREIGN KEY (id_aluno) REFERENCES aluno(id_aluno),
    FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido)
);

delimiter $
create or replace procedure buscar_por_categoria (in p_categoria varchar(100))
begin
    select 
        nome, 
        quantidade_estoque, 
        preco_atual, 
        preco_promocional, 
        ingredientes, 
        categoria, 
        status
    from
        produto
    where
        categoria = p_categoria;
END $
DELIMITER ;

delimiter $
create or replace procedure ordenar_por_preco (in p_categoria varchar(100))
begin
    select 
        nome, 
        quantidade_estoque, 
        preco_atual, 
        preco_promocional, 
        ingredientes, 
        categoria, 
        status
    from
        produto
    order by
        preco_atual, preco_promocional;
END $
DELIMITER ;
delimiter $
create or replace procedure ordenar_por_nome ()
begin
    select 
        nome, 
        quantidade_estoque, 
        preco_atual, 
        preco_promocional, 
        ingredientes, 
        categoria, 
        status
    from
        produto
    order by
        nome;
END $
DELIMITER ;
delimiter $
create or replace procedure buscar_por_faixa_de_preco (in p_min int, in p_max int)
begin
    select 
        nome, 
        quantidade_estoque, 
        preco_atual, 
        preco_promocional, 
        ingredientes, 
        categoria, 
        status
    from
        produto
    where
        preco between p_min and p_max;
END $
DELIMITER ;

INSERT INTO aluno (nome, email, senha, saldo) VALUES
('João Silva', 'joao.silva@example.com', 'hashed_password_1', 100.00),
('Maria Oliveira', 'maria.oliveira@example.com', 'hashed_password_2', 150.00),
('Pedro Santos', 'pedro.santos@example.com', 'hashed_password_3', 200.00),
('Ana Costa', 'ana.costa@example.com', 'hashed_password_4', 250.00);

INSERT INTO produto (nome, preco_atual, quantidade_estoque) VALUES
('Sanduíche Natural', 10.00, 20),
('Suco de Laranja', 5.00, 30),
('Salada de Frutas', 7.50, 15),
('Água Mineral', 2.00, 50);
