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

-- id_aluno é NULLABLE de propósito: permite apagar o aluno sem apagar o pedido.
-- nome_aluno guarda uma "foto" do nome no momento do pedido, usada quando o
-- aluno já não existe mais.
CREATE TABLE IF NOT EXISTS pedido (
    id_pedido INT AUTO_INCREMENT PRIMARY KEY,
    data_hora_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Pendente',
    valor_total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    horario_agendado_retirada DATETIME DEFAULT NULL,
    data_hora_retirada DATETIME DEFAULT NULL,
    id_aluno INT NULL,
    nome_aluno VARCHAR(100) NULL,
    FOREIGN KEY (id_aluno) REFERENCES aluno(id_aluno) ON DELETE SET NULL
);

-- id_produto é NULLABLE de propósito: permite apagar o produto sem apagar o item já pedido.
-- nome_produto guarda uma "foto" do nome no momento do pedido.
CREATE TABLE IF NOT EXISTS itens_pedido (
    id_item_pedido INT AUTO_INCREMENT PRIMARY KEY,
    quantidade INT NOT NULL DEFAULT 1,
    preco_unitario_cobrado DECIMAL(10, 2) NOT NULL,
    id_pedido INT NOT NULL,
    id_produto INT NULL,
    nome_produto VARCHAR(100) NULL,
    FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido) ON DELETE CASCADE,
    FOREIGN KEY (id_produto) REFERENCES produto(id_produto) ON DELETE SET NULL
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
    id_aluno INT NULL,
    id_pedido INT NOT NULL,
    FOREIGN KEY (id_aluno) REFERENCES aluno(id_aluno) ON DELETE SET NULL,
    FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido)
);

-- =========================================================================
-- PROCEDURES DE BUSCA DE PRODUTO
-- Chamadas apenas pelo ProdutoRepository (backend/repositories/produto_repository.py)
-- via `CALL sp_...`. Controller e Service nunca as chamam diretamente.
-- =========================================================================

DELIMITER $

DROP PROCEDURE IF EXISTS sp_produtos_por_categoria $
CREATE PROCEDURE sp_produtos_por_categoria (IN p_categoria VARCHAR(100))
BEGIN
    SELECT
        id_produto,
        nome,
        quantidade_estoque,
        preco_atual,
        preco_promocional,
        ingredientes,
        categoria,
        status
    FROM
        produto
    WHERE
        categoria = p_categoria;
END $

DROP PROCEDURE IF EXISTS sp_produtos_por_faixa_de_preco $
CREATE PROCEDURE sp_produtos_por_faixa_de_preco (IN p_min DECIMAL(10,2), IN p_max DECIMAL(10,2))
BEGIN
    SELECT
        id_produto,
        nome,
        quantidade_estoque,
        preco_atual,
        preco_promocional,
        ingredientes,
        categoria,
        status
    FROM
        produto
    WHERE
        preco_atual BETWEEN p_min AND p_max;
END $

DROP PROCEDURE IF EXISTS sp_produtos_ordenar_por_preco $
CREATE PROCEDURE sp_produtos_ordenar_por_preco ()
BEGIN
    SELECT
        id_produto,
        nome,
        quantidade_estoque,
        preco_atual,
        preco_promocional,
        ingredientes,
        categoria,
        status
    FROM
        produto
    ORDER BY
        preco_atual, preco_promocional;
END $

DROP PROCEDURE IF EXISTS sp_produtos_ordenar_por_nome $
CREATE PROCEDURE sp_produtos_ordenar_por_nome ()
BEGIN
    SELECT
        id_produto,
        nome,
        quantidade_estoque,
        preco_atual,
        preco_promocional,
        ingredientes,
        categoria,
        status
    FROM
        produto
    ORDER BY
        nome;
END $

DELIMITER ;

INSERT INTO aluno (nome, email, senha, saldo) VALUES
('João Silva', 'joao.silva@example.com', 'hashed_password_1', 100.00),
('Maria Oliveira', 'maria.oliveira@example.com', 'hashed_password_2', 150.00),
('Pedro Santos', 'pedro.santos@example.com', 'hashed_password_3', 200.00),
('Ana Costa', 'ana.costa@example.com', 'hashed_password_4', 250.00);

INSERT INTO produto (nome, preco_atual, quantidade_estoque, categoria) VALUES
('Sanduíche Natural', 10.00, 20, 'Lanche'),
('Suco de Laranja', 5.00, 30, 'Bebida'),
('Salada de Frutas', 7.50, 15, 'Doce'),
('Água Mineral', 2.00, 50, 'Bebida');
