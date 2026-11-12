from werkzeug.security import generate_password_hash
from backend.models.aluno_model import Aluno
from backend.extensions import login_user


class CriarAlunoService:
    @staticmethod
    def executar(dados):
        nome = dados.get("nome")
        senha = dados.get('senha')
        email = (dados.get("email") or "").strip().lower()
        if not nome or not email or not senha:
            return {"erro": "Nome, email e senha são obrigatórios"}, 400
        if Aluno.buscar_por_email(email):
            return {"erro": "Já existe um aluno cadastrado com esse email"}, 409

        # O primeiro cadastro vira mestre
        funcao = "aluno" if Aluno.query.filter_by(funcao="mestre").first() else "mestre"

        novo_aluno = Aluno(nome=nome, email=email, senha=generate_password_hash(senha), funcao=funcao)
        novo_aluno.salvar()
        login_user(novo_aluno)
        return novo_aluno.to_dict(), 201
