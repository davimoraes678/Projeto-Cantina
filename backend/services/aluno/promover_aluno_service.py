from backend.models.aluno_model import Aluno

class PromoverAlunoService:
    @staticmethod
    def executar(id_aluno):
        aluno = Aluno.query.get(id_aluno)
        if not aluno:
            return {"erro": "Aluno não encontrado"}, 404

        aluno.funcao = 'admin'
        db.session.commit()
        return aluno.to_dict(), 200