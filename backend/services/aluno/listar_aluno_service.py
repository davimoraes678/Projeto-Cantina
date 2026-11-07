from backend.models.aluno_model import Aluno


class ListarAlunoService:
    @staticmethod
    def executar():
        alunos = Aluno.listar_todos()
        return [aluno.to_dict() for aluno in alunos], 200
