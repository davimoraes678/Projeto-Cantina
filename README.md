# Projeto-Cantina

Sistema de pedidos da cantina do COTEMIG: o aluno se cadastra, faz login, monta um carrinho com os produtos e finaliza o pedido. A administração cadastra produtos (com imagem) e acompanha os pedidos.

## Integrantes

| Nome | Matrícula |
|---|---|
| Caio Antunes Guedes Alves da Silva | 12501719 |
| Davi Pimentel de Moraes | 12502120 |
| Ana Julia Gois do Nascimento | 22401369 |
| João Vitor Marques de Sampaio | 22400540 |
| Felipe Ferreira da Fonseca | 12502537 |
| Maria Eduarda Fidelis Correa | 12401595 |

**Stack:** HTML, CSS e JavaScript puro no front-end, com Bootstrap 5.3.8 (CDN, versão estável); Python + Flask no back-end (API JSON); Flask-SQLAlchemy; Flask-Login; MySQL em produção e SQLite em desenvolvimento.

## Como rodar

```bash
python -m venv venv
# Windows: venv\Scripts\activate    |    Linux/Mac/Codespaces: source venv/bin/activate
pip install -r requirements.txt
python app.py
```

Abra **http://127.0.0.1:5000** (no Codespaces, a URL da porta 5000). Sem login, você é levado para a tela de cadastro.

**Configuração (opcional):** crie um `.env` na raiz. Sem ele, o projeto usa SQLite (`instance/cantina.db`) e uma chave de desenvolvimento.

```env
# MySQL (se não definir, usa SQLite)
DATABASE_URL=mysql+pymysql://usuario:senha@localhost/cantina_db?charset=utf8mb4
# Chave que assina o cookie de login. Use um texto longo e aleatório.
SECRET_KEY=troque-por-um-texto-aleatorio
# Modo debug: mostra erros detalhados. O padrão do app.py é True; em produção use False.
FLASK_DEBUG=True
```

As tabelas são criadas automaticamente na primeira execução. Para recomeçar do zero no SQLite, apague o `instance/cantina.db`.

## Onde está cada coisa

Cada pasta tem um `README.md` explicando o que ela faz:

| Pasta | O que tem |
|---|---|
| [`backend/`](backend/README.md) | A API: como as camadas se conectam, como o `app.py` monta o sistema e como funciona o login |
| [`backend/controllers/`](backend/controllers/README.md) | As rotas da API (URLs, corpo, respostas) |
| [`backend/services/`](backend/services/README.md) | As regras de negócio (carrinho, pedidos, produtos, imagens) |
| [`backend/services/aluno/`](backend/services/aluno/README.md) | Cadastro, login, logout e CRUD de alunos |
| [`backend/models/`](backend/models/README.md) | As tabelas do banco e como o carrinho é guardado |
| [`backend/repositories/`](backend/repositories/README.md) | Stored procedures da busca de produtos |
| [`backend/database/`](backend/database/README.md) | Script SQL do MySQL |
| [`front-end/`](front-end/README.md) | As páginas e como elas se ligam à API |
| [`front-end/js/`](front-end/js/README.md) | O `alunos.js`: funções e padrões |
| [`arquivos/`](arquivos/README.md) | Imagens dos produtos |

Arquivos da raiz:

| Arquivo | O que faz |
|---|---|
| `app.py` | Ponto de entrada. Cria o app Flask, configura banco e login, registra as rotas e cria as tabelas. Detalhes em [`backend/README.md`](backend/README.md#como-o-apppy-monta-o-sistema) |
| `requirements.txt` | Dependências Python (`pip install -r requirements.txt`) |
| `.gitignore` | Impede que `__pycache__`, `.env` e o banco SQLite (`*.db`) vão para o git |

## Como contribuir

1. `git switch main && git pull`
2. `git switch -c nome-da-tarefa`
3. Faça as alterações e teste: rode `python app.py`, deixe o **console do navegador (F12)** aberto e olhe o **terminal do Flask** (erros 500 mostram o arquivo e a linha ali).
4. `git commit -m "O que mudou e por quê"`
5. `git push -u origin nome-da-tarefa` e abra um Pull Request para revisão antes de ir para a `main`.

Se o git pedir identidade: `git config --global user.name "seu-usuario"` e `git config --global user.email "seu@email.com"`.

**Ao mexer numa pasta, atualize o README dela.** Ex.: rota nova → [`backend/controllers/README.md`](backend/controllers/README.md).

Para criar uma funcionalidade nova (model → service → controller → registrar → front), siga o passo a passo em [`backend/README.md`](backend/README.md#passo-a-passo-funcionalidade-nova).

## Erros comuns

Erros que já aconteceram neste projeto:

| Sintoma | Causa | Como evitar |
|---|---|---|
| **Toda** consulta dá 500: `'Avaliacao' failed to locate a name` | Models não importados no `app.py` | Mantenha o import de todos os models |
| Rota existe mas dá 404 | Controller não registrado em `backend/routes.py` | Registre todo blueprint novo |
| `unexpected keyword argument 'id_aluno'` | A URL tem `<int:id_aluno>` e a função não recebe o parâmetro (ou o contrário) | Os nomes entre `< >` precisam ser parâmetros da função |
| `NameError` num service | Uma linha que criava a variável foi apagada junto com outra mudança | Teste a rota depois de cada mudança |
| `login_user` dá `NotImplementedError` | Falta `get_id()` no `Aluno` | Não remova o `get_id()` |
| Categoria `Lanche` dá erro 400 | A categoria se chama `Salgado` (constante `CATEGORIAS` em `backend/constantes.py`) | Não escreva a lista de categorias à mão: o front lê de `GET /api/produtos/categorias` |
| Página "401 Unauthorized" ao abrir `/` | `@login_required` numa rota que deveria redirecionar | Em páginas, use `if not current_user.is_authenticated: redirect(...)` |
| Formulário recarrega com `?` na URL e nada acontece | O JS quebrou antes de ligar o formulário | F12 → corrija o primeiro erro vermelho |
| `await is only valid in async functions` | `await` solto no arquivo | Só dentro de `async function` |
| URL vira `/carrinho/[object Promise]` | Faltou `await` numa função `async` | `const x = await minhaFuncao()` |
| Página sem CSS, links com 404 | Caminho relativo numa página aberta em `/` | Caminhos `/front-end/...` |
| Login "não pega" | Página e API em endereços diferentes | `API_BASE_URL = "/api"` e abrir pela URL do Flask |
| E-mail repetido dá 500 | Faltou checar duplicidade antes de salvar | Verifique e responda `409` |
| Import não encontra o arquivo | Arquivo Python sem `.py` | Todo módulo termina em `.py` |

## Limitações conhecidas

- **Não há papel de administrador:** as rotas de produtos e de listar/alterar pedidos não exigem login (a Fase 3 resolve), e todo aluno logado vê os pedidos de todos.
- **Estoque** não é conferido nem baixado nos pedidos.
- **Preço promocional** não é aplicado; o item usa sempre `preco_atual`.
