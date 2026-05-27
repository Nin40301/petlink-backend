/**
 * routes/carteira.ts
 * Rotas para gerenciar carteira digital e saldo dos usuários.
 *
 * GET    /api/carteira/:usuarioId    - Obter saldo do usuário
 * POST   /api/carteira/recarga        - Adicionar saldo (simular recarga)
 * GET    /api/carteira/:usuarioId/historico - Histórico de transações
 */

import { Router, Request, Response } from 'express';
import getDb from '../database';
import { queryOne, queryAll, execute } from '../db-utils';

const router = Router();

// GET /api/carteira/:usuarioId
router.get('/:usuarioId', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const carteira = queryOne(db, 'SELECT * FROM carteira WHERE usuarioId = ?', [req.params.usuarioId]);
    if (!carteira) {
      return res.status(404).json({ success: false, message: 'Carteira não encontrada' });
    }
    res.json({ success: true, data: carteira });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar carteira', error: String(error) });
  }
});

// POST /api/carteira/recarga
router.post('/recarga', async (req: Request, res: Response) => {
  try {
    const { usuarioId, valor, metodo } = req.body;
    if (!usuarioId || !valor || valor <= 0) {
      return res.status(400).json({ success: false, message: 'Dados inválidos' });
    }

    const db = await getDb();
    const carteira = queryOne(db, 'SELECT * FROM carteira WHERE usuarioId = ?', [usuarioId]);
    if (!carteira) {
      return res.status(404).json({ success: false, message: 'Carteira não encontrada' });
    }

    // Atualiza saldo
    const novoSaldo = carteira.saldo + valor;
    execute(db, 'UPDATE carteira SET saldo = ? WHERE usuarioId = ?', [novoSaldo, usuarioId]);

    // Registra transação
    execute(db,
      'INSERT INTO transacoes (usuarioId, tipo, valor, descricao) VALUES (?,?,?,?)',
      [usuarioId, 'entrada', valor, `Recarga via ${metodo || 'PIX'}`]
    );

    res.json({ success: true, data: { saldoAnterior: carteira.saldo, novoSaldo } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao recarregar', error: String(error) });
  }
});

// GET /api/carteira/:usuarioId/historico
router.get('/:usuarioId/historico', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const transacoes = queryAll(db,
      'SELECT * FROM transacoes WHERE usuarioId = ? ORDER BY dataTransacao DESC',
      [req.params.usuarioId]
    );
    res.json({ success: true, data: transacoes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar histórico', error: String(error) });
  }
});

export default router;
