from backend.repositories.pedido_repository import PedidoRepository


class CombinacoesMaisPedidasService:
    """Caso de uso: as 3 duplas de produtos mais pedidas juntas.

    A consulta é do PedidoRepository (procedure sp_combinacoes_mais_pedidas no
    MySQL, ORM nos outros bancos). Aqui só montamos o formato que o front-end usa.
    """

    @staticmethod
    def executar():
        linhas = PedidoRepository.combinacoes_mais_pedidas()

        # Cada linha vira: {produtos: [{id_produto, nome}, {id_produto, nome}], vezes}
        return [
            {"produtos": [{"id_produto": l["id_produto_1"], "nome": l["nome_1"]},
                          {"id_produto": l["id_produto_2"], "nome": l["nome_2"]}],
             "vezes": l["vezes"]}
            for l in linhas
        ], 200
