# Login e permissões usados pelos controllers
from functools import wraps

from flask_login import current_user

from backend.extensions import lm


@lm.user_loader
def load_user(id):
    # Import aqui dentro evita import circular
    from backend.models.aluno_model import Aluno
    return Aluno.buscar_por_id(int(id))


def funcao_required(*funcoes):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            if not current_user.is_authenticated:
                return {"erro": "Faça login para continuar."}, 401
            if current_user.funcao not in funcoes:
                return {"erro": "Acesso negado. Você nao tem permissão pra isso."}, 403
            return f(*args, **kwargs)
        return wrapper
    return decorator


admin_required = funcao_required('admin', 'mestre')
master_required = funcao_required('mestre')
