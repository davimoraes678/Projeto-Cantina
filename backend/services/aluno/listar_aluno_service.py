from backend.models.aluno_model import Aluno


class ListarAlunoService:
    @staticmethod
    def executar():
        aluno = Aluno.listar_todos()
        return [u.to_dict() for u in aluno], 200


