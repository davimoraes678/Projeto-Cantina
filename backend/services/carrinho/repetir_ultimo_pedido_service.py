from flask_login import current_user

from backend.models.pedido_model import Pedido, STATUS_CARRINHO
from backend.repositories.pedido_repository import PedidoRepository
from backend.services.carrinho.adicionar_item_carrinho_service import AdicionarItemCarrinhoService


class RepetirUltimoPedidoService:
    """Caso de uso: colocar no carrinho os mesmos itens do último pedido do aluno.

    Consulta não-CRUD: no MySQL usa a procedure sp_repetir_ultimo_pedido (via
    PedidoRepository); em outro banco (ex.: SQLite) faz a mesma consulta pelo ORM.
    """

    @staticmethod
    def executar():
        try:
            itens = PedidoRepository.itens_do_ultimo_pedido(current_user.id_aluno)
        except Exception as e:
            print(f"[RepetirUltimoPedidoService] Procedure indisponível, usando fallback ORM: {e}")
            itens = RepetirUltimoPedidoService._itens_do_ultimo_pedido_orm()

        if not itens:
            return {"erro": "Você não tem um pedido anterior com produtos à venda"}, 404

        # Reaproveita o caso de uso "adicionar item": mesmas regras de quantidade e preço
        for item in itens:
            resposta, status = AdicionarItemCarrinhoService.executar(
                {"id_produto": item["id_produto"], "quantidade": item["quantidade"]})
        return resposta, status

    @staticmethod
    def _itens_do_ultimo_pedido_orm():
        """Mesmo resultado da sp_repetir_ultimo_pedido, mas via SQLAlchemy."""
        ultimo = (Pedido.query
                  .filter(Pedido.id_aluno == current_user.id_aluno, Pedido.status != STATUS_CARRINHO)
                  .order_by(Pedido.id_pedido.desc())
                  .first())
        if not ultimo:
            return []
        # Produtos excluídos depois do pedido ficam com id_produto vazio e são pulados
        return [{"id_produto": item.id_produto, "quantidade": item.quantidade}
                for item in ultimo.itens if item.id_produto]
