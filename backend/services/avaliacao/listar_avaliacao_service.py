from backend.models.avaliacao_model import Avaliacao


# Principais primeiro: as com comentário, e entre elas as mais novas
class ListarAvaliacaoService:
    @staticmethod
    def executar():
        return [avaliacao.to_dict() for avaliacao in Avaliacao.listar_todos], 200
