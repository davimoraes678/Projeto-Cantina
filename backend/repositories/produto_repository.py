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
    def usa_procedures():
        """As procedures só existem no MySQL (ver backend/database/create-database.sql).
        Em outro banco (ex.: SQLite em desenvolvimento) o service busca pelo ORM."""
        return db.engine.dialect.name == "mysql"

    @staticmethod
    def buscar(categoria=None, preco_min=None, preco_max=None, ordenar=None, apenas_ativos=False):
        """CALL sp_produtos_buscar: todos os filtros são opcionais e se combinam (None = não filtrar)."""
        parametros = {
            "p_categoria": categoria,
            "p_preco_min": preco_min,
            "p_preco_max": preco_max,
            "p_ordenar": ordenar,
            "p_apenas_ativos": 1 if apenas_ativos else 0,
        }
        placeholders = ", ".join(f":{chave}" for chave in parametros)
        resultado = db.session.execute(text(f"CALL sp_produtos_buscar({placeholders})"), parametros)
        colunas = list(resultado.keys())
        return [dict(zip(colunas, linha)) for linha in resultado.fetchall()]
