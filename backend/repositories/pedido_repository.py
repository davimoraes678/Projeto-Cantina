from sqlalchemy import text

from backend.extensions import db
from backend.models.pedido_model import Pedido


# No MySQL chama a procedure; em outro banco (SQLite) faz a mesma consulta sem procedure
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
        else:
            # Sem MySQL (SQLite) não há procedure: mesma consulta da sp_combinacoes_mais_pedidas
            sql = text("""
                SELECT a.id_produto AS id_produto_1, pa.nome AS nome_1,
                       b.id_produto AS id_produto_2, pb.nome AS nome_2,
                       COUNT(DISTINCT a.id_pedido) AS vezes
                FROM itens_pedido a
                JOIN itens_pedido b ON b.id_pedido = a.id_pedido AND b.id_produto > a.id_produto
                JOIN pedido p ON p.id_pedido = a.id_pedido
                JOIN produto pa ON pa.id_produto = a.id_produto
                JOIN produto pb ON pb.id_produto = b.id_produto
                WHERE p.status <> 'Cancelado'
                GROUP BY a.id_produto, pa.nome, b.id_produto, pb.nome
                ORDER BY vezes DESC, a.id_produto, b.id_produto
                LIMIT 3
            """)

        resultado = db.session.execute(sql)
        linhas = resultado.mappings().all()
        resultado.close()

        return [dict(linha) for linha in linhas]
