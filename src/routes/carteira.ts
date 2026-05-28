/**
 * routes/carteira.ts
 * Rotas para gerenciar carteira digital e saldo dos usuários.
 *
 * GET  /api/carteira/:usuarioId           - Consultar saldo
 * POST /api/carteira/adicionar            - Adicionar saldo (cliente)
 * POST /api/carteira/resgatar             - Solicitar resgate (prestador)
 * GET  /api/carteira/:usuarioId/historico - Histórico de transações
 * POST /api/carteira/recarga              - Alias de /adicionar (compatibilidade)
 */

import { Router, Request, Response } from 'express';
import getDb from '../database';
import { queryOne, queryAll, execute } from '../db-utils';

const router = Router();

// GET /api/carteira/:usuarioId
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

// POST /api/carteira/adicionar — cliente adiciona saldo via PIX ou cartão
router.post('/adicionar', async (req: Request, res: Response) => {
  try {
    const { usuarioId, valor, metodo } = req.body;
    if (!usuarioId || !valor || valor <= 0) {
      return res.status(400).json({ success: false, message: 'Campos obrigatórios: usuarioId, valor (> 0)' });
    }

    const db = await getDb();
    const carteira = queryOne(db, 'SELECT * FROM carteira WHERE usuarioId = ?', [usuarioId]);
    if (!carteira) {
      return res.status(404).json({ success: false, message: 'Carteira não encontrada' });
    }

    const novoSaldo = carteira.saldo + valor;
    execute(db, "UPDATE carteira SET saldo = ?, updatedAt = datetime('now') WHERE usuarioId = ?", [novoSaldo, usuarioId]);

    // Registra transação de entrada
    execute(db,
      'INSERT INTO transacoes (usuarioId, tipo, valor, descricao) VALUES (?,?,?,?)',
      [usuarioId, 'entrada', valor, `Recarga via ${metodo || 'PIX'}`]
    );

    // Cria pagamento simulado
    execute(db,
      'INSERT INTO pagamentos (pedidoId, valor, metodo, status) VALUES (?,?,?,?)',
      [0, valor, metodo === 'cartao' ? 'cartao' : 'pix', 'confirmado']
    );

    res.json({ success: true, data: { saldoAnterior: carteira.saldo, novoSaldo, valor, metodo: metodo || 'pix' } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao adicionar saldo', error: String(error) });
  }
});

// POST /api/carteira/resgatar — prestador solicita resgate de saldo
router.post('/resgatar', async (req: Request, res: Response) => {
  try {
    const { usuarioId, valor, chavePixOuConta } = req.body;
    if (!usuarioId || !valor || valor <= 0) {
      return res.status(400).json({ success: false, message: 'Campos obrigatórios: usuarioId, valor (> 0)' });
    }

    const db = await getDb();
    const carteira = queryOne(db, 'SELECT * FROM carteira WHERE usuarioId = ?', [usuarioId]);
    if (!carteira) {
      return res.status(404).json({ success: false, message: 'Carteira não encontrada' });
    }
    if (carteira.saldo < valor) {
      return res.status(400).json({ success: false, message: 'Saldo insuficiente' });
    }

    // Cria solicitação de resgate (status pendente — admin precisa aprovar)
    const resgateId = execute(db,
      'INSERT INTO resgates (prestadorId, valor, status, chavePixOuConta) VALUES (?,?,?,?)',
      [usuarioId, valor, 'pendente', chavePixOuConta || null]
    );

    res.json({
      success: true,
      data: { id: resgateId, usuarioId, valor, status: 'pendente', chavePixOuConta },
      message: 'Solicitação de resgate criada. Aguarde aprovação do administrador.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao solicitar resgate', error: String(error) });
  }
});

// POST /api/carteira/recarga — alias para compatibilidade
router.post('/recarga', async (req: Request, res: Response) => {
  const { usuarioId, valor, metodo } = req.body;
  req.body = { usuarioId, valor, metodo };
  // Redireciona internamente para a lógica de /adicionar
  try {
    if (!usuarioId || !valor || valor <= 0) {
      return res.status(400).json({ success: false, message: 'Dados inválidos' });
    }
    const db = await getDb();
    const carteira = queryOne(db, 'SELECT * FROM carteira WHERE usuarioId = ?', [usuarioId]);
    if (!carteira) {
      return res.status(404).json({ success: false, message: 'Carteira não encontrada' });
    }
    const novoSaldo = carteira.saldo + valor;
    execute(db, "UPDATE carteira SET saldo = ?, updatedAt = datetime('now') WHERE usuarioId = ?", [novoSaldo, usuarioId]);
    execute(db,
      'INSERT INTO transacoes (usuarioId, tipo, valor, descricao) VALUES (?,?,?,?)',
      [usuarioId, 'entrada', valor, `Recarga via ${metodo || 'PIX'}`]
    );
    res.json({ success: true, data: { saldoAnterior: carteira.saldo, novoSaldo } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao recarregar', error: String(error) });
  }
});

export default router;
