-- Views do banco: funcionam no SQLite e no MySQL.
-- O app.py roda este arquivo ao iniciar, então não precisa rodar à mão.
-- No MySQL, as procedures do create-database.sql leem destas views.

-- Itens do último pedido de cada aluno (usada no "Repetir último pedido")
DROP VIEW IF EXISTS vw_itens_ultimo_pedido;
CREATE VIEW vw_itens_ultimo_pedido AS
SELECT
    p.id_aluno,
    i.id_produto,
    i.quantidade
FROM
    itens_pedido i
JOIN
    pedido p ON p.id_pedido = i.id_pedido
WHERE
    i.id_produto IS NOT NULL
    AND p.id_pedido = (
        SELECT MAX(p2.id_pedido)
        FROM pedido p2
        WHERE p2.id_aluno = p.id_aluno
    );

-- As 3 duplas de produtos mais pedidas juntas (pedidos cancelados não contam).
-- b.id_produto > a.id_produto evita contar Coxinha+Refri e Refri+Coxinha duas vezes
DROP VIEW IF EXISTS vw_combinacoes_mais_pedidas;
CREATE VIEW vw_combinacoes_mais_pedidas AS
SELECT
    a.id_produto AS id_produto_1,
    pa.nome AS nome_1,
    b.id_produto AS id_produto_2,
    pb.nome AS nome_2,
    COUNT(DISTINCT a.id_pedido) AS vezes
FROM
    itens_pedido a
JOIN
    itens_pedido b ON b.id_pedido = a.id_pedido AND b.id_produto > a.id_produto
JOIN
    pedido p ON p.id_pedido = a.id_pedido
JOIN
    produto pa ON pa.id_produto = a.id_produto
JOIN
    produto pb ON pb.id_produto = b.id_produto
WHERE
    p.status <> 'Cancelado'
GROUP BY
    a.id_produto, pa.nome, b.id_produto, pb.nome
ORDER BY
    vezes DESC, a.id_produto, b.id_produto
LIMIT 3;

-- Avaliações com o código do pedido e o nome do aluno, a mais nova primeiro
DROP VIEW IF EXISTS vw_avaliacoes;
CREATE VIEW vw_avaliacoes AS
SELECT
    av.id_avaliacao,
    av.nota,
    av.comentario,
    av.data_avaliacao,
    av.id_pedido,
    p.codigo,
    COALESCE(al.nome, p.nome_aluno) AS aluno_nome
FROM
    avaliacao av
JOIN
    pedido p ON p.id_pedido = av.id_pedido
LEFT JOIN
    aluno al ON al.id_aluno = p.id_aluno
ORDER BY
    av.id_avaliacao DESC;
