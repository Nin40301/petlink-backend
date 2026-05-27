/**
 * routes/pagamentos.ts
 * Rotas para processar pagamentos (PIX e Cartão).
 *
 * POST   /api/pagamentos              - Criar pagamento
 * GET    /api/pagamentos/:id          - Obter detalhes do pagamento
 * PUT    /api/pagamentos/:id/confirmar - Confirmar pagamento (mock)
 */

import { Router, Request, Response } from 'express';
import getDb from '../database';
import { queryOne, queryAll, execute } from '../db-utils';

const router = Router();

// POST /api/pagamentos
router.post('/', async (req: Request, res: Response) => {
  try {
    const { pedidoId, valor, metodo } = req.body;
    if (!pedidoId || !valor || !metodo) {
      return res.status(400).json({ success: false, message: 'Dados inválidos' });
    }

    const db = await getDb();
    const pagamento = execute(db,
      'INSERT INTO pagamentos (pedidoId, valor, metodo, status) VALUES (?,?,?,?)',
      [pedidoId, valor, metodo, 'pendente']
    );

    res.json({ success: true, data: { id: pagamento, pedidoId, valor, metodo, status: 'pendente' } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao criar pagamento', error: String(error) });
  }
});

// GET /api/pagamentos/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const pagamento = queryOne(db, 'SELECT * FROM pagamentos WHERE id = ?', [req.params.id]);
    if (!pagamento) {
      return res.status(404).json({ success: false, message: 'Pagamento não encontrado' });
    }
    res.json({ success: true, data: pagamento });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar pagamento', error: String(error) });
  }
});

// PUT /api/pagamentos/:id/confirmar (mock)
router.put('/:id/confirmar', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const pagamento = queryOne(db, 'SELECT * FROM pagamentos WHERE id = ?', [req.params.id]);
    if (!pagamento) {
      return res.status(404).json({ success: false, message: 'Pagamento não encontrado' });
    }

    // Simula confirmação de pagamento
    execute(db, 'UPDATE pagamentos SET status = ? WHERE id = ?', ['confirmado', req.params.id]);

    // Atualiza status do pedido para 'aceito'
    execute(db, 'UPDATE pedidos SET status = ? WHERE id = ?', ['aceito', pagamento.pedidoId]);

    res.json({ success: true, message: 'Pagamento confirmado com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao confirmar pagamento', error: String(error) });
  }
});

// GET /api/pagamentos (listar todos)
router.get('/', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const pagamentos = queryAll(db, 'SELECT * FROM pagamentos ORDER BY dataPagamento DESC');
    res.json({ success: true, data: pagamentos });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao listar pagamentos', error: String(error) });
  }
});

export default router;
