from werkzeug.security import generate_password_hash
from backend.models.aluno_model import Aluno

class CriarAlunoService:
    @staticmethod
    def executar(dados):
        if request.method == 'GET':
            return render_template('cadastro.html')
        elif request.method == 'POST':
            nome = request.form["nome"]
            email = request.form["email"]