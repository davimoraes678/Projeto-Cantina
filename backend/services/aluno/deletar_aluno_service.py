from backend.extensions import db
from backend.models.aluno_model import Aluno

class DeletarAlunoService:
    @staticmethod
    def executar(id):
        aluno = Aluno.buscar_por_id(id)
        if not aluno:
            return {"erro": "Usuário não encontrado"}, 404

        try:
            # Antes de apagar o aluno, preserva o histórico dos pedidos já feitos por ele:
            # guarda o nome (caso ainda não tenha sido salvo) e solta o vínculo com o aluno,
            # para que o pedido continue existindo mesmo depois do aluno ser excluído.
            for pedido in aluno.pedido:
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

