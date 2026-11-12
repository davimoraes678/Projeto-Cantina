# backend/

A API do sistema, feita em Flask. Ela recebe e devolve **JSON**. Quem monta as telas é o [front-end](../front-end/README.md).

| Arquivo / pasta | O que faz |
|---|---|
| `extensions.py` | Cria o `db` (banco) e o `lm` (login) uma vez só, para o projeto todo importar daqui |
| `routes.py` | Registra os controllers no app |
| `autenticacao.py` | `load_user` do Flask-Login e as permissões `admin_required` e `master_required` |
| [`controllers/`](controllers/README.md) | As rotas da API |
| [`services/`](services/README.md) | Os casos de uso, um por classe |
| [`models/`](models/README.md) | As tabelas do banco |
| [`repositories/`](repositories/README.md) | Consultas não-CRUD por views e stored procedures |
| [`database/`](database/README.md) | Scripts SQL: tabelas e procedures (MySQL) e views (SQLite e MySQL) |

## Camadas

| Camada | Faz | Não faz |
|---|---|---|
| **Controller** | Liga a URL a uma função, lê a requisição, aplica a permissão, chama o service e devolve JSON | Regra de negócio |
| **Service** | Valida e executa o caso de uso. Devolve `(dicionário, código_http)` | Não usa `request` nem `jsonify` |
| **Model** | Uma classe por tabela, com `salvar()`, `atualizar()`, `deletar()`, `listar_todos()`, `buscar_por_id()` e `to_dict()` | Regra de negócio |
| **Repository** | Chama as stored procedures (`CALL sp_...`) no MySQL e lê as views no SQLite | CRUD simples |

Exemplo completo, a avaliação de um pedido:

```python
# controllers/avaliacao_controller.py
@bp_avaliacao.route('/<int:id_pedido>/avaliacao', methods=['POST'])
@login_required
def avaliar(id_pedido):
    dados = request.get_json(silent=True) or {}
    resposta, status = AvaliarPedidoService.executar(id_pedido, dados)
    return jsonify(resposta), status

# services/avaliacao/avaliar_pedido_service.py
class AvaliarPedidoService:
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

| Código | Quando |
|---|---|
| `200` / `201` | Deu certo / algo foi criado |
| `400` | Dados inválidos |
| `401` | Não está logado |
| `403` | Sem permissão |
| `404` | Não encontrado |
| `409` | Conflito (e-mail já cadastrado) |

## O `app.py`

O `create_app()`, na raiz do projeto:

1. Carrega o `.env` e configura o banco (`DATABASE_URL`, com SQLite como padrão), a pasta de fotos e a `SECRET_KEY`.
2. Liga o banco e o login, e registra os controllers.
3. Protege as páginas: sem login, a pessoa vai para o cadastro, e o `admin.html` só abre para admin e mestre.
4. Cria `/`, que entrega o cardápio, e `/api`, que lista as rotas.
5. Cria as tabelas que ainda não existem (`db.create_all()`) e as views do `backend/database/views.sql`.

O `app.py` importa **todos** os models, mesmo os sem rota. Sem isso, o SQLAlchemy não acha as classes dos relacionamentos e toda consulta dá erro 500.

## Login e permissões

O aluno logado fica num **cookie de sessão** assinado com a `SECRET_KEY`. O navegador manda esse cookie sozinho em toda chamada à API, e o Flask-Login transforma o cookie no `current_user`. Por isso cada aluno vê só o próprio carrinho e os próprios pedidos.

| Perfil | Pode |
|---|---|
| `aluno` | Cardápio, carrinho, carteira, meus pedidos e avaliação |
| `admin` | Também o painel de pedidos e o histórico |
| `mestre` | Também produtos e alunos |

- As rotas usam `@login_required`, `@admin_required` ou `@master_required`.
- O banco guarda só o **hash** da senha (`generate_password_hash`), e a senha nunca sai na API.
- No login, e-mail inexistente e senha errada dão a mesma mensagem, para não revelar quais e-mails estão cadastrados.
- O `Aluno` tem `get_id()` porque a chave dele é `id_aluno`, e o Flask-Login procura `id`.
