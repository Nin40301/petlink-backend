/**
 * routes/usuarios.ts
 * Rotas REST para a entidade Usuário.
 *
 * GET    /api/usuarios        - Lista todos os usuários
 * GET    /api/usuarios/:id    - Busca usuário por ID
 * POST   /api/usuarios        - Cria novo usuário
 * PUT    /api/usuarios/:id    - Atualiza usuário existente
 * DELETE /api/usuarios/:id    - Remove usuário
 */

import { Router, Request, Response } from 'express';
import getDb from '../database';
import { queryAll, queryOne, execute } from '../db-utils';

const router = Router();

// GET /api/usuarios - Lista todos os usuários (sem expor senha)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const db = await getDb();
    const usuarios = queryAll(db,
      'SELECT id, nome, email, tipo, telefone, createdAt FROM usuarios ORDER BY id'
    );
    res.json({ success: true, data: usuarios });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar usuários', error: String(error) });
  }
});

// GET /api/usuarios/:id - Busca usuário por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const usuario = queryOne(db,
      'SELECT id, nome, email, tipo, telefone, createdAt FROM usuarios WHERE id = ?',
      [req.params.id]
    );
    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }
    res.json({ success: true, data: usuario });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar usuário', error: String(error) });
  }
});

// POST /api/usuarios - Cria novo usuário
router.post('/', async (req: Request, res: Response) => {
  try {
    const { nome, email, senha, tipo, telefone } = req.body;

    if (!nome || !email || !senha || !tipo) {
      return res.status(400).json({ success: false, message: 'Campos obrigatórios: nome, email, senha, tipo' });
    }
    if (!['cliente', 'prestador'].includes(tipo)) {
      return res.status(400).json({ success: false, message: 'Tipo deve ser "cliente" ou "prestador"' });
    }

    const db = await getDb();

    // Verifica e-mail duplicado
    const existente = queryOne(db, 'SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existente) {
      return res.status(409).json({ success: false, message: 'E-mail já cadastrado' });
    }

    const newId = execute(db,
      'INSERT INTO usuarios (nome, email, senha, tipo, telefone) VALUES (?,?,?,?,?)',
      [nome, email, senha, tipo, telefone || null]
    );

    const novo = queryOne(db,
      'SELECT id, nome, email, tipo, telefone, createdAt FROM usuarios WHERE id = ?',
      [newId]
    );
    res.status(201).json({ success: true, data: novo });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao criar usuário', error: String(error) });
  }
});

// PUT /api/usuarios/:id - Atualiza usuário
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const existente = queryOne(db, 'SELECT id, nome, email, tipo, telefone FROM usuarios WHERE id = ?', [req.params.id]);
    if (!existente) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }

    const { nome, email, telefone, tipo } = req.body;
    execute(db,
      'UPDATE usuarios SET nome=?, email=?, telefone=?, tipo=? WHERE id=?',
      [
        nome      ?? existente.nome,
        email     ?? existente.email,
        telefone  ?? existente.telefone,
        tipo      ?? existente.tipo,
        req.params.id
      ]
    );

    const atualizado = queryOne(db,
      'SELECT id, nome, email, tipo, telefone, createdAt FROM usuarios WHERE id = ?',
      [req.params.id]
    );
    res.json({ success: true, data: atualizado });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao atualizar usuário', error: String(error) });
  }
});

// DELETE /api/usuarios/:id - Remove usuário
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const existente = queryOne(db, 'SELECT id FROM usuarios WHERE id = ?', [req.params.id]);
    if (!existente) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }
    execute(db, 'DELETE FROM usuarios WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Usuário removido com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao remover usuário', error: String(error) });
  }
});

export default router;
