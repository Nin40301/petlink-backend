/**
 * database.ts
 * Inicialização do banco de dados SQLite com sql.js (WebAssembly).
 * Persiste o banco em arquivo .db para manter dados entre execuções.
 */

import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.resolve(__dirname, '..', 'petlink.db');

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    dbInstance = new SQL.Database(fileBuffer);
  } else {
    dbInstance = new SQL.Database();
  }

  dbInstance.run('PRAGMA foreign_keys = ON;');
  await initDatabase(dbInstance);

  return dbInstance;
}

export function saveDb(db: Database): void {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

async function initDatabase(db: Database): Promise<void> {
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      nome        TEXT    NOT NULL,
      email       TEXT    NOT NULL UNIQUE,
      senha       TEXT    NOT NULL,
      tipo        TEXT    NOT NULL CHECK(tipo IN ('cliente', 'prestador', 'admin')),
      telefone    TEXT,
      ativo       INTEGER NOT NULL DEFAULT 1,
      createdAt   TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categorias (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      nome      TEXT    NOT NULL UNIQUE,
      descricao TEXT,
      icone     TEXT
    );

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

    CREATE TABLE IF NOT EXISTS avaliacoes (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      pedidoId      INTEGER NOT NULL UNIQUE,
      nota          INTEGER NOT NULL CHECK(nota BETWEEN 1 AND 5),
      comentario    TEXT,
      dataAvaliacao TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (pedidoId) REFERENCES pedidos(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS carteira (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      usuarioId INTEGER NOT NULL UNIQUE,
      saldo     REAL    NOT NULL DEFAULT 0,
      updatedAt TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (usuarioId) REFERENCES usuarios(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS transacoes (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      usuarioId     INTEGER NOT NULL,
      tipo          TEXT    NOT NULL CHECK(tipo IN ('entrada', 'saida')),
      valor         REAL    NOT NULL,
      descricao     TEXT,
      pedidoId      INTEGER,
      dataTransacao TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (usuarioId) REFERENCES usuarios(id) ON DELETE CASCADE,
      FOREIGN KEY (pedidoId) REFERENCES pedidos(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS pagamentos (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      pedidoId      INTEGER NOT NULL,
      valor         REAL    NOT NULL,
      metodo        TEXT    NOT NULL CHECK(metodo IN ('pix', 'cartao')),
      status        TEXT    NOT NULL DEFAULT 'pendente' CHECK(status IN ('pendente', 'confirmado', 'falhou')),
      dataPagamento TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (pedidoId) REFERENCES pedidos(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS resgates (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      prestadorId     INTEGER NOT NULL,
      valor           REAL    NOT NULL,
      status          TEXT    NOT NULL DEFAULT 'pendente' CHECK(status IN ('pendente', 'aprovado', 'rejeitado', 'enviado')),
      chavePixOuConta TEXT,
      dataRequisicao  TEXT    NOT NULL DEFAULT (datetime('now')),
      dataAprovacao   TEXT,
      FOREIGN KEY (prestadorId) REFERENCES usuarios(id) ON DELETE CASCADE
    );
  `);

  saveDb(db);
  console.log('✅ Banco de dados inicializado com sucesso!');
}

export default getDb;
