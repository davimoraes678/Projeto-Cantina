from flask_login import current_user
from backend.extensions import db


class DeletarAlunoService:
    @staticmethod
    def executar():
        aluno = current_user

        try:
            # Antes de apagar o aluno, preserva o histórico dos pedidos já feitos por ele:
            # guarda o nome (caso ainda não tenha sido salvo) e solta o vínculo com o aluno,
            # para que o pedido continue existindo mesmo depois do aluno ser excluído.
            # O carrinho em aberto não é histórico (nunca virou pedido), então é apagado junto.
            for pedido in list(aluno.pedido):
                if pedido.status == "Carrinho":
                    db.session.delete(pedido)
                    continue
                if not pedido.nome_aluno:
                    pedido.nome_aluno = aluno.nome
                pedido.id_aluno = None

            for rateio in aluno.rateio:
                rateio.id_aluno = None

            db.session.delete(aluno)
            db.session.commit()
            return {"mensagem": "Usuário deletado com sucesso"}, 200
        except Exception as e:
            db.session.rollback()
            return {"erro": f"Falha ao deletar aluno: {str(e)}"}, 500
