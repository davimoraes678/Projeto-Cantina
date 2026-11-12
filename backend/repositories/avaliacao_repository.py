from sqlalchemy import text

from backend.extensions import db


# No MySQL chama a procedure; no SQLite lê direto da view (as duas estão nos arquivos .sql)
class AvaliacaoRepository:
    @staticmethod
    def listar():
        banco = db.session.get_bind().dialect.name

        if banco == "mysql":
            sql = text("CALL sp_listar_avaliacoes()")
        else:
            sql = text("SELECT * FROM vw_avaliacoes")

        resultado = db.session.execute(sql)
        linhas = resultado.mappings().all()
        resultado.close()

        return [dict(linha) for linha in linhas]
