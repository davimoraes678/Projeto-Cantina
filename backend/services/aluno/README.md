# backend/services/aluno/

Casos de uso de **aluno**: uma classe por arquivo, cada uma com `executar()`. As rotas que os chamam ficam no `AlunoController` ([`controllers/aluno_controller.py`](../../controllers/README.md#aluno_controllerpy--apialunos)).

| Arquivo | Classe | O que faz |
|---|---|---|
| `criar_aluno_service.py` | `CriarAlunoService` | Cadastro: exige nome, e-mail e senha (`400`), recusa e-mail repetido (`409`), salva o **hash** da senha e **já faz login**. O primeiro cadastro do sistema vira **mestre**; os outros, aluno (a função nunca vem do usuário) |
| `login_aluno_service.py` | `LoginAlunoService` | Confere a senha com `check_password_hash` e faz `login_user` |
| `logout_aluno_service.py` | `LogoutAlunoService` | Faz `logout_user` |
| `buscar_aluno_atual_service.py` | `BuscarAlunoAtualService` | Devolve o aluno logado |
| `atualizar_aluno_service.py` | `AtualizarAlunoService` | Edita nome, e-mail e senha (senha vazia mantém a atual) |
| `recarregar_saldo_service.py` | `RecarregarSaldoService` | Soma o valor ao saldo (de R$ 0,01 a R$ 500,00) |
| `listar_aluno_service.py` | `ListarAlunoService` | Lista todos os alunos |
| `promover_aluno_service.py` | `PromoverAlunoService` | Muda a função do aluno para `admin` |
| `deletar_aluno_service.py` | `DeletarAlunoService` | Sem id: exclui a própria conta. Com id: o mestre exclui outro aluno (não a si mesmo). **Os pedidos continuam**: copia o nome para eles e solta o vínculo antes de apagar |

## Funções

| Função | Pode |
|---|---|
| `aluno` | Comprar: cardápio, carrinho, carteira, avaliação |
| `admin` | Também: painel de pedidos (concluir, cancelar) e histórico |
| `mestre` | Também: alunos (listar, promover, excluir) e produtos (cadastrar, editar, excluir) |

Quem barra as rotas são os decorators `admin_required` e `master_required` de [`backend/autenticacao.py`](../../autenticacao.py), usados nos controllers.

## Senhas

- Só o **hash** é salvo: `generate_password_hash` no cadastro e na edição, `check_password_hash` no login.
- `Aluno.to_dict()` não inclui a senha, então ela nunca sai na API.
- No login, e-mail inexistente e senha errada dão a **mesma** mensagem ("Email ou senha inválidos"), para não revelar quais e-mails estão cadastrados.
