from collections import defaultdict
from backend.models.avaliacao_model import Avaliacao

class FiltrarPorCategoriaService:
    @staticmethod
    def executar():
        resultado = defaultdict(list)

        for avaliacao in Avaliacao.listar_todos():
            for item in avaliacao.pedido.itens:
                resultado[item.to_dict()["produto_nome"]].append(
                    avaliacao.to_dict()
                )

        return dict(resultado), 200