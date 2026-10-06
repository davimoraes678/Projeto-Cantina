from backend.extensions import lm
from backend.models.aluno_model import Aluno

class LoginAlunoServise:
    @login_manager.user_loader
    def load_user(user_id):
        return User.get(user_id)