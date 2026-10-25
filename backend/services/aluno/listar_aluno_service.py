from backend.models.aluno_model import Aluno


class ListarAlunoService:
    """Caso de uso: listar todos os alunos (tela do mestre)."""

    @staticmethod
    def executar():
        alunos = Aluno.listar_todos()
        return [aluno.to_dict() for aluno in alunos], 200
