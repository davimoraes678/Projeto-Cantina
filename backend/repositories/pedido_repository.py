from collections import Counter
from itertools import combinations

from sqlalchemy import text

from backend.extensions import db
from backend.models.pedido_model import Pedido


# No MySQL chama a procedure; em outro banco (SQLite) faz a mesma consulta pelo ORM
class PedidoRepository:
    @staticmethod
    def itens_do_ultimo_pedido(id_aluno):
        banco = db.session.get_bind().dialect.name

        if banco == "mysql":
            sql = text("CALL sp_repetir_ultimo_pedido(:id_aluno)")
            resultado = db.session.execute(sql, {"id_aluno": id_aluno})
            linhas = resultado.mappings().all()
            resultado.close()

            return [dict(linha) for linha in linhas]

        ultimo = Pedido.query.filter_by(id_aluno=id_aluno).order_by(Pedido.id_pedido.desc()).first()
        if not ultimo:
            return []
        # Pula produtos excluídos
        return [{"id_produto": item.id_produto, "quantidade": item.quantidade}
                for item in ultimo.itens if item.id_produto]

    @staticmethod
    def combinacoes_mais_pedidas():
        banco = db.session.get_bind().dialect.name

        if banco == "mysql":
            sql = text("CALL sp_combinacoes_mais_pedidas()")
            resultado = db.session.execute(sql)
            linhas = resultado.mappings().all()
            resultado.close()

            return [dict(linha) for linha in linhas]

        # Conta quantas vezes cada dupla aparece no mesmo pedido
        contagem = Counter()
        for pedido in Pedido.query.filter(Pedido.status != "Cancelado").all():
            produtos = sorted({item.produto for item in pedido.itens if item.produto}, key=lambda p: p.id_produto)
            for dupla in combinations(produtos, 2):
                contagem[dupla] += 1

        # Mesma ordem da procedure
        top3 = sorted(contagem.items(), key=lambda x: (-x[1], x[0][0].id_produto, x[0][1].id_produto))[:3]
        return [{"id_produto_1": a.id_produto, "nome_1": a.nome,
                 "id_produto_2": b.id_produto, "nome_2": b.nome, "vezes": vezes}
                for (a, b), vezes in top3]
