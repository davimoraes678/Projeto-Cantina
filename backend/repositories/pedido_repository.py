from backend.repositories.produto_repository import ProdutoRepository


class PedidoRepository:
    """Consultas não-CRUD de pedidos, feitas por stored procedures do MySQL.

    Fluxo (igual ao da busca de produtos):
        Controller -> Service -> PedidoRepository -> CALL sp_...(...) -> MySQL

    Reaproveita o ProdutoRepository._chamar_procedure, que monta o CALL e
    lança RuntimeError fora do MySQL (aí o service usa o fallback pelo ORM).
    """

    @staticmethod
    def itens_do_ultimo_pedido(id_aluno):
        # Linhas: [{"id_produto": 1, "quantidade": 2}, ...]
        return ProdutoRepository._chamar_procedure(
            "sp_repetir_ultimo_pedido", {"p_id_aluno": id_aluno}
        )

    @staticmethod
    def combinacoes_mais_pedidas():
        # Linhas: [{"id_produto_1", "nome_1", "id_produto_2", "nome_2", "vezes"}, ...]
        return ProdutoRepository._chamar_procedure("sp_combinacoes_mais_pedidas")
