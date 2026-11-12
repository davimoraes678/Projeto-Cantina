from sqlalchemy import text

from backend.extensions import db


# No MySQL chama a procedure; no SQLite lê direto da view (as duas estão nos arquivos .sql)
class PedidoRepository:
    @staticmethod
    def itens_do_ultimo_pedido(id_aluno):
        banco = db.session.get_bind().dialect.name

        if banco == "mysql":
            sql = text("CALL sp_repetir_ultimo_pedido(:id_aluno)")
        else:
            sql = text("SELECT id_produto, quantidade FROM vw_itens_ultimo_pedido WHERE id_aluno = :id_aluno")

        resultado = db.session.execute(sql, {"id_aluno": id_aluno})
        linhas = resultado.mappings().all()
        resultado.close()

        return [dict(linha) for linha in linhas]

    @staticmethod
    def combinacoes_mais_pedidas():
        banco = db.session.get_bind().dialect.name

        if banco == "mysql":
            sql = text("CALL sp_combinacoes_mais_pedidas()")
        else:
            sql = text("SELECT * FROM vw_combinacoes_mais_pedidas")

        resultado = db.session.execute(sql)
        linhas = resultado.mappings().all()
        resultado.close()

        return [dict(linha) for linha in linhas]
