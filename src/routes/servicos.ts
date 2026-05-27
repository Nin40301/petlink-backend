/**
 * routes/servicos.ts
 * Rotas REST para a entidade Serviço.
 *
 * GET    /api/servicos        - Lista todos os serviços
 * GET    /api/servicos/:id    - Busca serviço por ID
 * POST   /api/servicos        - Cria novo serviço
 * PUT    /api/servicos/:id    - Atualiza serviço existente
 * DELETE /api/servicos/:id    - Remove serviço
 */

import { Router, Request, Response } from 'express';
import getDb from '../database';
import { queryAll, queryOne, execute } from '../db-utils';

const router = Router();

// GET /api/servicos
router.get('/', async (_req: Request, res: Response) => {
  try {
    const db = await getDb();
    const servicos = queryAll(db, `
      SELECT s.*, u.nome AS prestadorNome, u.telefone AS prestadorTelefone
      FROM servicos s
      JOIN usuarios u ON s.prestadorId = u.id
      ORDER BY s.id
    `);
    res.json({ success: true, data: servicos });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar serviços', error: String(error) });
  }
});

// GET /api/servicos/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const servico = queryOne(db, `
      SELECT s.*, u.nome AS prestadorNome, u.telefone AS prestadorTelefone
      FROM servicos s
      JOIN usuarios u ON s.prestadorId = u.id
      WHERE s.id = ?
    `, [req.params.id]);
    if (!servico) {
      return res.status(404).json({ success: false, message: 'Serviço não encontrado' });
    }
    res.json({ success: true, data: servico });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar serviço', error: String(error) });
  }
});

// POST /api/servicos
router.post('/', async (req: Request, res: Response) => {
  try {
    const { titulo, descricao, preco, categoria, prestadorId, status } = req.body;
    if (!titulo || !descricao || !preco || !categoria || !prestadorId) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: titulo, descricao, preco, categoria, prestadorId'
      });
    }
    const db = await getDb();
    const prestador = queryOne(db, "SELECT id FROM usuarios WHERE id = ? AND tipo = 'prestador'", [prestadorId]);
    if (!prestador) {
      return res.status(400).json({ success: false, message: 'Prestador não encontrado ou não é do tipo prestador' });
    }
    const newId = execute(db,
      'INSERT INTO servicos (titulo, descricao, preco, categoria, prestadorId, status) VALUES (?,?,?,?,?,?)',
      [titulo, descricao, preco, categoria, prestadorId, status || 'ativo']
    );
    const novo = queryOne(db, 'SELECT * FROM servicos WHERE id = ?', [newId]);
    res.status(201).json({ success: true, data: novo });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao criar serviço', error: String(error) });
  }
});

// PUT /api/servicos/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const existente = queryOne(db, 'SELECT * FROM servicos WHERE id = ?', [req.params.id]);
    if (!existente) {
      return res.status(404).json({ success: false, message: 'Serviço não encontrado' });
    }
    const { titulo, descricao, preco, categoria, status } = req.body;
    execute(db,
      'UPDATE servicos SET titulo=?, descricao=?, preco=?, categoria=?, status=? WHERE id=?',
      [
        titulo    ?? existente.titulo,
        descricao ?? existente.descricao,
        preco     ?? existente.preco,
        categoria ?? existente.categoria,
        status    ?? existente.status,
        req.params.id
      ]
    );
    const atualizado = queryOne(db, 'SELECT * FROM servicos WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: atualizado });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao atualizar serviço', error: String(error) });
  }
});

// DELETE /api/servicos/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const existente = queryOne(db, 'SELECT id FROM servicos WHERE id = ?', [req.params.id]);
    if (!existente) {
      return res.status(404).json({ success: false, message: 'Serviço não encontrado' });
    }
    execute(db, 'DELETE FROM servicos WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Serviço removido com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao remover serviço', error: String(error) });
  }
});

export default router;
