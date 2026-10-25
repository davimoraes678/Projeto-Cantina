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

**Stack:** HTML, CSS e JavaScript puro no front-end; Python + Flask no back-end (API JSON); Flask-SQLAlchemy; Flask-Login; MySQL em produção e SQLite em desenvolvimento.

## Como rodar

```bash
python -m venv venv
# Windows: venv\Scripts\activate    |    Linux/Mac/Codespaces: source venv/bin/activate
python -m pip install -r requirements.txt
python app.py
```

Abra **http://127.0.0.1:5000** (no Codespaces, a URL da porta 5000). Sem login, você é levado para a tela de cadastro.

**Configuração (opcional):** crie um `.env` na raiz. Sem ele, o projeto usa SQLite (`cantina.db`) e uma chave de desenvolvimento.

```env
# MySQL (se não definir, usa SQLite)
DATABASE_URL=mysql+pymysql://usuario:senha@localhost/cantina_db?charset=utf8mb4
# Chave que assina o cookie de login. Use um texto longo e aleatório.
SECRET_KEY=troque-por-um-texto-aleatorio
# Modo debug: mostra erros detalhados. O padrão do app.py é True; em produção use False.
FLASK_DEBUG=True
```

As tabelas são criadas automaticamente na primeira execução. Para recomeçar do zero no SQLite, apague o `cantina.db`.

## Funcionalidades Implementadas

Todas funcionam de ponta a ponta: **Tela → API Flask → Controller → Service → Model/Repository → Banco de dados**.
Quem pode usar: 🎓 aluno (qualquer usuário logado) · 🛠️ admin · 👑 mestre (o primeiro usuário cadastrado).

| # | Funcionalidade | Quem | Tela | Rota | Service |
|---|---|---|---|---|---|
| 1 | Cadastrar aluno (o primeiro cadastro vira mestre) | todos | `cadastro.html` | `POST /api/alunos/registro` | `CriarAlunoService` |
| 2 | Login | todos | `login.html` | `POST /api/alunos/login` | `LoginAlunoService` |
| 3 | Logout | 🎓 | menu do usuário / `conta.html` | `POST /api/alunos/logout` | `LogoutAlunoService` |
| 4 | Ver dados da conta | 🎓 | `conta.html` | `GET /api/alunos/atual` | `BuscarAlunoAtualService` |
| 5 | Editar dados da conta | 🎓 | `conta.html` | `PUT /api/alunos/atual` | `AtualizarAlunoService` |
| 6 | Excluir a própria conta | 🎓 | `conta.html` | `DELETE /api/alunos/atual` | `DeletarAlunoService` |
| 7 | Listar alunos | 👑 | `admin.html` | `GET /api/alunos` | `ListarAlunoService` |
| 8 | Promover aluno a admin | 👑 | `admin.html` | `PUT /api/alunos/<id>` | `PromoverAlunoService` |
| 9 | Excluir aluno | 👑 | `admin.html` | `DELETE /api/alunos/<id>` | `DeletarAlunoService` |
| 10 | Cadastrar produto | 👑 | `admin.html` | `POST /api/produtos` | `CriarProdutoService` |
| 11 | Enviar foto do produto (reduzida para até 600×600) | 👑 | `admin.html` | `POST /api/produtos/<id>/imagem` | `EnviarImagemProdutoService` (+ `BuscarImagemProdutoService` para exibir) |
| 12 | Editar produto | 👑 | `admin.html` | `PUT /api/produtos/<id>` | `AtualizarProdutoService` |
| 13 | Excluir produto (pedidos antigos mantêm o nome) | 👑 | `admin.html` | `DELETE /api/produtos/<id>` | `DeletarProdutoService` |
| 14 | Ver o cardápio | 🎓 | `index.html` | `GET /api/produtos/buscar` | `FiltrarProdutosService` → `ListarProdutosService` |
| 15 | Filtrar produtos por categoria | 🎓 | `index.html` | `GET /api/produtos/buscar?categoria=` | `FiltrarProdutosService` → `ProdutoRepository` (`sp_produtos_por_categoria`) |
| 16 | Filtrar produtos por faixa de preço | 🎓 | `index.html` | `GET /api/produtos/buscar?preco_min=&preco_max=` | `FiltrarProdutosService` → `ProdutoRepository` (`sp_produtos_por_faixa_de_preco`) |
| 17 | Ordenar produtos por nome ou preço | 🎓 | `index.html` | `GET /api/produtos/buscar?ordenar=` | `FiltrarProdutosService` → `ProdutoRepository` (`sp_produtos_ordenar_por_*`) |
| 18 | Recarregar a carteira (saldo) | 🎓 | `carteira.html` | `POST /api/alunos/atual/recarga` | `RecarregarSaldoService` |
| 19 | Adicionar produto ao carrinho (total em tempo real) | 🎓 | `index.html` | `POST /api/carrinho/itens` | `AdicionarItemCarrinhoService` (+ `VerCarrinhoService`) |
| 20 | Remover item do carrinho | 🎓 | `index.html` | `DELETE /api/carrinho/itens/<id>` | `RemoverItemCarrinhoService` |
| 21 | Finalizar pedido (confere e desconta saldo e estoque) | 🎓 | `index.html` | `POST /api/carrinho/finalizar` | `FinalizarPedidoService` |
| 22 | Repetir último pedido | 🎓 | `index.html` | `POST /api/carrinho/repetir` | `RepetirUltimoPedidoService` → `PedidoRepository` (`sp_repetir_ultimo_pedido`) |
| 23 | Combinações mais pedidas (e adicionar a dupla ao carrinho) | 🎓 | `index.html` | `GET /api/pedidos/combinacoes` | `CombinacoesMaisPedidasService` → `PedidoRepository` (`sp_combinacoes_mais_pedidas`) |
| 24 | Painel de pedidos em andamento | 🛠️ 👑 | `admin.html` | `GET /api/pedidos` | `ListarPedidosService` |
| 25 | Concluir pedido | 🛠️ 👑 | `admin.html` | `POST /api/pedidos/<id>/concluir` | `ConcluirPedidoService` |
| 26 | Cancelar pedido (devolve o saldo ao aluno e o estoque) | 🛠️ 👑 | `admin.html` | `POST /api/pedidos/<id>/cancelar` | `CancelarPedidoService` |
| 27 | Histórico de pedidos (concluídos e cancelados) | 🛠️ 👑 | `historico.html` | `GET /api/pedidos` | `ListarPedidosService` |
| 28 | Avaliar pedido concluído (nota de 1 a 5 e comentário) | 🎓 | `index.html` (janela automática) | `GET /api/pedidos/<id>` e `POST /api/pedidos/<id>/avaliacao` | `BuscarPedidoService` e `AvaliarPedidoService` |

## Arquitetura

```mermaid
flowchart LR
    T["Tela<br/>(front-end/*.html + alunos.js)"] -->|"fetch → HTTP + JSON"| C["Controller<br/>(classe)"]
    C --> S["Service<br/>(uma classe por caso de uso)"]
    S --> M["Model<br/>(db.Model)"]
    S --> R["Repository<br/>(consultas especiais)"]
    M --> DB[("MySQL / SQLite")]
    R -->|"CALL sp_..."| DB
```

| Camada | Pasta | Responsabilidade |
|---|---|---|
| Controller | [`backend/controllers/`](backend/controllers/README.md) | Uma classe por recurso (`AlunoController`, `ProdutoController`, `ItemPedidoController`, `PedidoController`, `AvaliacaoController`). Recebe a requisição, lê os dados, chama o service e devolve JSON. Sem regra de negócio |
| Service | [`backend/services/`](backend/services/README.md) | Uma classe por caso de uso, com o método `executar()` (ex.: `CriarProdutoService`, `FinalizarPedidoService`). Faz as validações e coordena o caso de uso |
| Model | [`backend/models/`](backend/models/README.md) | Entidades do domínio, herdam de `db.Model`, com `salvar()`, `atualizar()`, `deletar()`, `listar_todos()` e `buscar_por_id()` |
| Repository | [`backend/repositories/`](backend/repositories/README.md) | Só as consultas não-CRUD, por **stored procedures** do MySQL (`CALL` fica só aqui): busca de produtos, repetir último pedido e combinações mais pedidas |

## Diagrama de classes

O diagrama de classes do domínio (Models, atributos, herança, composição e agregação) está em
[`docs/diagrama-de-classes.md`](docs/diagrama-de-classes.md), com a imagem em
[`docs/diagrama-de-classes.png`](docs/diagrama-de-classes.png).

## Onde está cada coisa

Cada pasta tem um `README.md` explicando o que ela faz:

| Pasta | O que tem |
|---|---|
| [`backend/`](backend/README.md) | A API: como as camadas se conectam, como o `app.py` monta o sistema e como funciona o login |
| [`backend/controllers/`](backend/controllers/README.md) | As rotas da API (URLs, corpo, respostas) |
| [`backend/services/`](backend/services/README.md) | Os casos de uso, um por classe, em pastas: `aluno/`, `produto/`, `carrinho/`, `pedido/`, `avaliacao/` |
| [`backend/models/`](backend/models/README.md) | As tabelas do banco e como o carrinho é guardado |
| [`backend/repositories/`](backend/repositories/README.md) | Consultas não-CRUD por stored procedures (busca de produtos, repetir pedido, combinações) |
| [`backend/database/`](backend/database/README.md) | Script SQL do MySQL |
| [`front-end/`](front-end/README.md) | As páginas e como elas se ligam à API |
| [`front-end/js/`](front-end/js/README.md) | O `alunos.js`: funções e padrões |
| [`arquivos/`](arquivos/README.md) | Imagens dos produtos |
| [`docs/`](docs/diagrama-de-classes.md) | Diagrama de classes e roteiro do vídeo de demonstração |

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
| Página "401 Unauthorized" ao abrir `/` | `@login_required` numa rota que deveria redirecionar | Em páginas, use `if not current_user.is_authenticated: redirect(...)` |
| Formulário recarrega com `?` na URL e nada acontece | O JS quebrou antes de ligar o formulário | F12 → corrija o primeiro erro vermelho |
| `await is only valid in async functions` | `await` solto no arquivo | Só dentro de `async function` |
| URL vira `/carrinho/[object Promise]` | Faltou `await` numa função `async` | `const x = await minhaFuncao()` |
| Página sem CSS, links com 404 | Caminho relativo numa página aberta em `/` | Caminhos `/front-end/...` |
| Login "não pega" | Página e API em endereços diferentes | `API_BASE_URL = "/api"` e abrir pela URL do Flask |
| E-mail repetido dá 500 | Faltou checar duplicidade antes de salvar | Verifique e responda `409` |
| Import não encontra o arquivo | Arquivo Python sem `.py` | Todo módulo termina em `.py` |

## Limitações conhecidas

- **Stored procedures só existem no MySQL.** Rodando com SQLite, a busca de produtos, o "repetir último pedido" e as combinações usam a mesma consulta pelo ORM (mesmo resultado). Ao mudar o `create-database.sql`, rode o script de novo no MySQL.
- **Preço promocional** não é aplicado; o item usa sempre `preco_atual`.
- **Dividir conta (rateio):** a classe `RateioPagamento` e a tabela existem, mas ainda não há tela nem rota.
- **Avaliação:** a janela aparece no navegador onde o pedido foi feito, ao abrir a cantina.
