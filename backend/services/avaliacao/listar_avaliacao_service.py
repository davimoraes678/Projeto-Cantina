from backend.models.avaliacao_model import Avaliacao

class ListarAvaliacaoService:
    @staticmethod
    def executar():
        avaliacoes = Avaliacao.listar_todos()
        return [avaliacao.to_dict() for avaliacao in avaliacoes], 200