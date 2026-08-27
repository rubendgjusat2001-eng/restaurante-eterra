import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getServiceClient } from '@/lib/supabase-service';
import { readSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: 'Sesión no válida' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const currentPassword = typeof body?.currentPassword === 'string' ? body.currentPassword : '';
  const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : '';

  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { data: account } = await supabase
    .from('access_accounts')
    .select('id, password_hash, role, restaurant_id')
    .eq('id', session.accountId)
    .maybeSingle();

  if (!account) {
    return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 });
  }

  const validCurrent = await bcrypt.compare(currentPassword, account.password_hash);
  if (!validCurrent) {
    return NextResponse.json({ error: 'La contraseña actual no es correcta' }, { status: 401 });
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  const { error: updateErr } = await supabase
    .from('access_accounts')
    .update({ password_hash: newHash })
    .eq('id', account.id);

  if (updateErr) {
    return NextResponse.json({ error: 'No se pudo actualizar la contraseña' }, { status: 500 });
  }

  // La cuenta de dueño es la clave maestra: cambiarla fuerza el cierre de sesión
  // en todos los demás dispositivos, igual que el comportamiento original del sistema.
  if (account.role === 'owner' && account.restaurant_id) {
    await supabase
      .from('restaurants')
      .update({ auth_version: (session.authVersion ?? 1) + 1, force_logout_timestamp: Date.now() })
      .eq('id', account.restaurant_id);
  }

  return NextResponse.json({ ok: true });
}
