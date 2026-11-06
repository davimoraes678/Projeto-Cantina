from collections import Counter
from itertools import combinations

from sqlalchemy import text

from backend.extensions import db
from backend.models.pedido_model import Pedido


class PedidoRepository:
    """Consultas não-CRUD de pedido: repetir o último pedido e combinações mais pedidas.

    No MySQL, cada método chama uma stored procedure (ver backend/database/create-database.sql).
    Em outro banco (ex.: SQLite no Codespaces), faz a mesma consulta pelo ORM.
    O resultado não é um model (são colunas calculadas), por isso volta como dicionários.
    """

    @staticmethod
    def itens_do_ultimo_pedido(id_aluno):
        """Itens do último pedido do aluno: [{"id_produto": 1, "quantidade": 2}, ...]"""
        banco = db.session.get_bind().dialect.name

        if banco == "mysql":
            sql = text("CALL sp_repetir_ultimo_pedido(:id_aluno)")
            resultado = db.session.execute(sql, {"id_aluno": id_aluno})
            linhas = resultado.mappings().all()
            resultado.close()

            return [dict(linha) for linha in linhas]

        # Sem MySQL: a mesma consulta pelo ORM
        ultimo = Pedido.query.filter_by(id_aluno=id_aluno).order_by(Pedido.id_pedido.desc()).first()
        if not ultimo:
            return []
        # Produtos excluídos depois do pedido ficam com id_produto vazio e são pulados
        return [{"id_produto": item.id_produto, "quantidade": item.quantidade}
                for item in ultimo.itens if item.id_produto]

    @staticmethod
    def combinacoes_mais_pedidas():
        """As 3 duplas de produtos mais pedidas juntas:
        [{"id_produto_1", "nome_1", "id_produto_2", "nome_2", "vezes"}, ...]"""
        banco = db.session.get_bind().dialect.name

        if banco == "mysql":
            sql = text("CALL sp_combinacoes_mais_pedidas()")
            resultado = db.session.execute(sql)
            linhas = resultado.mappings().all()
            resultado.close()

            return [dict(linha) for linha in linhas]

        # Sem MySQL: conta quantas vezes cada dupla aparece no mesmo pedido (cancelados não contam)
        contagem = Counter()
        for pedido in Pedido.query.filter(Pedido.status != "Cancelado").all():
            produtos = sorted({item.produto for item in pedido.itens if item.produto}, key=lambda p: p.id_produto)
            for dupla in combinations(produtos, 2):
                contagem[dupla] += 1

        # Mais vezes primeiro; no empate, menor id primeiro (a mesma ordem da procedure)
        top3 = sorted(contagem.items(), key=lambda x: (-x[1], x[0][0].id_produto, x[0][1].id_produto))[:3]
        return [{"id_produto_1": a.id_produto, "nome_1": a.nome,
                 "id_produto_2": b.id_produto, "nome_2": b.nome, "vezes": vezes}
                for (a, b), vezes in top3]
