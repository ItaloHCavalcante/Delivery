import prisma from '../db/prisma';
import { Produto, StatusPedido } from '../../generated/prisma';

/**
 * Interface para os dados necessários para criar um produto.
 * Usamos `Omit` para criar um tipo a partir do `Produto`,
 * excluindo campos que são gerados automaticamente pelo banco.
 */
type ProdutoCreateData = Omit<Produto, 'id' | 'createdAt' | 'updatedAt'>;

    //Nessa classe foi colocada a lógica de negócio relacionada aos produtos
export class ProdutoService {

    // Lógica para Criar um produto
    async createProduto(dadosProduto: ProdutoCreateData, usuarioDonoId: number): Promise<Produto> {
        // A lógica de verificação de permissão será feita no controller ou em um passo anterior,
        // garantindo que o estabelecimento pertence ao usuário.
        return prisma.produto.create({
            data: dadosProduto,
        });
    }

    // Lógica para Criar/Atualizar um produto, garantindo a permissão
    async updateProduto(produtoId: number, dadosProduto: Partial<Produto>, usuarioDonoId: number): Promise<Produto> {
        
        //Buscamos o produto para obter seu EstabelecimentoID
        const produto = await prisma.produto.findUnique({
            where: { id: produtoId },
            select: { estabelecimento: { select: { usuarioId: true } } } //seleciona o ip do dono
        });

        if (!produto) {
            throw new Error('Produto não encontrado.'); 
        }
        
        // Verificação de Permissão
        if (produto.estabelecimento.usuarioId !== usuarioDonoId) {
            //Informa que apenas o dono pode editar o produto
            throw new Error('Permissão negada. Apenas o dono pode editar este produto.'); 
        }

        //Caso passe na verificação, atualize o produto
        const produtoAtualizado = await prisma.produto.update({
            where: { id: produtoId },
            data: dadosProduto,
        });

        return produtoAtualizado;
    }

    // Método de listagem de produtos por estabelecimento
    async findProdutosByEstabelecimento(estabelecimentoId: number) {
        return prisma.produto.findMany({
            where: { estabelecimentoId: estabelecimentoId },
        });
    }
}

interface ItemInput {
    produtoId: number;
    quantidade: number;
}


export class PedidoService {

    // Criação de pedidos
    async createPedido(usuarioClienteId: number, estabelecimentoId: number, itens: ItemInput[]) {
        
        // O $transaction garante que todas as operações dentro dele dependam uma da outra, ou seja, se uma falhar todas falham.
        const novoPedido = await prisma.$transaction(async (tx) => {
            let totalGeral = 0;
            const itensDoPedido = [];

            // Processar Itens e Calcular Total
            for (const item of itens) {
                // Buscamos o produto REAL para obter o preço e garantir que ele exista
                const produto = await tx.produto.findUnique({
                    where: { id: item.produtoId },
                    select: { preco: true, estabelecimentoId: true } // Buscamos apenas o necessário
                });

                if (!produto || produto.estabelecimentoId !== estabelecimentoId) {
                    throw new Error(`Produto ${item.produtoId} não é válido para este estabelecimento.`);
                }

                // Gera o valor total do pedido
                const precoUnitario = produto.preco; 
                const subtotal = precoUnitario * item.quantidade;
                totalGeral += subtotal;

                itensDoPedido.push({
                    produtoId: item.produtoId,
                    quantidade: item.quantidade,
                    precoUnitario: precoUnitario, //armazena o preço real no momento
                });
            }

            //Criar o Pedido
            const pedido = await tx.pedido.create({
                data: {
                    usuarioId: usuarioClienteId,
                    estabelecimentoId: estabelecimentoId,
                    total: totalGeral, // O total calculado pelo Service
                    status: StatusPedido.PENDENTE,
                }
            });

            // 3. Criar os Itens do Pedido (relacionados ao pedido recém-criado)
            // Mapeamos a lista para incluir o ID do Pedido
            const itensComPedidoId = itensDoPedido.map(i => ({ ...i, pedidoId: pedido.id }));

            await tx.pedidoItem.createMany({
                data: itensComPedidoId,
            });

            return pedido;
        });

        return novoPedido; 
    }

    // Listar Pedidos
    async findPedidos(filtros: { estabelecimentoId?: number; usuarioId?: number }) {
        return prisma.pedido.findMany({
            where: filtros,
            include: { itens: true, estabelecimento: { select: { nome: true } } },
            orderBy: { createdAt: 'desc' } // Pedidos mais recentes primeiro
        });
    }
}