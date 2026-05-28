/**
 * routes/prestador.ts
 * Rotas específicas para prestadores de serviço.
 *
 * GET /api/prestador/:id/ganhos/mensal - Ganhos do mês, qtd de serviços, média de avaliações
 */

import { Router, Request, Response } from 'express';
import getDb from '../database';
import { queryOne, queryAll } from '../db-utils';
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

    res.json({
      success: true,
      data: {
        totalGanhoMes:     ganhosMes?.totalGanho ?? 0,
        quantidadeServicos: ganhosMes?.quantidadeServicos ?? 0,
        mediaAvaliacoes:   Number((mediaAvaliacoes?.media ?? 0).toFixed(1)),
        totalAvaliacoes:   mediaAvaliacoes?.totalAvaliacoes ?? 0,
        pedidosPendentes,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar ganhos', error: String(error) });
  }
});

export default router;
