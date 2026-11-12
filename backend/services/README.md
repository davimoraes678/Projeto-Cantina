# backend/services/

Os **casos de uso** do sistema. Cada um é uma classe num arquivo próprio, com o método `executar()`. Os [controllers](../controllers/README.md) chamam os services, e os services usam os [models](../models/README.md) (CRUD) ou os [repositories](../repositories/README.md) (consultas especiais).

Todo `executar()` devolve **`(dicionário, código_http)`**, por exemplo `({"erro": "Produto não encontrado"}, 404)`.

```python
class FinalizarPedidoService:
    @staticmethod
    def executar():
        ...
        return pedido.to_dict(), 200
```

## `aluno/` — conta, login e carteira

| Arquivo | Classe | Caso de uso |
|---|---|---|
| `criar_aluno_service.py` | `CriarAlunoService` | Cadastrar aluno (o primeiro vira mestre), salvar o hash da senha e já logar |
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
| `filtrar_produtos_service.py` | `FiltrarProdutosService` | Buscar por categoria, faixa de preço ou ordenar, pelo `ProdutoRepository` (procedure no MySQL, ORM nos outros bancos). A procedure faz o primeiro filtro, e os outros são aplicados em cima do resultado, então os filtros se combinam |
| `enviar_imagem_produto_service.py` | `EnviarImagemProdutoService` | Salvar a foto do produto (PNG, JPG ou WEBP até 5 MB, reduzida para até 600×600) |
| `buscar_imagem_produto_service.py` | `BuscarImagemProdutoService` | Achar o arquivo da foto (o controller é quem envia o arquivo) |

## `carrinho/` — carrinho do aluno logado

O carrinho são os `ItemPedido` do aluno que ainda não têm pedido (`id_pedido` vazio). O `Pedido` só é criado ao finalizar. Todos usam o **aluno logado** (`current_user`).

| Arquivo | Classe | Caso de uso |
|---|---|---|
| `ver_carrinho_service.py` | `VerCarrinhoService` | Ver o carrinho (vazio se o aluno ainda não adicionou nada) |
| `adicionar_item_carrinho_service.py` | `AdicionarItemCarrinhoService` | Adicionar produto: cria um `ItemPedido` sem pedido; se o produto já está lá, **soma** a quantidade; guarda nome e preço do momento |
| `remover_item_carrinho_service.py` | `RemoverItemCarrinhoService` | Remover item (só se for do carrinho **do aluno logado**) |
| `finalizar_pedido_service.py` | `FinalizarPedidoService` | Conferir estoque e saldo; se tudo der, descontar os dois, criar o pedido `"Pendente"` e passar os itens do carrinho para ele |
| `repetir_pedido_service.py` | `RepetirPedidoService` | "Pedir de novo": confere se o pedido é do aluno e adiciona os itens dele com o `AdicionarItemCarrinhoService` (pula produtos excluídos) |
| `repetir_ultimo_pedido_service.py` | `RepetirUltimoPedidoService` | Pegar os itens do último pedido (procedure `sp_repetir_ultimo_pedido` pelo `PedidoRepository`; fora do MySQL, pelo ORM) e adicioná-los com o `AdicionarItemCarrinhoService` |

## `pedido/` — pedidos feitos

| Arquivo | Classe | Caso de uso |
|---|---|---|
| `listar_pedidos_service.py` | `ListarPedidosService` | Listar os pedidos já separados em `preparo`, `prontos` e `historico` (tela do admin) |
| `buscar_pedido_service.py` | `BuscarPedidoService` | Ver um pedido (o dono, ou admin/mestre) |
| `marcar_pronto_service.py` | `MarcarProntoService` | Marcar como `"Pronto"`: o aluno vê que pode retirar (só pedidos `Pendente`) |
| `concluir_pedido_service.py` | `ConcluirPedidoService` | Marcar como `"Concluído"` quando o aluno retira no balcão (vai para o histórico como "Entregue") |
| `cancelar_pedido_service.py` | `CancelarPedidoService` | Marcar como `"Cancelado"`, **devolvendo o valor para a carteira do aluno e os produtos para o estoque** |
| `listar_meus_pedidos_service.py` | `ListarMeusPedidosService` | Os pedidos do aluno logado já separados em `andamento` e `historico`, o mais recente primeiro (página "Meus pedidos") |
| `combinacoes_mais_pedidas_service.py` | `CombinacoesMaisPedidasService` | As 3 duplas de produtos mais pedidas juntas (procedure `sp_combinacoes_mais_pedidas`, só no MySQL) |

## `avaliacao/`

| Arquivo | Classe | Caso de uso |
|---|---|---|
| `avaliar_pedido_service.py` | `AvaliarPedidoService` | Avaliar um pedido: só o dono, só pedido concluído, nota de 1 a 5, uma vez só |

O `produto/imagem.py` tem as funções das fotos (nome do arquivo, salvar e renomear), usadas pelos services de produto.
