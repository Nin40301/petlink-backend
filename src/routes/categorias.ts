/**
 * routes/categorias.ts
 * Rotas REST para a entidade Categoria.
 *
 * GET    /api/categorias        - Lista todas as categorias
 * GET    /api/categorias/:id    - Busca categoria por ID
 * POST   /api/categorias        - Cria nova categoria
 * PUT    /api/categorias/:id    - Atualiza categoria existente
 * DELETE /api/categorias/:id    - Remove categoria
 */

import { Router, Request, Response } from 'express';
import getDb from '../database';
import { queryAll, queryOne, execute } from '../db-utils';

const router = Router();

// GET /api/categorias
router.get('/', async (_req: Request, res: Response) => {
  try {
    const db = await getDb();
    const categorias = queryAll(db, 'SELECT * FROM categorias ORDER BY nome');
    res.json({ success: true, data: categorias });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar categorias', error: String(error) });
  }
});

// GET /api/categorias/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const categoria = queryOne(db, 'SELECT * FROM categorias WHERE id = ?', [req.params.id]);
    if (!categoria) {
      return res.status(404).json({ success: false, message: 'Categoria não encontrada' });
    }
    res.json({ success: true, data: categoria });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar categoria', error: String(error) });
  }
});

// POST /api/categorias
router.post('/', async (req: Request, res: Response) => {
  try {
    const { nome, descricao, icone } = req.body;
    if (!nome) {
      return res.status(400).json({ success: false, message: 'Campo obrigatório: nome' });
    }
    const db = await getDb();
    const existente = queryOne(db, 'SELECT id FROM categorias WHERE nome = ?', [nome]);
    if (existente) {
      return res.status(409).json({ success: false, message: 'Categoria já existe' });
    }
    const newId = execute(db,
      'INSERT INTO categorias (nome, descricao, icone) VALUES (?,?,?)',
      [nome, descricao || null, icone || null]
    );
    const nova = queryOne(db, 'SELECT * FROM categorias WHERE id = ?', [newId]);
    res.status(201).json({ success: true, data: nova });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao criar categoria', error: String(error) });
  }
});

// PUT /api/categorias/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const existente = queryOne(db, 'SELECT * FROM categorias WHERE id = ?', [req.params.id]);
    if (!existente) {
      return res.status(404).json({ success: false, message: 'Categoria não encontrada' });
    }
    const { nome, descricao, icone } = req.body;
    execute(db,
      'UPDATE categorias SET nome=?, descricao=?, icone=? WHERE id=?',
      [nome ?? existente.nome, descricao ?? existente.descricao, icone ?? existente.icone, req.params.id]
    );
    const atualizada = queryOne(db, 'SELECT * FROM categorias WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: atualizada });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao atualizar categoria', error: String(error) });
  }
});

// DELETE /api/categorias/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const existente = queryOne(db, 'SELECT id FROM categorias WHERE id = ?', [req.params.id]);
    if (!existente) {
      return res.status(404).json({ success: false, message: 'Categoria não encontrada' });
    }
    execute(db, 'DELETE FROM categorias WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Categoria removida com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao remover categoria', error: String(error) });
  }
});

export default router;
