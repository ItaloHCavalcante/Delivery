import prisma from '../db/prisma';
import { Produto } from '../../generated/prisma';

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

    // Lógica para buscar um produto por ID
    async findProdutoById(produtoId: number): Promise<Produto | null> {
        return prisma.produto.findUnique({
            where: { id: produtoId },
            include: {
                estabelecimento: {
                    select: { nome: true } // Inclui o nome do estabelecimento
                }
            }
        });
    }

    // Lógica para Deletar um produto
    async deleteProduto(produtoId: number, usuarioDonoId: number): Promise<Produto> {
        const produto = await prisma.produto.findUnique({
            where: { id: produtoId },
            select: { estabelecimento: { select: { usuarioId: true } } }
        });

        if (!produto) {
            throw new Error('Produto não encontrado.');
        }

        if (produto.estabelecimento.usuarioId !== usuarioDonoId) {
            throw new Error('Permissão negada. Apenas o dono pode deletar este produto.');
        }

        return prisma.produto.delete({ where: { id: produtoId } });
    }

    // Método de listagem de produtos por estabelecimento
    async findProdutosByEstabelecimento(estabelecimentoId: number) {
        return prisma.produto.findMany({
            where: { estabelecimentoId: estabelecimentoId },
        });
    }
}