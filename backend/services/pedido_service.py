from backend.models.pedido_model import Pedido
from backend.models.item_pedido import ItemPedido
from backend.models.produto_model import Produto
from backend.models.aluno_model import Aluno
from backend.models.avaliacao_model import Avaliacao
from backend.extensions import db
from backend.repositories.pedido_repository import PedidoRepository
from flask_login import current_user
from datetime import datetime
from collections import Counter
from itertools import combinations




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
        id_aluno = current_user.id_aluno
        itens_data = data.get('itens', []) # Espera uma lista de dicts: [{"id_produto": 1, "quantidade": 2}, ...]

        if not id_aluno or not itens_data:
            return {"erro": "Aluno e itens são obrigatórios para fechar um pedido"}, 400

        try:
            # 1. Cria a instância do pedido base, guardando uma "foto" do nome do aluno
            novo_pedido = Pedido(
                id_aluno=id_aluno,
                nome_aluno=current_user.nome,
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
        # O carrinho (status "Carrinho") ainda não é um pedido feito, então não aparece na lista
        pedidos = Pedido.query.filter(Pedido.status != "Carrinho").all()
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

    @staticmethod
    def combinacoes_mais_pedidas():
        # Consulta não-CRUD: no MySQL usa a procedure sp_combinacoes_mais_pedidas (via repository);
        # em outro banco (ex.: SQLite) faz a mesma conta pelo ORM
        try:
            linhas = PedidoRepository.combinacoes_mais_pedidas()
        except Exception as e:
            print(f"[PedidoService.combinacoes_mais_pedidas] Procedure indisponível, usando fallback ORM: {e}")
            linhas = PedidoService._combinacoes_fallback_orm()

        # Cada linha vira o formato que o front usa: {produtos: [...], vezes}
        return [
            {"produtos": [{"id_produto": l["id_produto_1"], "nome": l["nome_1"]},
                          {"id_produto": l["id_produto_2"], "nome": l["nome_2"]}],
             "vezes": l["vezes"]}
            for l in linhas
        ], 200

    @staticmethod
    def _combinacoes_fallback_orm():
        """Mesmo resultado da sp_combinacoes_mais_pedidas, mas via SQLAlchemy."""
        # Conta quantas vezes cada dupla de produtos aparece no mesmo pedido
        contagem = Counter()
        pedidos = Pedido.query.filter(Pedido.status.notin_(["Carrinho", "Cancelado"])).all()
        for pedido in pedidos:
            produtos = sorted({item.produto for item in pedido.itens if item.produto}, key=lambda p: p.id_produto)
            for par in combinations(produtos, 2):
                contagem[par] += 1

        # Mais vezes primeiro; no empate, menor id primeiro (mesma ordem da procedure)
        top3 = sorted(contagem.items(), key=lambda x: (-x[1], x[0][0].id_produto, x[0][1].id_produto))[:3]
        return [{"id_produto_1": a.id_produto, "nome_1": a.nome,
                 "id_produto_2": b.id_produto, "nome_2": b.nome, "vezes": vezes}
                for (a, b), vezes in top3]

class AvaliacaoService:
    @staticmethod
    def criar(data, id_pedido):
        pedido = Pedido.buscar_por_id(id_pedido)
        # Só o dono do pedido avalia, e uma vez só (a tabela aceita uma avaliação por pedido)
        if not pedido or pedido.id_aluno != current_user.id_aluno:
            return {"erro": "Pedido não encontrado"}, 404
        if pedido.avaliacao:
            return {"erro": "Este pedido já foi avaliado"}, 400
        nova_avaliacao = Avaliacao(
            id_pedido=id_pedido,
            nota=data.get('nota'),
            comentario= data.get('comentario')
        )
        db.session.add(nova_avaliacao)
        db.session.commit()
        return nova_avaliacao.to_dict(), 201