/**
 * db-utils.ts
 * Utilitários para facilitar o uso do sql.js com interface similar ao better-sqlite3.
 * Converte os resultados do sql.js para arrays de objetos JavaScript.
 */

import { Database, QueryExecResult } from 'sql.js';
import { saveDb } from './database';

/**
 * Executa uma query SELECT e retorna array de objetos.
 */
export function queryAll(db: Database, sql: string, params: any[] = []): any[] {
  const results: QueryExecResult[] = db.exec(sql, params);
  if (!results || results.length === 0) return [];

  const { columns, values } = results[0];
  return values.map(row => {
    const obj: Record<string, any> = {};
    columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

/**
 * Executa uma query SELECT e retorna o primeiro resultado ou null.
 */
export function queryOne(db: Database, sql: string, params: any[] = []): any | null {
  const rows = queryAll(db, sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Executa uma query de escrita (INSERT/UPDATE/DELETE) e persiste o banco.
 * Retorna o lastInsertRowid para INSERTs.
 */
export function execute(db: Database, sql: string, params: any[] = []): number {
  db.run(sql, params);
  const result = queryOne(db, 'SELECT last_insert_rowid() as id');
  saveDb(db);
  return result?.id ?? 0;
}
