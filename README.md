# Cantina Real

Sistema de pedidos da cantina do COTEMIG. O aluno vê o cardápio, monta o carrinho, paga com o saldo da carteira e retira o pedido no balcão com um código. A administração acompanha os pedidos e cuida do cardápio e dos alunos.

## Integrantes

| Nome | Matrícula |
|---|---|
| Caio Antunes Guedes Alves da Silva | 12501719 |
| Davi Pimentel de Moraes | 12502120 |
| Ana Julia Gois do Nascimento | 22401369 |
| João Vitor Marques de Sampaio | 22400540 |
| Felipe Ferreira da Fonseca | 12502537 |
| Maria Eduarda Fidelis Correa | 12401595 |

## Tecnologias

| Parte | Tecnologia |
|---|---|
| Front-end | HTML, CSS, JavaScript e Bootstrap 5.3 |
| Back-end | Python, Flask (API JSON), Flask-SQLAlchemy e Flask-Login |
| Banco | SQLite. O projeto também roda em MySQL, com stored procedures |
| Servidor | AWS EC2 |

## Funcionalidades

Existem três perfis: **aluno**, **admin** e **mestre**. O primeiro cadastro do sistema vira mestre.

**Aluno**
- Cadastro, login e perfil (editar dados e excluir a conta)
- Cardápio com filtro por categoria, faixa de preço e ordenação por nome ou preço
- Detalhes do produto: foto, preço, descrição e estoque
- Carrinho: adicionar, remover, ver o total e finalizar o pedido (confere saldo e estoque)
- Combos mais pedidos e "Repetir último pedido"
- Carteira: recarga de saldo
- Meus pedidos: acompanhar o status, ver o código de retirada, "Pedir de novo" e avaliar com nota de 1 a 5

**Admin**
- Painel de pedidos que se atualiza sozinho: "Em preparo" → **Pronto** → **Entregar**
- Cancelar pedido (devolve o saldo ao aluno e os produtos ao estoque)
- Histórico de pedidos entregues e cancelados

**Mestre** (tudo do admin, e mais)
- Produtos: cadastrar, editar, excluir e enviar foto
- Alunos: listar, tornar admin e excluir

Status de um pedido: `Pendente` (em preparo) → `Pronto` (pronto para retirar) → `Concluído` (entregue). Antes de ser entregue, o pedido pode ser `Cancelado`.

## Arquitetura

```mermaid
flowchart LR
    T["Tela<br/>(HTML + JS)"] -->|"fetch: HTTP + JSON"| C["Controller<br/>(rotas)"]
    C --> S["Service<br/>(regras)"]
    S --> M["Model<br/>(CRUD)"]
    S --> R["Repository<br/>(consultas especiais)"]
    M --> DB[("MySQL")]
    R -->|"CALL sp_..."| DB
```

| Camada | Pasta | Papel |
|---|---|---|
| Controller | [`backend/controllers/`](backend/controllers/README.md) | Recebe a requisição, chama o service e devolve JSON |
| Service | [`backend/services/`](backend/services/README.md) | Um caso de uso por classe, com as regras de negócio |
| Model | [`backend/models/`](backend/models/README.md) | Uma classe por tabela, com o CRUD |
| Repository | [`backend/repositories/`](backend/repositories/README.md) | Consultas não-CRUD, feitas por stored procedures |

Exemplo, o aluno finaliza o pedido:

```
cardapio.js  →  POST /api/carrinho/finalizar  →  item_pedido_controller  →  FinalizarPedidoService  →  Pedido / ItemPedido  →  banco
```

O diagrama de classes está em [`docs/diagrama-de-classes.md`](docs/diagrama-de-classes.md).

## Stored procedures

| Procedure | Usada em |
|---|---|
| `sp_produtos_por_categoria` | Filtro por categoria |
| `sp_produtos_por_faixa_de_preco` | Filtro por preço |
| `sp_produtos_ordenar_por_preco` / `sp_produtos_ordenar_por_nome` | Ordenação |
| `sp_repetir_ultimo_pedido` | "Repetir último pedido" |
| `sp_combinacoes_mais_pedidas` | Combos mais pedidos |

Elas são criadas pelo [`backend/database/create-database.sql`](backend/database/README.md).

## Como rodar

```bash
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Abra **http://127.0.0.1:5000**.

No servidor (Linux), use o Gunicorn em vez do `python app.py`:

```bash
gunicorn -w 2 -b 0.0.0.0:5000 app:app
```

Sem configuração, o projeto usa SQLite (`cantina.db`). Para usar o MySQL, rode o `create-database.sql` e crie um `.env` na raiz:

```env
DATABASE_URL=mysql+pymysql://usuario:senha@localhost/cantina_db?charset=utf8mb4
SECRET_KEY=um-texto-longo-e-aleatorio
```

O modo debug vem desligado. Para ligar no seu computador, acrescente `FLASK_DEBUG=True` no `.env`.

## Pastas

| Pasta | O que tem |
|---|---|
| [`backend/`](backend/README.md) | A API: camadas, `app.py` e login |
| [`backend/database/`](backend/database/README.md) | Script do MySQL (tabelas e procedures) |
| [`front-end/`](front-end/README.md) | As páginas |
| [`front-end/js/`](front-end/js/README.md) | Um JavaScript por página |
| [`front-end/assets/imagens-produtos/`](front-end/assets/imagens-produtos/README.md) | Fotos dos produtos |
| [`docs/`](docs/diagrama-de-classes.md) | Diagrama de classes |

## Limitações

- **Preço promocional:** o campo existe, mas o pedido usa sempre o `preco_atual`.
- **Dividir conta (rateio):** a classe `RateioPagamento` e a tabela existem, mas ainda não têm tela nem rota.
