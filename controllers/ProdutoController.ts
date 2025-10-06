// src/controllers/ProdutoController.ts
import { Request, Response } from 'express';
import { ProdutoService } from '../services/ProdutoService';
import prisma from '../db/prisma';

const produtoService = new ProdutoService();

export class ProdutoController {

    // Rota: POST /produtos
    async create(req: Request, res: Response): Promise<Response> {
        const { nome, descricao, preco, estabelecimentoId } = req.body;

        // Verificação de segurança: Garante que o usuário está autenticado
        if (!req.user) {
            return res.status(401).json({ message: 'Acesso não autorizado. Faça o login para continuar.' });
        }
        const usuarioDonoId = req.user.id;

        try {
            // 1. Validação dos dados de entrada
            if (!nome || !preco || !estabelecimentoId) {
                return res.status(400).json({ message: 'Nome, preço e estabelecimentoId são obrigatórios.' });
            }

            // 2. Regra de Negócio: Verificar se o usuário é o dono do estabelecimento
            const estabelecimento = await prisma.estabelecimento.findUnique({
                where: { id: estabelecimentoId },
            });

            if (!estabelecimento) {
                return res.status(404).json({ message: 'Estabelecimento não encontrado.' });
            }

            if (estabelecimento.usuarioId !== usuarioDonoId) {
                return res.status(403).json({ message: 'Permissão negada. Você não é o dono deste estabelecimento.' });
            }

            const novoProduto = await produtoService.createProduto({ nome, descricao, preco, estabelecimentoId }, usuarioDonoId);
            return res.status(201).json(novoProduto);
        } catch (error) {
            if (error instanceof Error) {
                return res.status(500).json({ message: error.message });
            }
            return res.status(500).json({ message: 'Um erro inesperado ocorreu ao criar o produto.' });
        }
    }
    
    // Rota: PUT /produtos/:id
    async update(req: Request, res: Response): Promise<Response> {
        // Obter os IDs dos parâmetros e do usuário autenticado (JWT/Auth Middleware)
        const produtoId = parseInt(req.params.id);
        const { nome, descricao, preco } = req.body;
        
        // Verificação de segurança: Garante que o usuário está autenticado
        if (!req.user) {
            return res.status(401).json({ message: 'Acesso não autorizado. Faça o login para continuar.' });
        }
        const usuarioDonoId = req.user.id;
        
        try {
            const produtoAtualizado = await produtoService.updateProduto(produtoId, { nome, descricao, preco }, usuarioDonoId);
            return res.status(200).json(produtoAtualizado);
        } catch (error) {
            // Tratamento de erros com verificação de tipo
            if (error instanceof Error) {
                if (error.message.includes('Permissão negada')) {
                    return res.status(403).json({ message: error.message }); // Forbidden
                }
                if (error.message.includes('não encontrado')) {
                    return res.status(404).json({ message: error.message }); // Not Found
                }
            }
            return res.status(500).json({ message: 'Um erro inesperado ocorreu ao atualizar o produto.' });
        }
    }
    // ... Métodos para listar e deletar serão adicionados aqui
}