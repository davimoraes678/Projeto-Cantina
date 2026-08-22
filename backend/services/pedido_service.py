from backend.models.pedido_model import Pedido
from backend.models.item_pedido import ItemPedido
from backend.models.produto_model import Produto
from backend.models.aluno_model import Aluno
from backend.extensions import db
from datetime import datetime


def _parse_datetime(valor):
    """Converte string ISO (ex.: vinda de <input type="datetime-local">, no
    formato 'YYYY-MM-DDTHH:MM') em datetime de verdade. O SQLite (e o
    SQLAlchemy) recusam strings cruas em colunas DateTime - precisa ser um
    objeto datetime. Retorna None se vier vazio/None."""
    if not valor:
        return None
    if isinstance(valor, datetime):
        return valor
    try:
        return datetime.fromisoformat(valor)
    except ValueError:
        return None


class PedidoService:
    @staticmethod
    def criar(data):
        id_aluno = data.get('id_aluno')
        itens_data = data.get('itens', []) # Espera uma lista de dicts: [{"id_produto": 1, "quantidade": 2}, ...]

        if not id_aluno or not itens_data:
            return {"erro": "Aluno e itens são obrigatórios para fechar um pedido"}, 400

        aluno = Aluno.buscar_por_id(id_aluno)
        if not aluno:
            return {"erro": f"Aluno ID {id_aluno} não encontrado"}, 404

        try:
            # 1. Cria a instância do pedido base, guardando uma "foto" do nome do aluno
            novo_pedido = Pedido(
                id_aluno=id_aluno,
                nome_aluno=aluno.nome,
                status="Pendente",
                horario_agendado_retirada=_parse_datetime(data.get('horario_agendado_retirada'))
            )
            db.session.add(novo_pedido)
            db.session.flush() # Gera o id_pedido antes do commit definitivo

            # 2. Processa cada item do pedido (permite múltiplos produtos por pedido)
            for item in itens_data:
                quantidade = item.get('quantidade', 1)
                if not quantidade or quantidade < 1:
                    db.session.rollback()
                    return {"erro": "Quantidade inválida em um dos itens do pedido"}, 400

                produto = Produto.buscar_por_id(item.get('id_produto'))
                if not produto:
                    db.session.rollback()
                    return {"erro": f"Produto ID {item.get('id_produto')} não encontrado"}, 404

                # Cria o vínculo do item com o histórico de preço e nome daquele momento
                novo_item_pedido = ItemPedido(
                    id_pedido=novo_pedido.id_pedido,
                    id_produto=produto.id_produto,
                    nome_produto=produto.nome,
                    quantidade=quantidade,
                    preco_unitario_cobrado=produto.preco_atual
                )
                db.session.add(novo_item_pedido)

            db.session.commit() # Salva temporariamente para calcular

            # 3. Calcula o total utilizando a função interna da model Pedido
            novo_pedido.calcular_total()
            db.session.commit()

            return novo_pedido.to_dict(), 201

        except Exception as e:
            db.session.rollback()
            return {"erro": f"Falha ao criar pedido: {str(e)}"}, 500

    @staticmethod
    def listar_todos():
        pedidos = Pedido.listar_todos()
        return [p.to_dict() for p in pedidos], 200

    @staticmethod
    def buscar_por_id(id_pedido):
        pedido = Pedido.buscar_por_id(id_pedido)
        if not pedido:
            return {"erro": "Pedido não encontrado"}, 404
        return pedido.to_dict(), 200

    @staticmethod
    def atualizar_status(id_pedido, data):
        pedido = Pedido.buscar_por_id(id_pedido)
        if not pedido:
            return {"erro": "Pedido não encontrado"}, 404

        pedido.atualizar(
            status=data.get('status'),
            data_hora_retirada=_parse_datetime(data.get('data_hora_retirada')),
            horario_agendado_retirada=_parse_datetime(data.get('horario_agendado_retirada'))
        )
        return pedido.to_dict(), 200
