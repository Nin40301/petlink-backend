/**
 * routes/enderecos.ts
 * Rotas REST para a entidade Endereço.
 *
 * GET    /api/enderecos        - Lista todos os endereços
 * GET    /api/enderecos/:id    - Busca endereço por ID
 * POST   /api/enderecos        - Cria novo endereço
 * PUT    /api/enderecos/:id    - Atualiza endereço existente
 * DELETE /api/enderecos/:id    - Remove endereço
 */

import { Router, Request, Response } from 'express';
import getDb from '../database';
import { queryAll, queryOne, execute } from '../db-utils';

const router = Router();

// GET /api/enderecos
router.get('/', async (_req: Request, res: Response) => {
  try {
    const db = await getDb();
    const enderecos = queryAll(db, `
      SELECT e.*, u.nome AS usuarioNome, u.email AS usuarioEmail
      FROM enderecos e
      JOIN usuarios u ON e.usuarioId = u.id
      ORDER BY e.id
    `);
    res.json({ success: true, data: enderecos });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar endereços', error: String(error) });
  }
});

// GET /api/enderecos/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const endereco = queryOne(db, `
      SELECT e.*, u.nome AS usuarioNome
      FROM enderecos e
      JOIN usuarios u ON e.usuarioId = u.id
      WHERE e.id = ?
    `, [req.params.id]);
    if (!endereco) {
      return res.status(404).json({ success: false, message: 'Endereço não encontrado' });
    }
    res.json({ success: true, data: endereco });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar endereço', error: String(error) });
  }
});

// POST /api/enderecos
router.post('/', async (req: Request, res: Response) => {
  try {
    const { usuarioId, cep, logradouro, numero, bairro, cidade } = req.body;
    if (!usuarioId || !cep || !logradouro || !numero || !bairro || !cidade) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: usuarioId, cep, logradouro, numero, bairro, cidade'
      });
    }
    const db = await getDb();
    const usuario = queryOne(db, 'SELECT id FROM usuarios WHERE id = ?', [usuarioId]);
    if (!usuario) {
      return res.status(400).json({ success: false, message: 'Usuário não encontrado' });
    }
    const newId = execute(db,
      'INSERT INTO enderecos (usuarioId, cep, logradouro, numero, bairro, cidade) VALUES (?,?,?,?,?,?)',
      [usuarioId, cep, logradouro, numero, bairro, cidade]
    );
    const novo = queryOne(db, 'SELECT * FROM enderecos WHERE id = ?', [newId]);
    res.status(201).json({ success: true, data: novo });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao criar endereço', error: String(error) });
  }
});

// PUT /api/enderecos/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const existente = queryOne(db, 'SELECT * FROM enderecos WHERE id = ?', [req.params.id]);
    if (!existente) {
      return res.status(404).json({ success: false, message: 'Endereço não encontrado' });
    }
    const { cep, logradouro, numero, bairro, cidade } = req.body;
    execute(db,
      'UPDATE enderecos SET cep=?, logradouro=?, numero=?, bairro=?, cidade=? WHERE id=?',
      [
        cep        ?? existente.cep,
        logradouro ?? existente.logradouro,
        numero     ?? existente.numero,
        bairro     ?? existente.bairro,
        cidade     ?? existente.cidade,
        req.params.id
      ]
    );
    const atualizado = queryOne(db, 'SELECT * FROM enderecos WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: atualizado });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao atualizar endereço', error: String(error) });
  }
});

// DELETE /api/enderecos/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const existente = queryOne(db, 'SELECT id FROM enderecos WHERE id = ?', [req.params.id]);
    if (!existente) {
      return res.status(404).json({ success: false, message: 'Endereço não encontrado' });
    }
    execute(db, 'DELETE FROM enderecos WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Endereço removido com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao remover endereço', error: String(error) });
  }
});

export default router;
