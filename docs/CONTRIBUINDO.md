# Contribuindo

Guia para quem vai mexer no código: como criar uma funcionalidade nova seguindo o padrão do projeto, como testar e os erros que já aconteceram aqui.

## Fluxo de trabalho no Git

1. Atualize a `main`: `git switch main && git pull`
2. Crie um branch para a tarefa: `git switch -c nome-da-tarefa`
3. Faça as alterações e teste (veja "Como testar").
4. Commit com uma mensagem que diga **o que mudou e por quê**: `git commit -m "Adiciona rota de avaliação de pedido"`
5. `git push -u origin nome-da-tarefa` e abra um Pull Request no GitHub para alguém revisar antes de ir para a `main`.

Se o git pedir nome e e-mail, configure uma vez:
```bash
git config --global user.name "seu-usuario-do-github"
git config --global user.email "seu-email@exemplo.com"
```

## Passo a passo: uma funcionalidade nova

Exemplo: permitir que o aluno **avalie um pedido** (o model `Avaliacao` já existe).

### 1. Model — `backend/models/`
Se precisar de uma tabela nova, crie um arquivo com a classe e **importe-o no `app.py`**, na linha `from backend.models import ...`. Sem esse import, o SQLAlchemy não encontra a classe e as consultas dão erro 500.

### 2. Service — `backend/services/`
A regra de negócio. Sempre devolva `(dicionário, código_http)`:
```python
from flask_login import current_user
from backend.extensions import db
from backend.models.pedido_model import Pedido
from backend.models.avaliacao_model import Avaliacao

class AvaliacaoService:
    @staticmethod
    def avaliar(id_pedido, dados):
        pedido = Pedido.buscar_por_id(id_pedido)
        if not pedido or pedido.id_aluno != current_user.id_aluno:
            return {"erro": "Pedido não encontrado"}, 404
        nota = dados.get("nota")
        if nota not in (1, 2, 3, 4, 5):
            return {"erro": "A nota deve ser de 1 a 5"}, 400
        avaliacao = Avaliacao(id_pedido=id_pedido, nota=nota, comentario=dados.get("comentario"))
        avaliacao.salvar()
        return avaliacao.to_dict(), 201
```

### 3. Controller — `backend/controllers/`
Só recebe e repassa:
```python
from flask import Blueprint, request, jsonify
from flask_login import login_required
from backend.services.avaliacao_service import AvaliacaoService

bp_avaliacao = Blueprint('avaliacoes', __name__, url_prefix='/api/avaliacoes')

@bp_avaliacao.route('/<int:id_pedido>', methods=['POST'])
@login_required
def avaliar(id_pedido):
    dados = request.get_json(silent=True) or {}
    resposta, status = AvaliacaoService.avaliar(id_pedido, dados)
    return jsonify(resposta), status
```

### 4. Registrar — `backend/routes.py`
```python
    from backend.controllers.avaliacao_controller import bp_avaliacao
    app.register_blueprint(bp_avaliacao)
```
E acrescente a rota na lista do `GET /api` no `app.py` e em [API.md](API.md).

### 5. Front-end — `front-end/js/alunos.js`
Uma função `async` que chama a rota (siga o padrão de [FRONTEND.md](FRONTEND.md)). Se ela roda ao abrir a página, chame-a no `DOMContentLoaded` e faça ela sair cedo quando o elemento não existir na página.

## Padrões do projeto

| Assunto | Padrão |
|---|---|
| Resposta do service | `return {...}, codigo_http` |
| Erros | `{"erro": "mensagem para o usuário"}` |
| Dados do aluno logado | `current_user` no service, nunca `id_aluno` vindo da URL ou do corpo |
| Rota que precisa de login | `@login_required` abaixo do `@bp.route(...)` |
| Ler o corpo JSON | `request.get_json(silent=True) or {}` (não quebra se vier vazio) |
| Nomes em Python | `snake_case` (`buscar_por_id`) |
| Nomes em JavaScript | `camelCase` (`carregarCarrinho`); elementos do HTML com sufixo `El` (`totalEl`) |
| Caminhos no HTML | absolutos: `/front-end/...` |
| URL da API no JS | `API_BASE_URL` (`"/api"`), nunca um endereço fixo |
| Senhas | só o hash (`generate_password_hash` / `check_password_hash`) |

## Como testar

1. Rode `python app.py` e abra `http://127.0.0.1:5000`.
2. Deixe o **console do navegador aberto (F12)**. Erros de JavaScript aparecem ali.
3. Olhe também o **terminal onde o Flask roda**. Erros 500 mostram o *traceback* lá, com o arquivo e a linha.
4. Para testar só a API, use a aba *Network* do F12, ou o Thunder Client / Postman. Lembre que rotas 🔒 precisam do cookie de um login feito antes.
5. Para recomeçar com o banco vazio (SQLite), pare o servidor e apague o `cantina.db`.

## Erros que já aconteceram aqui (e como evitar)

| Sintoma | Causa | Como evitar |
|---|---|---|
| **Toda** consulta ao banco dá 500: `expression 'Avaliacao' failed to locate a name` | Os models não foram importados no `app.py` | Mantenha a linha `from backend.models import ...` com todos os models |
| Rota existe no código mas dá 404 | O controller não foi registrado em `backend/routes.py` | Registre todo blueprint novo |
| `TypeError: ... got an unexpected keyword argument 'id_aluno'` | A URL tem `<int:id_aluno>` mas a função não recebe esse parâmetro (ou o contrário) | Os nomes entre `< >` na rota precisam ser parâmetros da função |
| `NameError: name 'x' is not defined` no service | Uma linha que criava a variável foi apagada junto com outra mudança | Rode e teste a rota depois de cada mudança |
| `login_user` dá `NotImplementedError` | Falta `get_id()` no `Aluno` | Não remova o `get_id()` |
| Página "401 Unauthorized" ao abrir `/` | `@login_required` na rota que deveria redirecionar | Em páginas, redirecione com `if not current_user.is_authenticated` |
| Formulário recarrega a página com `?` no fim da URL e nada acontece | O JS quebrou (erro no console) antes de ligar o formulário | Abra o F12; corrija o primeiro erro vermelho |
| `SyntaxError: await is only valid in async functions` | `await` solto no arquivo | Use `await` só dentro de `async function` |
| A URL da API vira `/carrinho/[object Promise]` | Faltou `await` ao chamar uma função `async` | `const x = await minhaFuncao()` |
| Página sem CSS, links com 404 | Caminho relativo numa página aberta em `/` | Caminhos absolutos `/front-end/...` |
| Login "não pega" / volta sempre para o cadastro | Página e API em endereços diferentes (cookie não vai junto) | `API_BASE_URL = "/api"` e abrir pela URL do Flask |
| Cadastro com e-mail repetido dá 500 | Faltou a checagem de e-mail duplicado (o banco recusa) | Verifique antes de salvar e responda `409` |
| Arquivo novo não é encontrado no import | Arquivo Python sem a extensão `.py` | Todo módulo Python termina em `.py` |
