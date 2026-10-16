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

-- Categorias aceitas: Bebida, Salgado, Doce (constante CATEGORIAS em backend/constantes.py).
-- Versões antigas deste script usavam 'Lanche'; esta linha acerta bancos já existentes.
UPDATE produto SET categoria = 'Salgado' WHERE categoria = 'Lanche';

-- =========================================================================
-- PROCEDURE DE BUSCA DE PRODUTO
-- Chamada apenas pelo ProdutoRepository (backend/repositories/produto_repository.py)
-- via `CALL sp_produtos_buscar(...)`. Controller e Service nunca a chamam diretamente.
-- Todos os parâmetros são opcionais (NULL = não filtrar) e os filtros se combinam.
-- Mantenha a regra igual à de ProdutoService._buscar_orm (a busca do SQLite).
-- =========================================================================

DELIMITER $

DROP PROCEDURE IF EXISTS sp_produtos_por_categoria $
DROP PROCEDURE IF EXISTS sp_produtos_por_faixa_de_preco $
DROP PROCEDURE IF EXISTS sp_produtos_ordenar_por_preco $
DROP PROCEDURE IF EXISTS sp_produtos_ordenar_por_nome $
DROP PROCEDURE IF EXISTS sp_produtos_buscar $
CREATE PROCEDURE sp_produtos_buscar (
    IN p_categoria VARCHAR(100),
    IN p_preco_min DECIMAL(10,2),
    IN p_preco_max DECIMAL(10,2),
    IN p_ordenar VARCHAR(10),       -- 'nome', 'preco' ou NULL
    IN p_apenas_ativos TINYINT      -- 1 = só produtos disponíveis
)
BEGIN
    SELECT
        id_produto,
        nome,
        quantidade_estoque,
        preco_atual,
        preco_promocional,
        ingredientes,
        tabela_nutricional,
        categoria,
        status
    FROM
        produto
    WHERE
        (p_categoria IS NULL OR categoria = p_categoria)
        AND (p_preco_min IS NULL OR preco_atual >= p_preco_min)
        AND (p_preco_max IS NULL OR preco_atual <= p_preco_max)
        AND (p_apenas_ativos = 0 OR status = TRUE)
    ORDER BY
        CASE WHEN p_ordenar = 'preco' THEN preco_atual END,
        CASE WHEN p_ordenar = 'nome' THEN nome END,
        id_produto;
END $

DELIMITER ;

-- =========================================================================
-- DADOS DE EXEMPLO (só entram se o produto ainda não existir; pode rodar o script de novo)
-- =========================================================================

INSERT INTO produto (nome, quantidade_estoque, preco_atual, categoria, ingredientes)
SELECT * FROM (
    SELECT 'Suco de Laranja' AS nome, 20 AS quantidade_estoque, 5.00 AS preco_atual, 'Bebida' AS categoria, 'Laranja' AS ingredientes
    UNION ALL SELECT 'Coxinha', 15, 6.50, 'Salgado', 'Massa, frango e catupiry'
    UNION ALL SELECT 'Pão de Queijo', 25, 4.00, 'Salgado', 'Polvilho, queijo e ovos'
    UNION ALL SELECT 'Brigadeiro', 30, 3.00, 'Doce', 'Leite condensado, chocolate e manteiga'
) AS exemplo
WHERE NOT EXISTS (SELECT 1 FROM produto WHERE produto.nome = exemplo.nome);
