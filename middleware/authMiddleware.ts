import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../db/prisma';

/**
 * Middleware de Autenticação (Exemplo)
 * O Miguel irá implementar a versão final e mais robusta.
 * 
 * Este middleware verifica o token JWT enviado no header 'Authorization',
 * decodifica para obter o ID do usuário e anexa o objeto do usuário ao `req`.
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token de autenticação não fornecido ou mal formatado.' });
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET || 'seu_segredo_jwt'; // Use uma variável de ambiente!

    try {
        const payload = jwt.verify(token, jwtSecret) as { id: number; email: string };

        // Anexa o usuário ao objeto `req` para ser usado nos controllers
        req.user = { id: payload.id, email: payload.email };

        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido ou expirado.' });
    }
};
