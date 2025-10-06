import prisma from '../db/prisma';
import { Pedido, StatusPedido } from '../../generated/prisma';

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

    // Lógica para cancelar um pedido
    async cancelarPedido(pedidoId: number, usuarioClienteId: number): Promise<Pedido> {
        const pedido = await prisma.pedido.findUnique({
            where: { id: pedidoId },
        });

        if (!pedido) {
            throw new Error('Pedido não encontrado.');
        }

        // Regra de Negócio 1: Apenas o cliente que fez o pedido pode cancelar.
        if (pedido.usuarioId !== usuarioClienteId) {
            throw new Error('Permissão negada. Você só pode cancelar seus próprios pedidos.');
        }

        // Regra de Negócio 2: O pedido só pode ser cancelado se estiver pendente.
        if (pedido.status !== StatusPedido.PENDENTE) {
            throw new Error('Não é possível cancelar um pedido que já está em preparo ou foi concluído.');
        }

        return prisma.pedido.update({
            where: { id: pedidoId },
            data: { status: StatusPedido.CANCELADO },
        });
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