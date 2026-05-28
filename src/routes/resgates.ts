/**
 * routes/resgates.ts
 * Rotas para gerenciar resgates de saldo (prestadores solicitam transferência).
 *
 * POST   /api/resgates                - Solicitar resgate
 * GET    /api/resgates/prestador/:id  - Listar resgates do prestador
 * GET    /api/resgates/:id            - Obter detalhes do resgate
 * PUT    /api/resgates/:id/aprovar    - Admin aprova resgate
 * PUT    /api/resgates/:id/rejeitar   - Admin rejeita resgate
 */

import { Router, Request, Response } from 'express';
import getDb from '../database';
import { queryOne, queryAll, execute } from '../db-utils';

const router = Router();

// POST /api/resgates
router.post('/', async (req: Request, res: Response) => {
  try {
    const { prestadorId, valor, chavePixOuConta } = req.body;
    if (!prestadorId || !valor || valor <= 0) {
      return res.status(400).json({ success: false, message: 'Dados inválidos' });
    }

    const db = await getDb();
    const carteira = queryOne(db, 'SELECT * FROM carteira WHERE usuarioId = ?', [prestadorId]);
    if (!carteira || carteira.saldo < valor) {
      return res.status(400).json({ success: false, message: 'Saldo insuficiente' });
    }

    const resgate = execute(db,
      'INSERT INTO resgates (prestadorId, valor, status, chavePixOuConta) VALUES (?,?,?,?)',
      [prestadorId, valor, 'pendente', chavePixOuConta]
    );

    res.json({ success: true, data: { id: resgate, prestadorId, valor, status: 'pendente' } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao solicitar resgate', error: String(error) });
  }
});

// GET /api/resgates/prestador/:id
router.get('/prestador/:prestadorId', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const resgates = queryAll(db,
      'SELECT * FROM resgates WHERE prestadorId = ? ORDER BY dataRequisicao DESC',
      [req.params.prestadorId]
    );
    res.json({ success: true, data: resgates });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao listar resgates', error: String(error) });
  }
});

// GET /api/resgates/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const resgate = queryOne(db, 'SELECT * FROM resgates WHERE id = ?', [req.params.id]);
    if (!resgate) {
      return res.status(404).json({ success: false, message: 'Resgate não encontrado' });
    }
    res.json({ success: true, data: resgate });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar resgate', error: String(error) });
  }
});

// PUT /api/resgates/:id/aprovar (admin)
router.put('/:id/aprovar', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const resgate = queryOne(db, 'SELECT * FROM resgates WHERE id = ?', [req.params.id]);
    if (!resgate) {
      return res.status(404).json({ success: false, message: 'Resgate não encontrado' });
    }

    // Atualiza status para 'aprovado'
    execute(db,
      'UPDATE resgates SET status = ?, dataAprovacao = ? WHERE id = ?',
      ['aprovado', new Date().toISOString(), req.params.id]
    );

    // Deduz saldo da carteira
    const carteira = queryOne(db, 'SELECT * FROM carteira WHERE usuarioId = ?', [resgate.prestadorId]);
    execute(db,
      'UPDATE carteira SET saldo = ? WHERE usuarioId = ?',
      [carteira.saldo - resgate.valor, resgate.prestadorId]
    );

    // Registra transação de saída
    execute(db,
      'INSERT INTO transacoes (usuarioId, tipo, valor, descricao) VALUES (?,?,?,?)',
      [resgate.prestadorId, 'saida', resgate.valor, 'Resgate de saldo aprovado']
    );

    res.json({ success: true, message: 'Resgate aprovado com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao aprovar resgate', error: String(error) });
  }
});

// PUT /api/resgates/:id/rejeitar (admin)
router.put('/:id/rejeitar', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const resgate = queryOne(db, 'SELECT * FROM resgates WHERE id = ?', [req.params.id]);
    if (!resgate) {
      return res.status(404).json({ success: false, message: 'Resgate não encontrado' });
    }

    execute(db, 'UPDATE resgates SET status = ? WHERE id = ?', ['rejeitado', req.params.id]);
    res.json({ success: true, message: 'Resgate rejeitado' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao rejeitar resgate', error: String(error) });
  }
});

// GET /api/resgates (listar todos - admin)
router.get('/', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const resgates = queryAll(db, 'SELECT * FROM resgates ORDER BY dataRequisicao DESC');
    res.json({ success: true, data: resgates });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao listar resgates', error: String(error) });
  }
});

export default router;
