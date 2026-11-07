from backend.repositories.pedido_repository import PedidoRepository


class CombinacoesMaisPedidasService:
    @staticmethod
    def executar():
        linhas = PedidoRepository.combinacoes_mais_pedidas()

        return [
            {"produtos": [{"id_produto": l["id_produto_1"], "nome": l["nome_1"]},
                          {"id_produto": l["id_produto_2"], "nome": l["nome_2"]}],
             "vezes": l["vezes"]}
            for l in linhas
        ], 200
