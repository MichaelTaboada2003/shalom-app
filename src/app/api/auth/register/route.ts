import { registerUser, getCurrentUser, AuthError } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Only admins can create accounts
export async function POST(request: Request) {
  try {
    const caller = await getCurrentUser();
    if (!caller || caller.role !== 'admin') {
      return NextResponse.json({ error: 'Solo administradores pueden crear cuentas' }, { status: 403 });
    }

    const { email, password, name, role } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, contraseña y nombre son requeridos' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    const user = await registerUser(email, password, name, role || 'member');
    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
