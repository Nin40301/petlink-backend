/**
 * routes/pedidos.ts
 * Rotas REST para a entidade Pedido/Contrato.
 *
 * GET    /api/pedidos                - Lista pedidos (filtros: clienteId, prestadorId)
 * GET    /api/pedidos/:id            - Busca pedido por ID
 * POST   /api/pedidos                - Cria novo pedido
 * PUT    /api/pedidos/:id            - Atualiza status do pedido
 * PUT    /api/pedidos/:id/aceitar    - Prestador aceita pedido
 * PUT    /api/pedidos/:id/concluir   - Cliente confirma conclusão (libera pagamento)
 * DELETE /api/pedidos/:id            - Remove pedido
 */

import { Router, Request, Response } from 'express';
import getDb from '../database';
import { queryAll, queryOne, execute } from '../db-utils';

const router = Router();
const STATUS_VALIDOS = ['pendente', 'aceito', 'concluido', 'cancelado'];

// GET /api/pedidos  (aceita ?clienteId=X ou ?prestadorId=X)
router.get('/', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { clienteId, prestadorId } = req.query;

    let sql = `
      SELECT p.*,
             c.nome  AS clienteNome,
             c.email AS clienteEmail,
             s.titulo AS servicoTitulo,
             s.categoria AS servicoCategoria,
             s.prestadorId
      FROM pedidos p
      JOIN usuarios c ON p.clienteId = c.id
      JOIN servicos s ON p.servicoId = s.id
    `;
    const params: any[] = [];

    if (clienteId) {
      sql += ' WHERE p.clienteId = ?';
      params.push(clienteId);
    } else if (prestadorId) {
      sql += ' WHERE s.prestadorId = ?';
      params.push(prestadorId);
    }

    sql += ' ORDER BY p.dataSolicitacao DESC';

    const pedidos = queryAll(db, sql, params);
    res.json({ success: true, data: pedidos });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar pedidos', error: String(error) });
  }
});

// GET /api/pedidos/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const pedido = queryOne(db, `
      SELECT p.*,
             c.nome  AS clienteNome,
             c.email AS clienteEmail,
             s.titulo AS servicoTitulo,
             s.categoria AS servicoCategoria,
             s.prestadorId
      FROM pedidos p
      JOIN usuarios c ON p.clienteId = c.id
      JOIN servicos s ON p.servicoId = s.id
      WHERE p.id = ?
    `, [req.params.id]);
    if (!pedido) {
      return res.status(404).json({ success: false, message: 'Pedido não encontrado' });
    }
    res.json({ success: true, data: pedido });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar pedido', error: String(error) });
  }
});

// POST /api/pedidos
router.post('/', async (req: Request, res: Response) => {
  try {
    const { clienteId, servicoId, valorTotal } = req.body;
    if (!clienteId || !servicoId || !valorTotal) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: clienteId, servicoId, valorTotal'
      });
    }
    const db = await getDb();
    const cliente = queryOne(db, "SELECT id FROM usuarios WHERE id = ? AND tipo = 'cliente'", [clienteId]);
    if (!cliente) {
      return res.status(400).json({ success: false, message: 'Cliente não encontrado' });
    }
    const servico = queryOne(db, "SELECT id FROM servicos WHERE id = ? AND status = 'ativo'", [servicoId]);
    if (!servico) {
      return res.status(400).json({ success: false, message: 'Serviço não encontrado ou inativo' });
    }
    const newId = execute(db,
      'INSERT INTO pedidos (clienteId, servicoId, valorTotal) VALUES (?,?,?)',
      [clienteId, servicoId, valorTotal]
    );
    const novo = queryOne(db, 'SELECT * FROM pedidos WHERE id = ?', [newId]);
    res.status(201).json({ success: true, data: novo });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao criar pedido', error: String(error) });
  }
});

// PUT /api/pedidos/:id/aceitar — prestador aceita o pedido
router.put('/:id/aceitar', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const pedido = queryOne(db, 'SELECT * FROM pedidos WHERE id = ?', [req.params.id]);
    if (!pedido) {
      return res.status(404).json({ success: false, message: 'Pedido não encontrado' });
    }
    if (pedido.status !== 'pendente') {
      return res.status(400).json({ success: false, message: `Pedido não pode ser aceito (status atual: ${pedido.status})` });
    }
    execute(db, "UPDATE pedidos SET status = 'aceito' WHERE id = ?", [req.params.id]);
    const atualizado = queryOne(db, 'SELECT * FROM pedidos WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: atualizado });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao aceitar pedido', error: String(error) });
  }
});

// PUT /api/pedidos/:id/concluir — cliente confirma conclusão e libera pagamento ao prestador
router.put('/:id/concluir', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const pedido = queryOne(db, `
      SELECT p.*, s.prestadorId
      FROM pedidos p
      JOIN servicos s ON p.servicoId = s.id
      WHERE p.id = ?
    `, [req.params.id]);

    if (!pedido) {
      return res.status(404).json({ success: false, message: 'Pedido não encontrado' });
    }
    if (pedido.status !== 'aceito') {
      return res.status(400).json({ success: false, message: `Pedido não pode ser concluído (status atual: ${pedido.status})` });
    }

    // Atualiza status do pedido
    execute(db, "UPDATE pedidos SET status = 'concluido' WHERE id = ?", [req.params.id]);

    // Libera pagamento: credita saldo na carteira do prestador
    const carteiraPrestador = queryOne(db, 'SELECT * FROM carteira WHERE usuarioId = ?', [pedido.prestadorId]);
    if (carteiraPrestador) {
      execute(db,
        'UPDATE carteira SET saldo = ?, updatedAt = datetime(\'now\') WHERE usuarioId = ?',
        [carteiraPrestador.saldo + pedido.valorTotal, pedido.prestadorId]
      );
    } else {
      // Cria carteira se não existir
      execute(db,
        'INSERT INTO carteira (usuarioId, saldo) VALUES (?, ?)',
        [pedido.prestadorId, pedido.valorTotal]
      );
    }

    // Registra transação de entrada para o prestador
    execute(db,
      'INSERT INTO transacoes (usuarioId, tipo, valor, descricao, pedidoId) VALUES (?,?,?,?,?)',
      [pedido.prestadorId, 'entrada', pedido.valorTotal, 'Pagamento liberado - serviço concluído', pedido.id]
    );

    const atualizado = queryOne(db, 'SELECT * FROM pedidos WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: atualizado, message: 'Pedido concluído e pagamento liberado ao prestador' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao concluir pedido', error: String(error) });
  }
});

// PUT /api/pedidos/:id — atualização genérica de status/valor
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const existente = queryOne(db, 'SELECT * FROM pedidos WHERE id = ?', [req.params.id]);
    if (!existente) {
      return res.status(404).json({ success: false, message: 'Pedido não encontrado' });
    }
    const { status, valorTotal } = req.body;
    if (status && !STATUS_VALIDOS.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status inválido. Use: ${STATUS_VALIDOS.join(', ')}`
      });
    }
    execute(db,
      'UPDATE pedidos SET status=?, valorTotal=? WHERE id=?',
      [status ?? existente.status, valorTotal ?? existente.valorTotal, req.params.id]
    );
    const atualizado = queryOne(db, 'SELECT * FROM pedidos WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: atualizado });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao atualizar pedido', error: String(error) });
  }
});

// DELETE /api/pedidos/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const existente = queryOne(db, 'SELECT id FROM pedidos WHERE id = ?', [req.params.id]);
    if (!existente) {
      return res.status(404).json({ success: false, message: 'Pedido não encontrado' });
    }
    execute(db, 'DELETE FROM pedidos WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Pedido removido com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao remover pedido', error: String(error) });
  }
});

export default router;
