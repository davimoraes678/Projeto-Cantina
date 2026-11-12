CREATE DATABASE IF NOT EXISTS cantina_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE cantina_db;

CREATE TABLE IF NOT EXISTS aluno (
    id_aluno INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    saldo DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    funcao VARCHAR(20) DEFAULT "aluno"
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
    imagem VARCHAR(100),
    status BOOLEAN DEFAULT TRUE
);

-- id_aluno pode ser NULL: apagar o aluno não apaga o pedido
CREATE TABLE IF NOT EXISTS pedido (
    id_pedido INT AUTO_INCREMENT PRIMARY KEY,
    data_hora_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Pendente',
    valor_total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    horario_agendado_retirada DATETIME DEFAULT NULL,
    data_hora_retirada DATETIME DEFAULT NULL,
    id_aluno INT NULL,
    nome_aluno VARCHAR(100) NULL,
    codigo VARCHAR(4), -- código de retirada, ex.: 4K9P
    FOREIGN KEY (id_aluno) REFERENCES aluno(id_aluno) ON DELETE SET NULL
);

-- Carrinho: id_pedido NULL e id_aluno = dono. Depois de finalizar: id_pedido preenchido e id_aluno NULL
CREATE TABLE IF NOT EXISTS itens_pedido (
    id_item_pedido INT AUTO_INCREMENT PRIMARY KEY,
    quantidade INT NOT NULL DEFAULT 1,
    preco_unitario_cobrado DECIMAL(10, 2) NOT NULL,
    id_pedido INT NULL,
    id_aluno INT NULL,
    id_produto INT NULL,
    nome_produto VARCHAR(100) NULL,
    FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido) ON DELETE CASCADE,
    FOREIGN KEY (id_aluno) REFERENCES aluno(id_aluno) ON DELETE CASCADE,
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

-- Procedures

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

-- Consultas não CRUD

-- As procedures abaixo leem das views do views.sql (rode ele depois deste arquivo,
-- ou só inicie o app, que cria as views sozinho)

DROP PROCEDURE IF EXISTS sp_repetir_ultimo_pedido $
CREATE PROCEDURE sp_repetir_ultimo_pedido (IN p_id_aluno INT)
BEGIN
    SELECT id_produto, quantidade
    FROM vw_itens_ultimo_pedido
    WHERE id_aluno = p_id_aluno;
END $

DROP PROCEDURE IF EXISTS sp_combinacoes_mais_pedidas $
CREATE PROCEDURE sp_combinacoes_mais_pedidas ()
BEGIN
    SELECT * FROM vw_combinacoes_mais_pedidas;
END $

DROP PROCEDURE IF EXISTS sp_listar_avaliacoes $
CREATE PROCEDURE sp_listar_avaliacoes ()
BEGIN
    SELECT * FROM vw_avaliacoes;
END $

DELIMITER ;

