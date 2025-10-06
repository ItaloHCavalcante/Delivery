import * as express from 'express';

// Extende a interface Request
declare global {
    namespace Express {
        // Defina o que o objeto 'user' deve conter
        interface User {
            id: number; // O ID do usuário (usuarioDonoId) que você espera do seu JWT
            email: string;
            // ... outras informações úteis do usuário
        }

        // Adiciona a propriedade 'user' ao objeto Request
        interface Request {
            user?: User; 
        }
    }
}