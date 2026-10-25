# backend/

A API do sistema, feita em Flask. Ela recebe e devolve **JSON**; quem desenha as telas é o [front-end](../front-end/README.md).

| Arquivo / pasta | O que faz |
|---|---|
| `extensions.py` | Cria `db` (banco, SQLAlchemy) e `lm` (login, LoginManager) **uma única vez**, para todo o projeto importar daqui |
| `routes.py` | `register_routes(app)`: registra todos os controllers no app. **Controller novo precisa ser registrado aqui.** |
| `autenticacao.py` | Login e permissões: `load_user` (Flask-Login) e os decorators `admin_required` / `master_required` |
| [`controllers/`](controllers/README.md) | Uma classe por recurso: recebe a requisição HTTP e devolve JSON |
| [`services/`](services/README.md) | Uma classe por caso de uso, com as regras de negócio |
| [`models/`](models/README.md) | Entidades do domínio / tabelas do banco |
| [`repositories/`](repositories/README.md) | Consultas não-CRUD por stored procedures do MySQL |
| [`database/`](database/README.md) | Script SQL de criação do banco MySQL |

## Camadas

Toda requisição passa pelas mesmas camadas, nesta ordem:

```mermaid
flowchart LR
    F["Front-end<br/>(fetch no alunos.js)"] -->|"HTTP + JSON"| C["Controller"]
    C --> S["Service"]
    S --> M["Model"]
    S -.->|"consultas não-CRUD"| R["Repository"]
    M --> DB[("SQLite / MySQL")]
    R -->|"CALL sp_..."| DB
```

| Camada | Responsabilidade | O que **não** faz |
|---|---|---|
| **Controller** | Classe por recurso. Liga URL e método, lê a requisição, aplica a permissão, chama o service, devolve JSON | Regra de negócio ou acesso ao banco |
| **Service** | Classe por caso de uso, com `executar()`. Regras e validações. Devolve sempre `(dicionário, código_http)` | Não usa `request` nem `jsonify` |
| **Model** | Uma classe por tabela (`db.Model`), com `salvar()`, `atualizar()`, `deletar()`, `listar_todos()`, `buscar_por_id()`, `to_dict()` | Decisões de negócio |
| **Repository** | Consultas não-CRUD: monta o `CALL sp_...` | CRUD simples (isso fica no Model) |

### O padrão `resposta, status`

```python
# service
return {"erro": "O carrinho está vazio"}, 400     # deu errado
return carrinho.to_dict(), 200                     # deu certo

# controller
resposta, status = FinalizarPedidoService.executar()
return jsonify(resposta), status
```

| Código | Quando |
|---|---|
| `200` | Deu certo |
| `201` | Algo foi criado |
| `400` | Dados inválidos |
| `401` | Não está logado, ou login errado |
| `404` | Não encontrado |
| `409` | Conflito (ex.: e-mail já cadastrado) |
| `500` | Erro inesperado |

## Como o `app.py` monta o sistema

O `app.py` fica na raiz do projeto. A função `create_app()`:

1. Carrega o `.env` (`load_dotenv()`).
2. Cria o Flask, servindo a pasta `front-end/` em `/front-end`.
3. Configura o banco (`DATABASE_URL`, padrão SQLite), a pasta de imagens (`arquivos/`), o tamanho máximo de upload (6 MB) e a `SECRET_KEY`.
4. Liga o banco (`db.init_app`) e o login (`lm.init_app`). Rotas protegidas sem login respondem `401`.
5. Registra os controllers (`register_routes(app)`).
6. Protege as páginas: sem login, vai para o cadastro; `admin.html` e `historico.html` só para admin e mestre. Define `/` (entrega o `index.html`) e `/api` (lista de rotas, gerada automaticamente).
7. Cria as tabelas que ainda não existem (`db.create_all()`).

> ⚠️ O `app.py` importa **todos** os models, inclusive os que parecem sem uso (`avaliacao_model`, `rateio_model`). Sem isso, o SQLAlchemy não encontra as classes dos relacionamentos e **toda consulta ao banco dá erro 500**.

## Login (Flask-Login)

O aluno logado fica num **cookie de sessão** assinado com a `SECRET_KEY`; o navegador envia esse cookie sozinho em toda chamada à API.

| Peça | Onde | Papel |
|---|---|---|
| `lm = LoginManager()` | `extensions.py` | Gerenciador do login |
| `Aluno(UserMixin, db.Model)` | `models/aluno_model.py` | O aluno é o usuário do login |
| `Aluno.get_id()` | `models/aluno_model.py` | O que vai no cookie: `str(self.id_aluno)` |
| `@lm.user_loader` | `autenticacao.py` | Do id no cookie de volta para o `Aluno` |
| `admin_required` / `master_required` | `autenticacao.py` | Barram a rota por função: `401` sem login, `403` sem permissão |
| `login_user` / `logout_user` | `services/aluno/` | Grava / apaga o aluno da sessão |
| `@login_required` | `controllers/` | Barra a rota sem login |
| `current_user` | services e `app.py` | O aluno da requisição atual |

> **Por que `get_id()`?** O Flask-Login procura um campo `id`, mas a chave do `Aluno` é `id_aluno`. Sem esse método, o `login_user` quebra.

```mermaid
sequenceDiagram
    participant N as Navegador
    participant F as Flask
    N->>F: POST /api/alunos/login {email, senha}
    F->>F: check_password_hash → login_user(aluno)
    F-->>N: 200 + cookie (guarda o id "1")
    N->>F: GET /api/carrinho (cookie vai junto)
    F->>F: load_user("1") → current_user = Aluno 1
    F-->>N: carrinho do aluno 1
```

O `current_user` é recalculado **a cada requisição** a partir do cookie dela, por isso cada aluno vê o próprio carrinho. Sem login, `current_user.is_authenticated` é `False`.

**Cuidados:** use `current_user` no service em vez de receber o id do aluno pela URL (senão qualquer um troca o número); a página tem que vir do Flask e o JS deve usar `API_BASE_URL = "/api"`, senão o cookie não vai junto; mudar a `SECRET_KEY` desfaz todos os logins.

## Passo a passo: funcionalidade nova

Exemplo: a avaliação de pedido (é assim que ela está feita no projeto).

**1. Model** (`models/`): se criar uma tabela, importe o arquivo no `app.py` junto com os outros models.

**2. Service** (`services/avaliacao/avaliar_pedido_service.py`), **uma classe para o caso de uso**:
```python
from flask_login import current_user
from backend.models.pedido_model import Pedido
from backend.models.avaliacao_model import Avaliacao

class AvaliarPedidoService:
    """Caso de uso: o aluno dá nota (1 a 5) e um comentário opcional para o pedido."""

    @staticmethod
    def executar(id_pedido, dados):
        pedido = Pedido.buscar_por_id(id_pedido)
        if not pedido or pedido.id_aluno != current_user.id_aluno:
            return {"erro": "Pedido não encontrado"}, 404
        ...
        avaliacao = Avaliacao(id_pedido=id_pedido, nota=nota, comentario=dados.get("comentario"))
        avaliacao.salvar()
        return avaliacao.to_dict(), 201
```

**3. Controller** (`controllers/avaliacao_controller.py`), **uma classe por recurso**:
```python
from flask import Blueprint, request, jsonify
from flask_login import login_required
from backend.services.avaliacao.avaliar_pedido_service import AvaliarPedidoService

class AvaliacaoController:
    @staticmethod
    @login_required
    def avaliar(id_pedido):
        dados = request.get_json(silent=True) or {}
        resposta, status = AvaliarPedidoService.executar(id_pedido, dados)
        return jsonify(resposta), status

bp_avaliacao = Blueprint('avaliacoes', __name__, url_prefix='/api/pedidos')
bp_avaliacao.add_url_rule('/<int:id_pedido>/avaliacao', view_func=AvaliacaoController.avaliar, methods=['POST'])
```

**4. Registrar** em `routes.py`:
```python
    from backend.controllers.avaliacao_controller import bp_avaliacao
    app.register_blueprint(bp_avaliacao)
```
E acrescente a rota em [`controllers/README.md`](controllers/README.md) e a funcionalidade na lista do [README principal](../README.md#funcionalidades-implementadas).

**Consulta especial (ranking, relatório, filtro complexo)?** Crie a stored procedure no `database/create-database.sql`, um método no repository que faz o `CALL` (ver [`repositories/`](repositories/README.md)) e chame o repository no service.

**5. Front-end:** uma função `async` no `alunos.js`, seguindo o padrão de [`front-end/js/README.md`](../front-end/js/README.md).
