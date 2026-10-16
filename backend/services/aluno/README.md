# backend/services/aluno/

Services de **aluno**: um arquivo por operação. As rotas que os chamam ficam em [`controllers/aluno_controller.py`](../../controllers/README.md#aluno_controllerpy--apialunos).

| Arquivo | Classe | O que faz |
|---|---|---|
| `criar_aluno_service.py` | `CriarAlunoService` | Cadastro: exige nome, e-mail e senha (`400`), recusa e-mail repetido (`409`), salva o **hash** da senha e **já faz login** (`login_user`) |
| `login_aluno_service.py` | `LoginAlunoService` | `executar`: confere a senha com `check_password_hash` e faz `login_user`. `logout`: faz `logout_user` |
| `atualizar_aluno_service.py` | `AtualizarAlunoService` | Edita nome, e-mail e senha do aluno logado; senha vazia mantém a atual; e-mail de outro aluno dá `409` |
| `deletar_aluno_service.py` | `DeletarAlunoService` | Exclui o aluno logado **sem apagar os pedidos dele**: copia o nome para os pedidos e solta o vínculo antes de apagar. O carrinho em aberto não é histórico e é apagado junto |

## Atenção: o `user_loader` mora aqui

O `criar_aluno_service.py` também contém, dentro da classe, a função que o Flask-Login usa para recarregar o aluno a cada requisição:

```python
@lm.user_loader
def load_user(id):
    return db.session.get(Aluno, int(id))
```

**Não apague essa função.** Sem ela, nenhum login funciona, porque o `current_user` não consegue ser recuperado do cookie. Ela só é registrada porque este arquivo é importado pelo `aluno_controller`. O funcionamento completo do login está em [`backend/README.md`](../../README.md#login-flask-login).

## Senhas

- Só o **hash** é salvo: `generate_password_hash` no cadastro e na edição, `check_password_hash` no login.
- `Aluno.to_dict()` não inclui a senha, então ela nunca sai na API.
- No login, e-mail inexistente e senha errada dão a **mesma** mensagem ("Email ou senha inválidos"), para não revelar quais e-mails estão cadastrados.
