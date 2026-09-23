# Projeto-Cantina
Integrantes
Caio Antunes Guedes Alves da SIlva -12501719
Davi Pimentel de Moraes - 12502120
Ana Julia Gois do Nascimento - 22401369
João Vitor Marques de Sampaio - 22400540
Felipe Ferreira da Fonseca - 12502537
Maria Eduarda Fidelis Correa - 12401595
Stack front end
HTML, CSS, JavaScript 
Stack back end
Python, Flask
Banco de dados 
MySQL 

## Rodando com MySQL (necessário para a busca de produtos)

A busca/filtro de produtos (`GET /api/produtos/buscar`) chama stored procedures
via `backend/repositories/produto_repository.py` (fluxo `Controller -> Service ->
Repository -> CALL sp_...(...) -> MySQL`). Isso só funciona com MySQL - o
fallback padrão em SQLite não suporta procedures.

1. Crie o banco e as procedures:
   ```
   mysql --default-character-set=utf8mb4 -u root -p < backend/database/create-database.sql
   ```
2. Copie `.env.example` para `.env` e ajuste usuário/senha:
   ```
   DATABASE_URL=mysql+pymysql://usuario:senha@localhost/cantina_db?charset=utf8mb4
   ```
3. Rode a aplicação normalmente (`python app.py`).

Sem essa configuração, o resto do app (cadastro/listagem de alunos, produtos e
pedidos) continua funcionando em SQLite, mas a busca retorna erro 503 pedindo
pra configurar o MySQL.


## Interface reaproveitada do CANTINA-REAL

A interface em `front-end/` reaproveita a estrutura visual, o CSS e as imagens de
[22401369/CANTINA-REAL](https://github.com/22401369/CANTINA-REAL), referência
`aa711e63b5a8423aa8daeac9bdd112c951363e70`. O JavaScript de integração foi escrito
para as rotas deste projeto. Nenhum backend, banco, autenticação ou JavaScript do
repositório de referência foi importado.

### Executar

```bash
python -m venv .venv
# Linux/macOS: source .venv/bin/activate
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Abra `http://127.0.0.1:5000` pelo Flask (não abra o HTML diretamente).
Na primeira execução, use **Gestão** para cadastrar alunos e produtos.

| Tela | Endereço | Integração |
| --- | --- | --- |
| Cardápio | `/` | Produtos reais, busca por nome e categorias no navegador |
| Carrinho | `/cart.html` | Quantidades, aluno e retirada opcional; POST `/api/pedidos` |
| Pedidos | `/orders.html` | Listagem e filtro por aluno |
| Detalhes | `/order-status.html?id=1` | Dados e status retornados pela API |
| Gestão existente | `/gestao.html` | Cadastro/edição/exclusão e controle de pedidos preservados |

A matrícula fica para uma etapa posterior. Selecionar um aluno identifica o
pedido, **não autentica o usuário**. O backend atual não controla acesso: gestão
e pedidos continuam acessíveis como antes. Login, matrícula, perfil,
notificações, pagamentos e demais funcionalidades exclusivas do outro backend
não foram importados. O painel existente continua responsável por alterar o
status do pedido.

O carrinho persiste apenas IDs e quantidades; preços vêm do catálogo, e o total
final é calculado pelo backend. Usa-se `preco_atual`, o mesmo campo cobrado pelo
serviço de pedidos; não se aplica desconto promocional apenas na interface.
A interface confere disponibilidade antes do envio, mas o backend existente não
reserva nem baixa estoque e não resolve concorrência entre compras. Essas regras
permanecem como trabalho separado. Imagens são associadas por nomes conhecidos;
produtos sem correspondência recebem um ícone genérico.

### Verificação da interface

O teste usa Playwright e cria dados: execute apenas com banco descartável.
Em um terminal, configure `DATABASE_URL=sqlite:////tmp/cantina-test.db`
(ou caminho absoluto apropriado no Windows) e inicie `python app.py`.
Em outro, com Playwright e Chromium instalados, rode `node tests/frontend.cjs`.
O teste verifica cardápio, filtro, indisponibilidade, carrinho, criação e leitura
do pedido, horário de retirada, acesso à gestão e largura mobile.
