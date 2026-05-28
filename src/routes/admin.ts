/**
 * routes/admin.ts
 * Rotas exclusivas para administradores.
 *
 * GET /api/admin/dashboard - Estatísticas gerais da plataforma
 * GET /api/admin/usuarios  - Listar todos os usuários
 * PUT /api/admin/usuarios/:id/bloquear   - Bloquear usuário
 * PUT /api/admin/usuarios/:id/desbloquear - Desbloquear usuário
 */

import { Router, Request, Response } from 'express';
import getDb from '../database';
import { queryOne, queryAll } from '../db-utils';
import { authMiddleware, adminOnly } from '../middleware/auth';

const router = Router();

// Aplica autenticação e restrição admin em todas as rotas
router.use(authMiddleware, adminOnly);

// GET /api/admin/dashboard
router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const db = await getDb();
    const hoje = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // Faturamento hoje (pagamentos confirmados hoje)
    const faturamentoHoje = queryOne(db,
      `SELECT COALESCE(SUM(valor), 0) AS total
       FROM pagamentos
       WHERE status = 'confirmado'
         AND date(dataPagamento) = date('now')`
    )?.total ?? 0;

    // Lucro do mês (pagamentos confirmados no mês atual)
    const lucroMes = queryOne(db,
      `SELECT COALESCE(SUM(valor), 0) AS total
       FROM pagamentos
       WHERE status = 'confirmado'
         AND strftime('%Y-%m', dataPagamento) = strftime('%Y-%m', 'now')`
    )?.total ?? 0;

    // Total de serviços (pedidos não cancelados)
    const totalServicos = queryOne(db,
      `SELECT COUNT(*) AS total FROM pedidos WHERE status != 'cancelado'`
    )?.total ?? 0;

    // Usuários ativos (clientes e prestadores)
    const usuariosAtivos = queryOne(db,
      `SELECT COUNT(*) AS total FROM usuarios WHERE tipo IN ('cliente', 'prestador')`
    )?.total ?? 0;

    // Pedidos por status
    const pedidosPorStatus = queryAll(db,
      `SELECT status, COUNT(*) AS quantidade FROM pedidos GROUP BY status`
    );

    // Últimos 5 pagamentos
    const ultimosPagamentos = queryAll(db,
      `SELECT pg.*, p.clienteId, u.nome AS clienteNome
       FROM pagamentos pg
       JOIN pedidos p ON pg.pedidoId = p.id
       JOIN usuarios u ON p.clienteId = u.id
       ORDER BY pg.dataPagamento DESC LIMIT 5`
    );

    // Resgates pendentes
    const resgatesPendentes = queryOne(db,
      `SELECT COUNT(*) AS total FROM resgates WHERE status = 'pendente'`
    )?.total ?? 0;

    res.json({
      success: true,
      data: {
        faturamentoHoje,
        lucroMes,
        totalServicos,
        usuariosAtivos,
        resgatesPendentes,
        pedidosPorStatus,
        ultimosPagamentos,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao carregar dashboard', error: String(error) });
  }
});

// GET /api/admin/usuarios
router.get('/usuarios', async (_req: Request, res: Response) => {
  try {
    const db = await getDb();
    const usuarios = queryAll(db,
      `SELECT id, nome, email, tipo, telefone, ativo, createdAt
       FROM usuarios ORDER BY createdAt DESC`
    );
    res.json({ success: true, data: usuarios });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao listar usuários', error: String(error) });
  }
});

// PUT /api/admin/usuarios/:id/bloquear
router.put('/usuarios/:id/bloquear', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const usuario = queryOne(db, 'SELECT id FROM usuarios WHERE id = ?', [req.params.id]);
    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }
    db.run('UPDATE usuarios SET ativo = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Usuário bloqueado' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao bloquear usuário', error: String(error) });
  }
});

// PUT /api/admin/usuarios/:id/desbloquear
router.put('/usuarios/:id/desbloquear', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const usuario = queryOne(db, 'SELECT id FROM usuarios WHERE id = ?', [req.params.id]);
    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }
    db.run('UPDATE usuarios SET ativo = 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Usuário desbloqueado' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao desbloquear usuário', error: String(error) });
  }
});

export default router;
