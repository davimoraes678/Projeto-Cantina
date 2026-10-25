# Roteiro do vídeo de demonstração (até 5 minutos)

A numeração entre colchetes, ex.: **[18]**, é a da seção
[Funcionalidades Implementadas](../README.md#funcionalidades-implementadas) do README.

## Antes de gravar

1. Rode o `create-database.sql` no MySQL (recria as tabelas e as procedures) e apague as imagens antigas de `arquivos/`.
2. `python app.py` com o `.env` apontando para o MySQL.
3. Tenha 2 imagens de produto prontas no computador.
4. Use **duas janelas**: uma normal (mestre/admin) e uma anônima (aluno), para trocar de usuário sem logout.
5. Deixe o terminal do Flask visível num canto: as requisições aparecendo mostram a integração com a API.

## Roteiro

| Tempo | O que mostrar | Funcionalidades |
|---|---|---|
| 0:00–0:20 | Apresentação rápida: o sistema e a arquitetura (mostrar a pasta `backend/` com `controllers/`, `services/`, `models/`, `repositories/` e o diagrama em `docs/`) | — |
| 0:20–0:50 | **Janela normal:** cadastrar o primeiro usuário (vira mestre). Sair e entrar de novo | [1] [2] [3] |
| 0:50–1:40 | **Admin (mestre):** cadastrar 3 produtos de categorias diferentes, dois com foto. Editar o preço de um. Cadastrar um 4º e excluir | [10] [11] [12] [13] |
| 1:40–2:00 | **Janela anônima:** cadastrar o aluno "Bruno". **Mestre:** recarregar a página de admin, promover outro aluno a admin, excluir um aluno de teste | [7] [8] [9] |
| 2:00–2:40 | **Bruno:** ver o cardápio, clicar em Bebidas, filtrar por preço máximo, ordenar por preço | [14] [15] [16] [17] |
| 2:40–3:00 | **Bruno:** tentar finalizar sem saldo (mostrar o aviso). Ir em Carteira, clicar + R$ 20 duas vezes e adicionar | [18] |
| 3:00–3:30 | **Bruno:** adicionar 2 produtos (mostrar o aviso e o total mudando), remover um, adicionar de novo, finalizar. Mostrar o saldo menor | [19] [20] [21] |
| 3:30–3:45 | **Bruno:** "Repetir último pedido" e finalizar de novo. Recarregar a página: aparece "Combinações mais pedidas"; clicar numa | [22] [23] |
| 3:45–4:20 | **Mestre:** painel de pedidos em andamento. Concluir o primeiro pedido e cancelar o segundo (mostrar o saldo do Bruno voltando na tabela de alunos). Abrir o Histórico | [24] [25] [26] [27] |
| 4:20–4:40 | **Bruno:** recarregar a cantina → a janela de avaliação aparece. Dar nota 5 com comentário | [28] |
| 4:40–5:00 | **Bruno:** Minha Conta → ver os dados, editar o nome, e "Remover minha conta" | [4] [5] [6] |

## Dicas

- Fale o número da funcionalidade enquanto mostra; facilita a conferência com o README.
- Se sobrar tempo, mostre o banco depois de um passo, ex.: `SELECT nome, saldo FROM aluno;` antes e depois de cancelar o pedido.
- Se a gravação passar de 5 minutos, corte a apresentação inicial e os filtros [16] [17], mantendo [15].
