from backend.models.aluno_model import Aluno


class ListarAlunoService:
    @staticmethod
    def executar():
        aluno = Aluno.listar_todos()
        return [u.to_dict() for u in aluno], 200

    @staticmethod
    def buscar_por_id(id):
        aluno = Aluno.buscar_por_id(id)
        if not aluno:
            return {"erro": "Usuario nao encontrado"}, 404
        return aluno.to_dict(), 200
