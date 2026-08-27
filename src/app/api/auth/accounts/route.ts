import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getServiceClient } from '@/lib/supabase-service';
import { readSession } from '@/lib/session';

/** Gestión de cuentas de acceso (Nivel 1: dueño + cuentas de turno/gerencia). Solo el dueño. */

export async function GET() {
  const session = await readSession();
  if (!session || session.role !== 'owner' || !session.restaurantId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('access_accounts')
    .select('id, username, display_name, role, active, created_at')
    .eq('restaurant_id', session.restaurantId)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'No se pudieron cargar las cuentas' }, { status: 500 });
  }

  return NextResponse.json({ accounts: data ?? [] });
}

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session || session.role !== 'owner' || !session.restaurantId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const username = typeof body?.username === 'string' ? body.username.trim().toLowerCase() : '';
  const displayName = typeof body?.displayName === 'string' ? body.displayName.trim() : '';
  const role = typeof body?.role === 'string' ? body.role : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!username || !displayName || !role || password.length < 6) {
    return NextResponse.json(
      { error: 'Usuario, nombre, rol y una contraseña de al menos 6 caracteres son requeridos' },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();
  const passwordHash = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from('access_accounts')
    .insert({
      restaurant_id: session.restaurantId,
      username,
      display_name: displayName,
      role,
      password_hash: passwordHash,
      active: true
    })
    .select('id, username, display_name, role, active, created_at')
    .single();

  if (error) {
    const message = error.code === '23505' ? 'Ese nombre de usuario ya existe' : 'No se pudo crear la cuenta';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ account: data });
}
