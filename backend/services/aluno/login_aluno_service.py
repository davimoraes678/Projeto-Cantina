from werkzeug.security import check_password_hash
from backend.models.aluno_model import Aluno
from backend.extensions import db, lm, login_user
from flask_login import logout_user, current_user
from functools import wraps


def funcao_required(*funcoes):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            if not current_user.is_authenticated:
                return {"erro": "Faça login para continuar."}, 401
            if current_user.funcao not in funcoes:
                return {"erro": "Acesso negado. Voçe nao tem permissão pra isso."}, 403
            return f(*args, **kwargs)
        return wrapper
    return decorator


admin_required = funcao_required('admin', 'master')
master_required = funcao_required('master')

class LoginAlunoService:
    @staticmethod
    def executar(dados):
        email = dados.get("email")
        senha = dados.get("senha")
        if not email or not senha:
            return {"erro": "Email e senha são obrigatórios"}, 400
        aluno = Aluno.query.filter_by(email=email).first()
        if not aluno or not check_password_hash(aluno.senha, senha):
            return {"erro": "Email ou senha inválidos"}, 401
        login_user(aluno)
        return aluno.to_dict(), 200
    @staticmethod
    def logout():
        logout_user()