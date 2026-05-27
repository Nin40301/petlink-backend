/**
 * database.ts
 * Inicialização do banco de dados SQLite com sql.js (WebAssembly).
 * Persiste o banco em arquivo .db para manter dados entre execuções.
 *
 * Uso: await getDb() para obter a instância do banco.
 */

import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.resolve(__dirname, '..', 'petlink.db');

// Instância singleton do banco
let dbInstance: Database | null = null;

/**
 * Retorna a instância do banco de dados (singleton).
 * Inicializa e cria as tabelas na primeira chamada.
 */
export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();

  // Carrega banco existente ou cria novo
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    dbInstance = new SQL.Database(fileBuffer);
  } else {
    dbInstance = new SQL.Database();
  }

  // Habilita chaves estrangeiras
  dbInstance.run('PRAGMA foreign_keys = ON;');

  // Cria as tabelas
  await initDatabase(dbInstance);

  return dbInstance;
}

/**
 * Persiste o banco de dados em arquivo.
 * Deve ser chamado após operações de escrita.
 */
export function saveDb(db: Database): void {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

/**
 * Inicializa todas as tabelas do banco de dados.
 */
async function initDatabase(db: Database): Promise<void> {
  db.run(`
    -- =============================================
    -- Entidade 1: Usuário
    -- =============================================
    CREATE TABLE IF NOT EXISTS usuarios (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      nome        TEXT    NOT NULL,
      email       TEXT    NOT NULL UNIQUE,
      senha       TEXT    NOT NULL,
      tipo        TEXT    NOT NULL CHECK(tipo IN ('cliente', 'prestador')),
      telefone    TEXT,
      createdAt   TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    -- =============================================
    -- Entidade 3: Categoria
    -- =============================================
    CREATE TABLE IF NOT EXISTS categorias (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      nome      TEXT    NOT NULL UNIQUE,
      descricao TEXT,
      icone     TEXT
    );

    -- =============================================
    -- Entidade 2: Serviço
    -- =============================================
    CREATE TABLE IF NOT EXISTS servicos (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo      TEXT    NOT NULL,
      descricao   TEXT    NOT NULL,
      preco       REAL    NOT NULL,
      categoria   TEXT    NOT NULL,
      prestadorId INTEGER NOT NULL,
      status      TEXT    NOT NULL DEFAULT 'ativo' CHECK(status IN ('ativo', 'inativo')),
      createdAt   TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (prestadorId) REFERENCES usuarios(id) ON DELETE CASCADE
    );

    -- =============================================
    -- Entidade 6: Endereço
    -- =============================================
    CREATE TABLE IF NOT EXISTS enderecos (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      usuarioId   INTEGER NOT NULL,
      cep         TEXT    NOT NULL,
      logradouro  TEXT    NOT NULL,
      numero      TEXT    NOT NULL,
      bairro      TEXT    NOT NULL,
      cidade      TEXT    NOT NULL,
      FOREIGN KEY (usuarioId) REFERENCES usuarios(id) ON DELETE CASCADE
    );

    -- =============================================
    -- Entidade 4: Pedido/Contrato
    -- =============================================
    CREATE TABLE IF NOT EXISTS pedidos (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      clienteId       INTEGER NOT NULL,
      servicoId       INTEGER NOT NULL,
      dataSolicitacao TEXT    NOT NULL DEFAULT (datetime('now')),
      status          TEXT    NOT NULL DEFAULT 'pendente'
                              CHECK(status IN ('pendente', 'aceito', 'concluido', 'cancelado')),
      valorTotal      REAL    NOT NULL,
      FOREIGN KEY (clienteId) REFERENCES usuarios(id) ON DELETE CASCADE,
      FOREIGN KEY (servicoId) REFERENCES servicos(id) ON DELETE CASCADE
    );

    -- =============================================
    -- Entidade 5: Avaliação
    -- =============================================
    CREATE TABLE IF NOT EXISTS avaliacoes (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      pedidoId      INTEGER NOT NULL UNIQUE,
      nota          INTEGER NOT NULL CHECK(nota BETWEEN 1 AND 5),
      comentario    TEXT,
      dataAvaliacao TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (pedidoId) REFERENCES pedidos(id) ON DELETE CASCADE
    );
  `);

  saveDb(db);
  console.log('✅ Banco de dados inicializado com sucesso!');
}

export default getDb;
