import { Router } from 'express';
import { EstabelecimentoController } from '../controllers/EstabelecimentoController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const estabelecimentoController = new EstabelecimentoController();

// --- Rotas Públicas ---
// Lista todos os estabelecimentos
router.get('/', estabelecimentoController.findAll);

// Busca um estabelecimento específico
router.get('/:id', estabelecimentoController.findById);

// --- Rotas Protegidas (requerem login) ---
// Cria um novo estabelecimento
router.post('/', authMiddleware, estabelecimentoController.create);

// Atualiza um estabelecimento (só o dono pode)
router.put('/:id', authMiddleware, estabelecimentoController.update);

// Deleta um estabelecimento (só o dono pode)
router.delete('/:id', authMiddleware, estabelecimentoController.deactivate);

export default router;