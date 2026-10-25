from backend.models.aluno_model import Aluno

class PromoverAlunoService:
    """Caso de uso: promover um aluno a admin (só o mestre)."""

    @staticmethod
    def executar(id_aluno):
        aluno = Aluno.buscar_por_id(id_aluno)
        if not aluno:
            return {"erro": "Aluno não encontrado"}, 404

        # O atualizar do model já faz o commit
        aluno.atualizar(funcao='admin')
        return aluno.to_dict(), 200
