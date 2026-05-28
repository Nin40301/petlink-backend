/**
 * middleware/auth.ts
 * Middleware de autenticação JWT simples (sem biblioteca externa).
 * Verifica o token Bearer no header Authorization.
 */

import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'petlink-secret-2024';

// =============================================
// JWT manual (sem dependência de jsonwebtoken)
// =============================================

function base64urlEncode(str: string): string {
  return Buffer.from(str).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64urlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64').toString('utf8');
}

import { createHmac } from 'crypto';

function sign(payload: object): string {
  const header = base64urlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body   = base64urlEncode(JSON.stringify(payload));
  const sig    = base64urlEncode(
    createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('binary')
  );
  return `${header}.${body}.${sig}`;
}

function verify(token: string): any | null {
  try {
    const [header, body, sig] = token.split('.');
    const expected = base64urlEncode(
      createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('binary')
    );
    if (sig !== expected) return null;
    const payload = JSON.parse(base64urlDecode(body));
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function createToken(payload: object): string {
  return sign({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 86400 * 7 });
}

export function verifyToken(token: string): any | null {
  return verify(token);
}

// Middleware Express
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Token não fornecido' });
    return;
  }
  const token = authHeader.slice(7);
  const payload = verify(token);
  if (!payload) {
    res.status(401).json({ success: false, message: 'Token inválido ou expirado' });
    return;
  }
  (req as any).user = payload;
  next();
}

export function adminOnly(req: Request, res: Response, next: NextFunction): void {
  const user = (req as any).user;
  if (!user || user.tipo !== 'admin') {
    res.status(403).json({ success: false, message: 'Acesso restrito a administradores' });
    return;
  }
  next();
}
