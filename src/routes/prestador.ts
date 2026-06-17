/**
 * routes/prestador.ts
 * Rotas específicas para prestadores de serviço.
 *
 * GET    /api/prestador/:id/ganhos/mensal    - Ganhos do mês, qtd de serviços, média de avaliações
 * GET    /api/prestador/:id/servicos         - Lista serviços do prestador
 * POST   /api/prestador/:id/servicos         - Cria novo serviço
 * PUT    /api/prestador/:id/servicos/:sid    - Atualiza serviço
 * DELETE /api/prestador/:id/servicos/:sid    - Remove/inativa serviço
 * GET    /api/prestador/:id/pedidos          - Lista pedidos recebidos
 * GET    /api/prestador/:id/resgates         - Lista solicitações de saque
 */

import { Router, Request, Response } from 'express';
import getDb from '../database';
import { queryOne, queryAll, execute } from '../db-utils';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

// GET /api/prestador/:id/ganhos/mensal
router.get('/:id/ganhos/mensal', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const prestadorId = req.params.id;

    // Total ganho no mês (pedidos concluídos cujo serviço pertence ao prestador)
    const ganhosMes = queryOne(db,
      `SELECT COALESCE(SUM(p.valorTotal), 0) AS totalGanho, COUNT(*) AS quantidadeServicos
       FROM pedidos p
       JOIN servicos s ON p.servicoId = s.id
       WHERE s.prestadorId = ?
         AND p.status = 'concluido'
         AND strftime('%Y-%m', p.dataSolicitacao) = strftime('%Y-%m', 'now')`,
      [prestadorId]
    );

    // Média de avaliações
    const mediaAvaliacoes = queryOne(db,
      `SELECT COALESCE(AVG(a.nota), 0) AS media, COUNT(a.id) AS totalAvaliacoes
       FROM avaliacoes a
       JOIN pedidos p ON a.pedidoId = p.id
       JOIN servicos s ON p.servicoId = s.id
       WHERE s.prestadorId = ?`,
      [prestadorId]
    );

    // Pedidos pendentes para o prestador
    const pedidosPendentes = queryAll(db,
      `SELECT p.*, c.nome AS clienteNome, s.titulo AS servicoTitulo
       FROM pedidos p
       JOIN servicos s ON p.servicoId = s.id
       JOIN usuarios c ON p.clienteId = c.id
       WHERE s.prestadorId = ? AND p.status = 'pendente'
       ORDER BY p.dataSolicitacao DESC`,
      [prestadorId]
    );

    // Saldo atual da carteira
    const carteira = queryOne(db, 'SELECT saldo FROM carteira WHERE usuarioId = ?', [prestadorId]);

    // Total de serviços ativos
    const servicosAtivos = queryOne(db,
      "SELECT COUNT(*) AS total FROM servicos WHERE prestadorId = ? AND status = 'ativo'",
      [prestadorId]
    );

    res.json({
      success: true,
      data: {
        mes: `R$ ${(ganhosMes?.totalGanho ?? 0).toFixed(2)}`,
        totalGanhoMes:      ganhosMes?.totalGanho ?? 0,
        quantidadeServicos: ganhosMes?.quantidadeServicos ?? 0,
        mediaAvaliacoes:    Number((mediaAvaliacoes?.media ?? 0).toFixed(1)),
        totalAvaliacoes:    mediaAvaliacoes?.totalAvaliacoes ?? 0,
        pedidosPendentes,
        saldoCarteira:      carteira?.saldo ?? 0,
        servicosAtivos:     servicosAtivos?.total ?? 0,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar ganhos', error: String(error) });
  }
});

// GET /api/prestador/:id/servicos — lista serviços do prestador
router.get('/:id/servicos', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const servicos = queryAll(db, `
      SELECT s.*
      FROM servicos s
      WHERE s.prestadorId = ?
      ORDER BY s.createdAt DESC
    `, [req.params.id]);
    res.json({ success: true, data: servicos });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar serviços', error: String(error) });
  }
});

// POST /api/prestador/:id/servicos — cria novo serviço
router.post('/:id/servicos', async (req: Request, res: Response) => {
  try {
    const { titulo, descricao, preco, categoria } = req.body;
    const prestadorId = req.params.id;

    if (!titulo || !descricao || !preco || !categoria) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: titulo, descricao, preco, categoria'
      });
    }
    if (Number(preco) <= 0) {
      return res.status(400).json({ success: false, message: 'Preço deve ser maior que zero' });
    }

    const db = await getDb();
    const prestador = queryOne(db, "SELECT id FROM usuarios WHERE id = ? AND tipo = 'prestador'", [prestadorId]);
    if (!prestador) {
      return res.status(404).json({ success: false, message: 'Prestador não encontrado' });
    }

    const newId = execute(db,
      "INSERT INTO servicos (titulo, descricao, preco, categoria, prestadorId, status) VALUES (?,?,?,?,?,?)",
      [titulo, descricao, Number(preco), categoria, prestadorId, 'ativo']
    );

    const novo = queryOne(db, 'SELECT * FROM servicos WHERE id = ?', [newId]);
    res.status(201).json({ success: true, data: novo, message: 'Serviço criado com sucesso!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao criar serviço', error: String(error) });
  }
});

// PUT /api/prestador/:id/servicos/:sid — atualiza serviço
router.put('/:id/servicos/:sid', async (req: Request, res: Response) => {
  try {
    const { id: prestadorId, sid: servicoId } = req.params;
    const db = await getDb();

    const servico = queryOne(db, 'SELECT * FROM servicos WHERE id = ? AND prestadorId = ?', [servicoId, prestadorId]);
    if (!servico) {
      return res.status(404).json({ success: false, message: 'Serviço não encontrado ou não pertence a este prestador' });
    }

    const { titulo, descricao, preco, categoria, status } = req.body;

    if (preco !== undefined && Number(preco) <= 0) {
      return res.status(400).json({ success: false, message: 'Preço deve ser maior que zero' });
    }
    if (status && !['ativo', 'inativo'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status inválido. Use: ativo, inativo' });
    }

    execute(db,
      'UPDATE servicos SET titulo=?, descricao=?, preco=?, categoria=?, status=? WHERE id=?',
      [
        titulo    ?? servico.titulo,
        descricao ?? servico.descricao,
        preco     !== undefined ? Number(preco) : servico.preco,
        categoria ?? servico.categoria,
        status    ?? servico.status,
        servicoId
      ]
    );

    const atualizado = queryOne(db, 'SELECT * FROM servicos WHERE id = ?', [servicoId]);
    res.json({ success: true, data: atualizado, message: 'Serviço atualizado com sucesso!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao atualizar serviço', error: String(error) });
  }
});

// DELETE /api/prestador/:id/servicos/:sid — remove ou inativa serviço
router.delete('/:id/servicos/:sid', async (req: Request, res: Response) => {
  try {
    const { id: prestadorId, sid: servicoId } = req.params;
    const db = await getDb();

    const servico = queryOne(db, 'SELECT * FROM servicos WHERE id = ? AND prestadorId = ?', [servicoId, prestadorId]);
    if (!servico) {
      return res.status(404).json({ success: false, message: 'Serviço não encontrado ou não pertence a este prestador' });
    }

    // Verifica se há pedidos ativos vinculados
    const pedidosAtivos = queryOne(db,
      "SELECT COUNT(*) AS total FROM pedidos WHERE servicoId = ? AND status IN ('pendente', 'aceito')",
      [servicoId]
    );
    if (pedidosAtivos?.total > 0) {
      execute(db, "UPDATE servicos SET status = 'inativo' WHERE id = ?", [servicoId]);
      return res.json({ success: true, message: 'Serviço desativado (há pedidos ativos vinculados).' });
    }

    execute(db, 'DELETE FROM servicos WHERE id = ?', [servicoId]);
    res.json({ success: true, message: 'Serviço removido com sucesso!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao remover serviço', error: String(error) });
  }
});

// GET /api/prestador/:id/pedidos — lista pedidos recebidos pelo prestador
router.get('/:id/pedidos', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { status } = req.query;

    let sql = `
      SELECT p.*,
             c.nome  AS clienteNome,
             c.email AS clienteEmail,
             s.titulo AS servicoTitulo,
             s.categoria AS servicoCategoria
      FROM pedidos p
      JOIN usuarios c ON p.clienteId = c.id
      JOIN servicos s ON p.servicoId = s.id
      WHERE s.prestadorId = ?
    `;
    const params: any[] = [req.params.id];

    if (status) {
      sql += ' AND p.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY p.dataSolicitacao DESC';

    const pedidos = queryAll(db, sql, params);
    res.json({ success: true, data: pedidos });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar pedidos', error: String(error) });
  }
});

// GET /api/prestador/:id/resgates — lista solicitações de saque do prestador
router.get('/:id/resgates', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const resgates = queryAll(db,
      'SELECT * FROM resgates WHERE prestadorId = ? ORDER BY dataRequisicao DESC',
      [req.params.id]
    );
    res.json({ success: true, data: resgates });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar resgates', error: String(error) });
  }
});

export default router;
