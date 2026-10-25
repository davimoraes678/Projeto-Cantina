# backend/services/

Os **casos de uso** do sistema. **Cada caso de uso é uma classe**, com um único método `executar()`, num arquivo próprio. Os [controllers](../controllers/README.md) chamam os services; os services fazem as validações e usam os [models](../models/README.md) (CRUD) ou os [repositories](../repositories/README.md) (consultas especiais).

Todo `executar()` devolve uma tupla **`(dicionário, código_http)`**, por exemplo `({"erro": "Produto não encontrado"}, 404)` ou `(carrinho.to_dict(), 201)`. Os services não usam `request` nem `jsonify`; isso é papel do controller.

```python
class FinalizarPedidoService:
    """Caso de uso: fechar o carrinho como pedido, descontando estoque e saldo."""

    @staticmethod
    def executar():
        ...
        return carrinho.to_dict(), 200
```

## `aluno/` — conta, login e carteira

Detalhes em [`aluno/README.md`](aluno/README.md).

| Arquivo | Classe | Caso de uso |
|---|---|---|
| `criar_aluno_service.py` | `CriarAlunoService` | Cadastrar aluno (o primeiro vira mestre) e já logar |
| `login_aluno_service.py` | `LoginAlunoService` | Entrar com e-mail e senha |
| `logout_aluno_service.py` | `LogoutAlunoService` | Sair |
| `buscar_aluno_atual_service.py` | `BuscarAlunoAtualService` | Ver os dados do aluno logado |
| `atualizar_aluno_service.py` | `AtualizarAlunoService` | Editar nome, e-mail e senha |
| `recarregar_saldo_service.py` | `RecarregarSaldoService` | Adicionar saldo na carteira (R$ 0,01 a R$ 500,00) |
| `listar_aluno_service.py` | `ListarAlunoService` | Listar alunos (mestre) |
| `promover_aluno_service.py` | `PromoverAlunoService` | Tornar um aluno admin (mestre) |
| `deletar_aluno_service.py` | `DeletarAlunoService` | Excluir a própria conta, ou outro aluno (mestre). Os pedidos continuam no histórico |

## `produto/` — cardápio

| Arquivo | Classe | Caso de uso |
|---|---|---|
| `criar_produto_service.py` | `CriarProdutoService` | Cadastrar produto (exige `nome` e `preco_atual`) |
| `listar_produtos_service.py` | `ListarProdutosService` | Listar todos os produtos |
| `buscar_produto_service.py` | `BuscarProdutoService` | Ver um produto pelo id |
| `atualizar_produto_service.py` | `AtualizarProdutoService` | Editar produto (só os campos enviados); ao trocar o nome, renomeia a imagem |
| `deletar_produto_service.py` | `DeletarProdutoService` | Excluir produto; antes, copia o nome para os itens de pedidos antigos e solta o vínculo |
| `filtrar_produtos_service.py` | `FiltrarProdutosService` | Buscar por categoria, faixa de preço ou ordenar. Usa as procedures pelo `ProdutoRepository`; fora do MySQL, a mesma busca pelo ORM. No MySQL, só o primeiro critério é aplicado: categoria, depois faixa de preço, depois ordenação |
| `enviar_imagem_produto_service.py` | `EnviarImagemProdutoService` | Salvar a foto do produto (PNG, JPG ou WEBP até 5 MB, reduzida para até 600×600) |
| `buscar_imagem_produto_service.py` | `BuscarImagemProdutoService` | Achar o arquivo da foto (o controller é quem envia o arquivo) |

## `carrinho/` — carrinho do aluno logado

O carrinho é um `Pedido` com `status = "Carrinho"` (constante `STATUS_CARRINHO` em `models/pedido_model.py`), e cada produto é um `ItemPedido`. Todos usam o **aluno logado** (`current_user`).

| Arquivo | Classe | Caso de uso |
|---|---|---|
| `ver_carrinho_service.py` | `VerCarrinhoService` | Ver o carrinho (um vazio, sem gravar nada, se ainda não existir) |
| `adicionar_item_carrinho_service.py` | `AdicionarItemCarrinhoService` | Adicionar produto: cria o carrinho na primeira vez; se o produto já está lá, **soma** a quantidade; guarda nome e preço do momento |
| `remover_item_carrinho_service.py` | `RemoverItemCarrinhoService` | Remover item (só se for do carrinho **do aluno logado**) |
| `finalizar_pedido_service.py` | `FinalizarPedidoService` | Conferir estoque e saldo; se tudo der, descontar os dois e o carrinho vira pedido `"Pendente"` |
| `repetir_ultimo_pedido_service.py` | `RepetirUltimoPedidoService` | Pegar os itens do último pedido (procedure `sp_repetir_ultimo_pedido` pelo `PedidoRepository`; fora do MySQL, pelo ORM) e adicioná-los com o `AdicionarItemCarrinhoService` |

## `pedido/` — pedidos feitos

| Arquivo | Classe | Caso de uso |
|---|---|---|
| `listar_pedidos_service.py` | `ListarPedidosService` | Listar os pedidos, sem os carrinhos (admin/mestre) |
| `buscar_pedido_service.py` | `BuscarPedidoService` | Ver um pedido (o dono, ou admin/mestre) |
| `concluir_pedido_service.py` | `ConcluirPedidoService` | Marcar como `"Concluído"` (vai para o histórico) |
| `cancelar_pedido_service.py` | `CancelarPedidoService` | Marcar como `"Cancelado"`, **devolvendo o valor para a carteira do aluno e os produtos para o estoque** |
| `combinacoes_mais_pedidas_service.py` | `CombinacoesMaisPedidasService` | As 3 duplas de produtos mais pedidas juntas (procedure `sp_combinacoes_mais_pedidas`; fora do MySQL, pelo ORM) |

## `avaliacao/`

| Arquivo | Classe | Caso de uso |
|---|---|---|
| `avaliar_pedido_service.py` | `AvaliarPedidoService` | Avaliar um pedido: só o dono, só pedido concluído, nota de 1 a 5, uma vez só |

## Fora daqui

- **Login e permissões** (`user_loader`, `admin_required`, `master_required`): [`backend/autenticacao.py`](../autenticacao.py).
- **Funções de apoio das imagens** (nome do arquivo, salvar, renomear): [`backend/utils/imagem.py`](../utils/imagem.py). O nome do arquivo vem do nome do produto: "Suco de Laranja" → `arquivos/suco-de-laranja-imagem.png`.
