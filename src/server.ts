/**
 * server.ts
 * Ponto de entrada do servidor Express do PetLink.
 * Registra todas as rotas e inicializa o banco de dados SQLite (via sql.js).
 */

import express from 'express';
import cors from 'cors';
import getDb from './database';

// Rotas
import usuariosRouter    from './routes/usuarios';
import categoriasRouter  from './routes/categorias';
import servicosRouter    from './routes/servicos';
import pedidosRouter     from './routes/pedidos';
import avaliacoesRouter  from './routes/avaliacoes';
import enderecosRouter   from './routes/enderecos';
import carteiraRouter    from './routes/carteira';
import pagamentosRouter  from './routes/pagamentos';
import resgatesRouter    from './routes/resgates';
import authRouter        from './routes/auth';
import adminRouter       from './routes/admin';
import prestadorRouter   from './routes/prestador';

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares globais
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Rotas da API
app.use('/api/auth',       authRouter);
app.use('/api/usuarios',   usuariosRouter);
app.use('/api/categorias', categoriasRouter);
app.use('/api/servicos',   servicosRouter);
app.use('/api/pedidos',    pedidosRouter);
app.use('/api/avaliacoes', avaliacoesRouter);
app.use('/api/enderecos',  enderecosRouter);
app.use('/api/carteira',   carteiraRouter);
app.use('/api/pagamentos', pagamentosRouter);
app.use('/api/resgates',   resgatesRouter);
app.use('/api/admin',      adminRouter);
app.use('/api/prestador',  prestadorRouter);

// Rota raiz
app.get('/', (_req, res) => {
  res.json({
    name: 'PetLink API',
    version: '2.0.0',
    description: 'Backend do marketplace de serviços para pets',
    endpoints: {
      auth:       '/api/auth/login',
      usuarios:   '/api/usuarios',
      categorias: '/api/categorias',
      servicos:   '/api/servicos',
      pedidos:    '/api/pedidos',
      avaliacoes: '/api/avaliacoes',
      enderecos:  '/api/enderecos',
      carteira:   '/api/carteira',
      pagamentos: '/api/pagamentos',
      resgates:   '/api/resgates',
      admin:      '/api/admin/dashboard',
      prestador:  '/api/prestador/:id/ganhos/mensal',
    }
  });
});

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Rota não encontrada' });
});

async function start() {
  await getDb();
  app.listen(PORT, () => {
    console.log(`\n🚀 PetLink API rodando em http://localhost:${PORT}`);
    console.log(`📋 Endpoints disponíveis em http://localhost:${PORT}\n`);
  });
}

start().catch(console.error);

export default app;
