from sqlalchemy import text
from backend.extensions import db


class ProdutoRepository:
    """Única camada da aplicação que conhece e executa os `CALL sp_...`.

    Fluxo:
        Controller -> Service -> Repository -> CALL sp_...(...) -> MySQL

    Controller e Service nunca montam SQL nem chamam procedure diretamente;
    apenas pedem ao repository o resultado já pronto.
    """

    @staticmethod
    def _chamar_procedure(nome_procedure, params=None):
        params = params or {}

        if db.engine.dialect.name != "mysql":
            # As procedures só existem no MySQL (ver backend/database/create-database.sql).
            # Se a app estiver rodando com outro banco (ex.: SQLite em DATABASE_URL),
            # a busca não tem como funcionar - avisamos isso claramente ao dev.
            raise RuntimeError(
                "A busca de produtos depende de stored procedures do MySQL. "
                "Configure DATABASE_URL no .env apontando para o MySQL, por exemplo: "
                "mysql+pymysql://usuario:senha@localhost/cantina_db?charset=utf8mb4"
            )

        placeholders = ", ".join(f":{chave}" for chave in params.keys())
        sql = text(f"CALL {nome_procedure}({placeholders})")

        resultado = db.session.execute(sql, params)
        colunas = resultado.keys()
        linhas = resultado.fetchall()
        return [dict(zip(colunas, linha)) for linha in linhas]

    @staticmethod
    def buscar_por_categoria(categoria):
        return ProdutoRepository._chamar_procedure(
            "sp_produtos_por_categoria", {"p_categoria": categoria}
        )

    @staticmethod
    def buscar_por_faixa_de_preco(preco_min, preco_max):
        return ProdutoRepository._chamar_procedure(
            "sp_produtos_por_faixa_de_preco", {"p_min": preco_min, "p_max": preco_max}
        )

    @staticmethod
    def ordenar_por_preco():
        return ProdutoRepository._chamar_procedure("sp_produtos_ordenar_por_preco")

    @staticmethod
    def ordenar_por_nome():
        return ProdutoRepository._chamar_procedure("sp_produtos_ordenar_por_nome")
