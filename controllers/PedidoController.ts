import { Request, Response } from 'express';
import { PedidoService } from '../services/PedidoService';

const pedidoService = new PedidoService();

export class PedidoController {

    // Rota: PATCH /pedidos/:id/cancelar
    async cancelar(req: Request, res: Response): Promise<Response> {
        const pedidoId = parseInt(req.params.id);

        // Verificação de segurança: Garante que o usuário está autenticado
        if (!req.user) {
            return res.status(401).json({ message: 'Acesso não autorizado. Faça o login para continuar.' });
        }
        const usuarioClienteId = req.user.id;

        try {
            const pedidoCancelado = await pedidoService.cancelarPedido(pedidoId, usuarioClienteId);
            return res.status(200).json(pedidoCancelado);
        } catch (error) {
            if (error instanceof Error) {
                if (error.message.includes('não encontrado')) {
                    return res.status(404).json({ message: error.message }); // Not Found
                }
                if (error.message.includes('Permissão negada')) {
                    return res.status(403).json({ message: error.message }); // Forbidden
                }
                if (error.message.includes('Não é possível cancelar')) {
                    return res.status(400).json({ message: error.message }); // Bad Request
                }
            }
            return res.status(500).json({ message: 'Um erro inesperado ocorreu ao cancelar o pedido.' });
        }
    }

    // ... outros métodos do controller de pedido (criar, listar) podem ser adicionados aqui
}