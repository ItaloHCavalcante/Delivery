import { Router } from 'express';
import { ProdutoController } from '../controllers/ProdutoController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const produtoController = new ProdutoController();

// Ex: GET /api/produtos?estabelecimentoId=1
router.get('/', produtoController.listByEstabelecimento);

// Busca um produto específico pelo ID
router.get('/:id', produtoController.findById);

// --- Rotas Protegidas (precisam de autenticação do dono) ---

// Cria um novo produto para um estabelecimento
router.post('/', authMiddleware, produtoController.create);

// Atualiza um produto existente
router.put('/:id', authMiddleware, produtoController.update);

// Deleta um produto
router.delete('/:id', authMiddleware, produtoController.delete);

export default router;