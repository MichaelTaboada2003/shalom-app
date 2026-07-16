import { AuthError, createToken, hashPassword, requireAuth, setAuthCookie, verifyPassword, type AuthUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function PATCH(request: Request) {
  try {
    const currentUser = await requireAuth();
    const body = await request.json() as Record<string, unknown>;
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
    const confirmPassword = typeof body.confirmPassword === 'string' ? body.confirmPassword : '';

    if (!name) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'El correo no es válido' }, { status: 400 });

    const passwordChangeRequested = Boolean(currentPassword || newPassword || confirmPassword);
    const sql = getDb();
    const currentRows = await sql`SELECT password_hash FROM users WHERE id = ${currentUser.id}`;
    if (!currentRows[0]) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    const duplicateEmail = await sql`SELECT id FROM users WHERE email = ${email} AND id <> ${currentUser.id}`;
    if (duplicateEmail[0]) return NextResponse.json({ error: 'Ese correo ya está en uso' }, { status: 409 });

    let passwordHash: string | null = null;
    if (passwordChangeRequested) {
      if (!currentPassword || !newPassword || !confirmPassword) return NextResponse.json({ error: 'Completa los tres campos de contraseña' }, { status: 400 });
      if (!await verifyPassword(currentPassword, currentRows[0].password_hash)) return NextResponse.json({ error: 'La contraseña actual no es correcta' }, { status: 400 });
      if (newPassword.length < 6) return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' }, { status: 400 });
      if (newPassword !== confirmPassword) return NextResponse.json({ error: 'Las nuevas contraseñas no coinciden' }, { status: 400 });
      passwordHash = await hashPassword(newPassword);
    }

    const rows = passwordHash
      ? await sql`UPDATE users SET name = ${name}, email = ${email}, password_hash = ${passwordHash} WHERE id = ${currentUser.id} RETURNING id, email, name, role`
      : await sql`UPDATE users SET name = ${name}, email = ${email} WHERE id = ${currentUser.id} RETURNING id, email, name, role`;
    const user = rows[0] as AuthUser;
    const token = createToken(user);
    await setAuthCookie(token);

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'No fue posible actualizar el perfil' }, { status: 500 });
  }
}
