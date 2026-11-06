from sqlalchemy import text

from backend.extensions import db
from backend.models.produto_model import Produto


class ProdutoRepository:
    """Consultas não-CRUD de produto: busca por categoria, por faixa de preço e ordenação.

    No MySQL, cada método chama uma stored procedure (ver backend/database/create-database.sql).
    Em outro banco (ex.: SQLite no Codespaces), faz a mesma consulta pelo ORM.
    Todos devolvem uma lista de objetos Produto.

    Fluxo:  Controller -> Service -> Repository -> CALL sp_...(...) -> MySQL
    """

    @staticmethod
    def buscar_por_categoria(categoria):
        banco = db.session.get_bind().dialect.name

        if banco == "mysql":
            sql = text("CALL sp_produtos_por_categoria(:categoria)")
            resultado = db.session.execute(sql, {"categoria": categoria})
            linhas = resultado.mappings().all()
            resultado.close()

            return [Produto(**dict(linha)) for linha in linhas]

        # Sem MySQL: a mesma busca pelo ORM
        return Produto.query.filter_by(categoria=categoria).all()

    @staticmethod
    def buscar_por_faixa_de_preco(preco_min, preco_max):
        banco = db.session.get_bind().dialect.name

        if banco == "mysql":
            sql = text("CALL sp_produtos_por_faixa_de_preco(:minimo, :maximo)")
            resultado = db.session.execute(sql, {"minimo": preco_min, "maximo": preco_max})
            linhas = resultado.mappings().all()
            resultado.close()

            return [Produto(**dict(linha)) for linha in linhas]

        return Produto.query.filter(Produto.preco_atual.between(preco_min, preco_max)).all()

    @staticmethod
    def ordenar_por_preco():
        banco = db.session.get_bind().dialect.name

        if banco == "mysql":
            sql = text("CALL sp_produtos_ordenar_por_preco()")
            resultado = db.session.execute(sql)
            linhas = resultado.mappings().all()
            resultado.close()

            return [Produto(**dict(linha)) for linha in linhas]

        return Produto.query.order_by(Produto.preco_atual, Produto.preco_promocional).all()

    @staticmethod
    def ordenar_por_nome():
        banco = db.session.get_bind().dialect.name

        if banco == "mysql":
            sql = text("CALL sp_produtos_ordenar_por_nome()")
            resultado = db.session.execute(sql)
            linhas = resultado.mappings().all()
            resultado.close()

            return [Produto(**dict(linha)) for linha in linhas]

        return Produto.query.order_by(Produto.nome).all()
