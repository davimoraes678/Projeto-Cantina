from flask_login import current_user

from backend.models.pedido_model import Pedido


class BuscarPedidoService:
    """Caso de uso: ver um pedido (o dono do pedido, ou admin/mestre)."""

    @staticmethod
    def executar(id_pedido):
        pedido = Pedido.buscar_por_id(id_pedido)
        eh_admin = current_user.funcao in ("admin", "mestre")
        if not pedido or (pedido.id_aluno != current_user.id_aluno and not eh_admin):
            return {"erro": "Pedido não encontrado"}, 404
        return pedido.to_dict(), 200
