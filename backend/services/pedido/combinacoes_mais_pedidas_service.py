from collections import Counter
from itertools import combinations

from backend.models.pedido_model import Pedido
from backend.repositories.pedido_repository import PedidoRepository


class CombinacoesMaisPedidasService:
    """Caso de uso: as 3 duplas de produtos mais pedidas juntas.

    Consulta não-CRUD: no MySQL usa a procedure sp_combinacoes_mais_pedidas (via
    PedidoRepository); em outro banco (ex.: SQLite) faz a mesma conta pelo ORM.
    """

    @staticmethod
    def executar():
        try:
            linhas = PedidoRepository.combinacoes_mais_pedidas()
        except Exception as e:
            print(f"[CombinacoesMaisPedidasService] Procedure indisponível, usando fallback ORM: {e}")
            linhas = CombinacoesMaisPedidasService._combinacoes_fallback_orm()

        # Cada linha vira o formato que o front usa: {produtos: [...], vezes}
        return [
            {"produtos": [{"id_produto": l["id_produto_1"], "nome": l["nome_1"]},
                          {"id_produto": l["id_produto_2"], "nome": l["nome_2"]}],
             "vezes": l["vezes"]}
            for l in linhas
        ], 200

    @staticmethod
    def _combinacoes_fallback_orm():
        """Mesmo resultado da sp_combinacoes_mais_pedidas, mas via SQLAlchemy."""
        # Conta quantas vezes cada dupla de produtos aparece no mesmo pedido
        contagem = Counter()
        pedidos = Pedido.query.filter(Pedido.status.notin_(["Carrinho", "Cancelado"])).all()
        for pedido in pedidos:
            produtos = sorted({item.produto for item in pedido.itens if item.produto}, key=lambda p: p.id_produto)
            for par in combinations(produtos, 2):
                contagem[par] += 1

        # Mais vezes primeiro; no empate, menor id primeiro (mesma ordem da procedure)
        top3 = sorted(contagem.items(), key=lambda x: (-x[1], x[0][0].id_produto, x[0][1].id_produto))[:3]
        return [{"id_produto_1": a.id_produto, "nome_1": a.nome,
                 "id_produto_2": b.id_produto, "nome_2": b.nome, "vezes": vezes}
                for (a, b), vezes in top3]
