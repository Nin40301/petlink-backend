/**
 * routes/avaliacoes.ts
 * Rotas REST para a entidade Avaliação.
 *
 * GET    /api/avaliacoes        - Lista todas as avaliações
 * GET    /api/avaliacoes/:id    - Busca avaliação por ID
 * POST   /api/avaliacoes        - Cria nova avaliação
 * PUT    /api/avaliacoes/:id    - Atualiza avaliação existente
 * DELETE /api/avaliacoes/:id    - Remove avaliação
 */

import { Router, Request, Response } from 'express';
import getDb from '../database';
import { queryAll, queryOne, execute } from '../db-utils';

const router = Router();

// GET /api/avaliacoes
router.get('/', async (_req: Request, res: Response) => {
  try {
    const db = await getDb();
    const avaliacoes = queryAll(db, `
      SELECT a.*,
             p.clienteId,
             p.servicoId,
             p.status AS pedidoStatus,
             c.nome   AS clienteNome,
             s.titulo AS servicoTitulo
      FROM avaliacoes a
      JOIN pedidos  p ON a.pedidoId  = p.id
      JOIN usuarios c ON p.clienteId = c.id
      JOIN servicos s ON p.servicoId = s.id
      ORDER BY a.dataAvaliacao DESC
    `);
    res.json({ success: true, data: avaliacoes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar avaliações', error: String(error) });
  }
});

// GET /api/avaliacoes/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const avaliacao = queryOne(db, `
      SELECT a.*, c.nome AS clienteNome, s.titulo AS servicoTitulo
      FROM avaliacoes a
      JOIN pedidos  p ON a.pedidoId  = p.id
      JOIN usuarios c ON p.clienteId = c.id
      JOIN servicos s ON p.servicoId = s.id
      WHERE a.id = ?
    `, [req.params.id]);
    if (!avaliacao) {
      return res.status(404).json({ success: false, message: 'Avaliação não encontrada' });
    }
    res.json({ success: true, data: avaliacao });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar avaliação', error: String(error) });
  }
});

// POST /api/avaliacoes
router.post('/', async (req: Request, res: Response) => {
  try {
    const { pedidoId, nota, comentario } = req.body;
    if (!pedidoId || !nota) {
      return res.status(400).json({ success: false, message: 'Campos obrigatórios: pedidoId, nota' });
    }
    if (nota < 1 || nota > 5) {
      return res.status(400).json({ success: false, message: 'Nota deve ser entre 1 e 5' });
    }
    const db = await getDb();
    const pedido = queryOne(db, "SELECT id FROM pedidos WHERE id = ? AND status = 'concluido'", [pedidoId]);
    if (!pedido) {
      return res.status(400).json({ success: false, message: 'Pedido não encontrado ou não está concluído' });
    }
    const jaAvaliado = queryOne(db, 'SELECT id FROM avaliacoes WHERE pedidoId = ?', [pedidoId]);
    if (jaAvaliado) {
      return res.status(409).json({ success: false, message: 'Este pedido já possui avaliação' });
    }
    const newId = execute(db,
      'INSERT INTO avaliacoes (pedidoId, nota, comentario) VALUES (?,?,?)',
      [pedidoId, nota, comentario || null]
    );
    const nova = queryOne(db, 'SELECT * FROM avaliacoes WHERE id = ?', [newId]);
    res.status(201).json({ success: true, data: nova });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao criar avaliação', error: String(error) });
  }
});

// PUT /api/avaliacoes/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const existente = queryOne(db, 'SELECT * FROM avaliacoes WHERE id = ?', [req.params.id]);
    if (!existente) {
      return res.status(404).json({ success: false, message: 'Avaliação não encontrada' });
    }
    const { nota, comentario } = req.body;
    if (nota && (nota < 1 || nota > 5)) {
      return res.status(400).json({ success: false, message: 'Nota deve ser entre 1 e 5' });
    }
    execute(db,
      'UPDATE avaliacoes SET nota=?, comentario=? WHERE id=?',
      [nota ?? existente.nota, comentario ?? existente.comentario, req.params.id]
    );
    const atualizada = queryOne(db, 'SELECT * FROM avaliacoes WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: atualizada });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao atualizar avaliação', error: String(error) });
  }
});

// DELETE /api/avaliacoes/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const existente = queryOne(db, 'SELECT id FROM avaliacoes WHERE id = ?', [req.params.id]);
    if (!existente) {
      return res.status(404).json({ success: false, message: 'Avaliação não encontrada' });
    }
    execute(db, 'DELETE FROM avaliacoes WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Avaliação removida com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao remover avaliação', error: String(error) });
  }
});

export default router;
