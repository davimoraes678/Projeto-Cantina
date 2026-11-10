from sqlalchemy import text

from backend.extensions import db
from backend.models.pedido_model import Pedido


# Consultas por stored procedure
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
        sql = text("CALL sp_combinacoes_mais_pedidas()")
        resultado = db.session.execute(sql)
        linhas = resultado.mappings().all()
        resultado.close()

        return [dict(linha) for linha in linhas]
