import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDb } from './db';
import { cookies } from 'next/headers';

export type UserRole = 'admin' | 'leader' | 'member';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
}

const JWT_SECRET = process.env.JWT_SECRET!;
const TOKEN_NAME = 'shalom-token';
const TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createToken(user: AuthUser): string {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name, role: user.role } satisfies JwtPayload,
    JWT_SECRET,
    { expiresIn: TOKEN_MAX_AGE }
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return { id: payload.sub, email: payload.email, name: payload.name, role: payload.role };
  } catch {
    return null;
  }
}

/** Get current user from cookie (server components / route handlers) */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Set auth cookie */
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: TOKEN_MAX_AGE,
    path: '/',
  });
}

/** Clear auth cookie */
export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_NAME);
}

/** Require auth — returns user or throws */
export async function requireAuth(allowedRoles?: UserRole[]): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError('No autenticado', 401);
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new AuthError('Sin permisos', 403);
  }
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Register a new user */
export async function registerUser(email: string, password: string, name: string, role: UserRole = 'member') {
  const sql = getDb();
  const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`;
  if (existing.length > 0) throw new AuthError('El email ya está registrado', 409);

  const passwordHash = await hashPassword(password);
  const rows = await sql`
    INSERT INTO users (email, password_hash, name, role)
    VALUES (${email.toLowerCase()}, ${passwordHash}, ${name}, ${role})
    RETURNING id, email, name, role
  `;
  return rows[0] as AuthUser;
}

/** Login */
export async function loginUser(email: string, password: string): Promise<{ user: AuthUser; token: string }> {
  const sql = getDb();
  const rows = await sql`SELECT id, email, name, role, password_hash, active FROM users WHERE email = ${email.toLowerCase()}`;
  if (rows.length === 0) throw new AuthError('Credenciales inválidas', 401);

  const user = rows[0];
  if (!user.active) throw new AuthError('Cuenta desactivada', 403);

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) throw new AuthError('Credenciales inválidas', 401);

  await sql`UPDATE users SET last_login = now() WHERE id = ${user.id}`;

  const authUser: AuthUser = { id: user.id, email: user.email, name: user.name, role: user.role };
  const token = createToken(authUser);
  return { user: authUser, token };
}
