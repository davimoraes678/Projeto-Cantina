# Projeto-Cantina

Sistema de pedidos da cantina do COTEMIG: o aluno se cadastra, faz login, monta um carrinho com os produtos da cantina e finaliza o pedido. A administração cadastra produtos (com imagem) e acompanha os pedidos.

## Integrantes

| Nome | Matrícula |
|---|---|
| Caio Antunes Guedes Alves da Silva | 12501719 |
| Davi Pimentel de Moraes | 12502120 |
| Ana Julia Gois do Nascimento | 22401369 |
| João Vitor Marques de Sampaio | 22400540 |
| Felipe Ferreira da Fonseca | 12502537 |
| Maria Eduarda Fidelis Correa | 12401595 |

## Stack

| Parte | Tecnologia |
|---|---|
| Front-end | HTML, CSS e JavaScript puro (sem framework) |
| Back-end | Python + Flask (API JSON) |
| Login | Flask-Login (sessão em cookie) |
| Banco de dados | MySQL em produção; SQLite para desenvolvimento |
| ORM | Flask-SQLAlchemy |

## Como rodar

### 1. Instalar as dependências

```bash
python -m venv venv
# Windows: venv\Scripts\activate    |    Linux/Mac/Codespaces: source venv/bin/activate
pip install -r requirements.txt
```

### 2. Configurar (opcional)

Crie um arquivo `.env` na raiz do projeto. Sem ele, o projeto usa SQLite (`cantina.db`) e uma chave de desenvolvimento.

```env
# MySQL (se não definir, usa SQLite)
DATABASE_URL=mysql+pymysql://usuario:senha@localhost/cantina_db?charset=utf8mb4
# Chave que assina o cookie de login. Use um texto longo e aleatório.
SECRET_KEY=troque-por-um-texto-aleatorio
# Modo debug: mostra erros detalhados e reinicia ao salvar arquivos.
# O padrão do app.py é True; em produção use False.
FLASK_DEBUG=True
```

Para usar MySQL, crie o banco antes com `backend/database/create-database.sql`.

### 3. Iniciar

```bash
python app.py
```

Abra **http://127.0.0.1:5000** (no Codespaces, a URL da porta 5000). Sem login, você é levado para a tela de cadastro.

> As tabelas são criadas automaticamente na primeira execução (`db.create_all()`). Para recomeçar do zero no SQLite, apague o arquivo `cantina.db`.

## Documentação

| Documento | Para quê |
|---|---|
| [docs/ARQUITETURA.md](docs/ARQUITETURA.md) | Como o código está organizado e o caminho de uma requisição |
| [docs/API.md](docs/API.md) | Todas as rotas da API, com corpo, resposta e códigos HTTP |
| [docs/BANCO.md](docs/BANCO.md) | Tabelas, relacionamentos e como o carrinho é guardado |
| [docs/LOGIN.md](docs/LOGIN.md) | Como funciona o cadastro, login, logout e `current_user` |
| [docs/FRONTEND.md](docs/FRONTEND.md) | Páginas, o `alunos.js` e quais rotas cada tela usa |
| [docs/CONTRIBUINDO.md](docs/CONTRIBUINDO.md) | Passo a passo para criar uma funcionalidade nova, padrões e erros comuns |

## Estrutura resumida

```
Projeto-Cantina/
├── app.py                  # Ponto de entrada: cria o app Flask e registra tudo
├── requirements.txt        # Dependências Python
├── arquivos/               # Imagens dos produtos (não vão para o git)
├── backend/
│   ├── extensions.py       # db (SQLAlchemy) e lm (LoginManager) compartilhados
│   ├── routes.py           # Registra os blueprints (controllers) no app
│   ├── controllers/        # Recebem a requisição HTTP e devolvem JSON
│   ├── services/           # Regras de negócio
│   ├── models/             # Tabelas do banco (classes SQLAlchemy)
│   ├── repositories/       # Acesso a stored procedures do MySQL
│   └── database/           # Script SQL de criação do banco
└── front-end/
    ├── index.html          # Cantina: produtos, carrinho e pedidos (exige login)
    ├── login.html          # Login
    ├── cadastro.html       # Cadastro de aluno
    ├── admin.html          # Administração de alunos e produtos
    ├── css/style.css
    └── js/alunos.js        # Todo o JavaScript das páginas
```
