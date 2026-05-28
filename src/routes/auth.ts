/**
 * routes/auth.ts
 * Autenticação de usuários com JWT.
 *
 * POST /api/auth/login  - Login com email, senha e tipo
 * GET  /api/auth/me     - Dados do usuário autenticado
 */

import { Router, Request, Response } from 'express';
import getDb from '../database';
import { queryOne } from '../db-utils';
import { createToken, authMiddleware } from '../middleware/auth';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, senha, tipo } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ success: false, message: 'Email e senha são obrigatórios' });
    }

    const db = await getDb();

    // Busca usuário por email (e tipo, se informado)
    let usuario: any;
    if (tipo) {
      usuario = queryOne(db,
        'SELECT * FROM usuarios WHERE email = ? AND tipo = ?',
        [email, tipo]
      );
    } else {
      usuario = queryOne(db, 'SELECT * FROM usuarios WHERE email = ?', [email]);
    }

    if (!usuario) {
      return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
    }

    // Verificação de senha (simples, sem bcrypt — para manter compatibilidade com seed)
    // Em produção, usar bcrypt.compare
    if (usuario.senha !== senha) {
      return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
    }

    // Gera token JWT
    const token = createToken({
      id:    usuario.id,
      email: usuario.email,
      nome:  usuario.nome,
      tipo:  usuario.tipo,
    });

    // Retorna usuário sem senha
    const { senha: _, ...usuarioSemSenha } = usuario;

    res.json({
      success: true,
      data: {
        token,
        usuario: usuarioSemSenha,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao fazer login', error: String(error) });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const db = await getDb();
    const usuario = queryOne(db,
      'SELECT id, nome, email, tipo, telefone, createdAt FROM usuarios WHERE id = ?',
      [user.id]
    );
    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }
    res.json({ success: true, data: usuario });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar perfil', error: String(error) });
  }
});

export default router;
