from backend.models.pedido_model import Pedido
from backend.repositories.avaliacao_repository import AvaliacaoRepository


class ListarAvaliacaoService:
    @staticmethod
    def executar():
        avaliacoes = AvaliacaoRepository.listar()

        for avaliacao in avaliacoes:
            # Data no mesmo formato nos dois bancos: "2026-11-12T10:30:00"
            data = avaliacao["data_avaliacao"]
            avaliacao["data_avaliacao"] = str(data).replace(" ", "T") if data else None

            pedido = Pedido.buscar_por_id(avaliacao["id_pedido"])
            avaliacao["itens"] = [item.to_dict() for item in pedido.itens]

        return avaliacoes, 200
