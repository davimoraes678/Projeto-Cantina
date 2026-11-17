from backend.models.avaliacao_model import Avaliacao


# Principais primeiro: as com comentário, e entre elas as mais novas
class ListarAvaliacaoService:
    @staticmethod
    def executar():
        avaliacoes = sorted(Avaliacao.listar_todos(),
                            key=lambda a: (a.relevancia(), a.data_avaliacao), reverse=True)
        return [avaliacao.to_dict() for avaliacao in avaliacoes], 200
