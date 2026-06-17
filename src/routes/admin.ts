/**
 * routes/admin.ts
 * Rotas exclusivas para administradores.
 *
 * GET /api/admin/dashboard                   - Estatísticas gerais da plataforma
 * GET /api/admin/usuarios                    - Listar todos os usuários
 * PUT /api/admin/usuarios/:id/bloquear       - Bloquear usuário
 * PUT /api/admin/usuarios/:id/desbloquear    - Desbloquear usuário
 * GET /api/admin/resgates                    - Listar todos os resgates
 * PUT /api/admin/resgates/:id/aprovar        - Aprovar resgate (debita carteira do prestador)
 * PUT /api/admin/resgates/:id/rejeitar       - Rejeitar resgate
 * GET /api/admin/servicos                    - Listar todos os serviços
 * PUT /api/admin/servicos/:id/status         - Ativar/inativar serviço
 * GET /api/admin/pedidos                     - Listar todos os pedidos
 */

import { Router, Request, Response } from 'express';
import getDb from '../database';
import { queryOne, queryAll, execute } from '../db-utils';
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

    // Total de prestadores ativos
    const totalPrestadores = queryOne(db,
      `SELECT COUNT(*) AS total FROM usuarios WHERE tipo = 'prestador' AND ativo = 1`
    )?.total ?? 0;

    // Total de clientes ativos
    const totalClientes = queryOne(db,
      `SELECT COUNT(*) AS total FROM usuarios WHERE tipo = 'cliente' AND ativo = 1`
    )?.total ?? 0;

    // Total de pedidos
    const totalPedidos = queryOne(db,
      `SELECT COUNT(*) AS total FROM pedidos`
    )?.total ?? 0;

    res.json({
      success: true,
      data: {
        faturamentoHoje,
        lucroMes,
        receita: lucroMes,
        totalServicos,
        usuariosAtivos,
        totalUsuarios: usuariosAtivos,
        totalPrestadores,
        totalClientes,
        totalPedidos,
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
    execute(db, 'UPDATE usuarios SET ativo = 0 WHERE id = ?', [req.params.id]);
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
    execute(db, 'UPDATE usuarios SET ativo = 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Usuário desbloqueado' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao desbloquear usuário', error: String(error) });
  }
});

// GET /api/admin/resgates — lista todos os resgates
router.get('/resgates', async (_req: Request, res: Response) => {
  try {
    const db = await getDb();
    const resgates = queryAll(db, `
      SELECT r.*, u.nome AS prestadorNome, u.email AS prestadorEmail
      FROM resgates r
      JOIN usuarios u ON r.prestadorId = u.id
      ORDER BY r.dataRequisicao DESC
    `);
    res.json({ success: true, data: resgates });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao listar resgates', error: String(error) });
  }
});

// PUT /api/admin/resgates/:id/aprovar — aprova resgate e debita carteira do prestador
router.put('/resgates/:id/aprovar', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const resgate = queryOne(db, 'SELECT * FROM resgates WHERE id = ?', [req.params.id]);
    if (!resgate) {
      return res.status(404).json({ success: false, message: 'Resgate não encontrado' });
    }
    if (resgate.status !== 'pendente') {
      return res.status(400).json({ success: false, message: `Resgate não pode ser aprovado (status: ${resgate.status})` });
    }
    // Debita saldo da carteira do prestador
    const carteira = queryOne(db, 'SELECT * FROM carteira WHERE usuarioId = ?', [resgate.prestadorId]);
    if (!carteira || carteira.saldo < resgate.valor) {
      return res.status(400).json({ success: false, message: 'Saldo insuficiente na carteira do prestador' });
    }
    execute(db,
      "UPDATE carteira SET saldo = saldo - ?, updatedAt = datetime('now') WHERE usuarioId = ?",
      [resgate.valor, resgate.prestadorId]
    );
    // Registra transação de saída
    execute(db,
      'INSERT INTO transacoes (usuarioId, tipo, valor, descricao) VALUES (?,?,?,?)',
      [resgate.prestadorId, 'saida', resgate.valor, `Saque aprovado - chave: ${resgate.chavePixOuConta}`]
    );
    // Atualiza status do resgate
    execute(db,
      "UPDATE resgates SET status = 'enviado', dataAprovacao = datetime('now') WHERE id = ?",
      [req.params.id]
    );
    const atualizado = queryOne(db, 'SELECT * FROM resgates WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: atualizado, message: 'Resgate aprovado e saldo debitado!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao aprovar resgate', error: String(error) });
  }
});

// PUT /api/admin/resgates/:id/rejeitar — rejeita resgate
router.put('/resgates/:id/rejeitar', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const resgate = queryOne(db, 'SELECT * FROM resgates WHERE id = ?', [req.params.id]);
    if (!resgate) {
      return res.status(404).json({ success: false, message: 'Resgate não encontrado' });
    }
    if (resgate.status !== 'pendente') {
      return res.status(400).json({ success: false, message: `Resgate não pode ser rejeitado (status: ${resgate.status})` });
    }
    execute(db,
      "UPDATE resgates SET status = 'rejeitado', dataAprovacao = datetime('now') WHERE id = ?",
      [req.params.id]
    );
    const atualizado = queryOne(db, 'SELECT * FROM resgates WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: atualizado, message: 'Resgate rejeitado. O saldo permanece na carteira do prestador.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao rejeitar resgate', error: String(error) });
  }
});

// GET /api/admin/servicos — lista todos os serviços
router.get('/servicos', async (_req: Request, res: Response) => {
  try {
    const db = await getDb();
    const servicos = queryAll(db, `
      SELECT s.*, u.nome AS prestadorNome, u.email AS prestadorEmail
      FROM servicos s
      JOIN usuarios u ON s.prestadorId = u.id
      ORDER BY s.createdAt DESC
    `);
    res.json({ success: true, data: servicos });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao listar serviços', error: String(error) });
  }
});

// PUT /api/admin/servicos/:id/status — ativar/inativar serviço
router.put('/servicos/:id/status', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { status } = req.body;
    if (!['ativo', 'inativo'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status inválido. Use: ativo, inativo' });
    }
    const servico = queryOne(db, 'SELECT id FROM servicos WHERE id = ?', [req.params.id]);
    if (!servico) {
      return res.status(404).json({ success: false, message: 'Serviço não encontrado' });
    }
    execute(db, 'UPDATE servicos SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true, message: `Serviço ${status === 'ativo' ? 'ativado' : 'desativado'} com sucesso!` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao atualizar status do serviço', error: String(error) });
  }
});

// GET /api/admin/pedidos — lista todos os pedidos
router.get('/pedidos', async (_req: Request, res: Response) => {
  try {
    const db = await getDb();
    const pedidos = queryAll(db, `
      SELECT p.*,
             c.nome  AS clienteNome,
             s.titulo AS servicoTitulo,
             pr.nome AS prestadorNome
      FROM pedidos p
      JOIN usuarios c ON p.clienteId = c.id
      JOIN servicos s ON p.servicoId = s.id
      JOIN usuarios pr ON s.prestadorId = pr.id
      ORDER BY p.dataSolicitacao DESC
    `);
    res.json({ success: true, data: pedidos });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao listar pedidos', error: String(error) });
  }
});

export default router;
