from backend.repositories.pedido_repository import PedidoRepository


class CombinacoesMaisPedidasService:
    @staticmethod
    def executar():
        return PedidoRepository.combinacoes_mais_pedidas(), 200
