from backend.extensions import db
from backend.models.produto_model import Produto


class DeletarProdutoService:
    """Caso de uso: excluir produto (só o mestre). Os pedidos antigos mantêm o nome dele."""

    @staticmethod
    def executar(id_produto):
        produto = Produto.buscar_por_id(id_produto)
        if not produto:
            return {"erro": "Produto não encontrado"}, 404

        try:
            # Antes de apagar o produto, preserva o histórico dos itens de pedido que o usam:
            # guarda o nome (caso ainda não tenha sido salvo) e solta o vínculo com o produto,
            # para que o pedido continue existindo mesmo depois do produto ser excluído.
            for item in produto.itens_pedido:
                if not item.nome_produto:
                    item.nome_produto = produto.nome
                item.id_produto = None

            produto.deletar()
            return {"mensagem": "Produto deletado com sucesso"}, 200
        except Exception as e:
            db.session.rollback()
            return {"erro": f"Falha ao deletar produto: {str(e)}"}, 500
