import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getServiceClient } from '@/lib/supabase-service';
import { readSession, createSession } from '@/lib/session';

/**
 * Configuración obligatoria de cuenta (se dispara cuando `must_change_password`
 * es true — ver AccountSetupScreen.tsx). Exige la contraseña actual (la
 * provisional con la que se logueó) y define una contraseña definitiva que solo
 * el dueño conoce, además de permitirle fijar su usuario/email de acceso reales.
 * Una vez completada, la contraseña de fábrica queda inválida para siempre.
 */
export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: 'Sesión no válida' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const currentPassword = typeof body?.currentPassword === 'string' ? body.currentPassword : '';
  const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : '';
  const newUsername = typeof body?.newUsername === 'string' ? body.newUsername.trim().toLowerCase() : '';
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

  if (!currentPassword) {
    return NextResponse.json({ error: 'Ingresa tu contraseña actual' }, { status: 400 });
  }
  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { data: account } = await supabase
    .from('access_accounts')
    .select('id, username, password_hash, role, restaurant_id, display_name')
    .eq('id', session.accountId)
    .maybeSingle();

  if (!account) {
    return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 });
  }

  const validCurrent = await bcrypt.compare(currentPassword, account.password_hash);
  if (!validCurrent) {
    return NextResponse.json({ error: 'La contraseña actual no es correcta' }, { status: 401 });
  }

  const updates: Record<string, unknown> = {
    password_hash: await bcrypt.hash(newPassword, 10),
    must_change_password: false
  };
  if (newUsername && newUsername !== account.username) updates.username = newUsername;
  if (email) updates.email = email;

  const { error: updateErr } = await supabase
    .from('access_accounts')
    .update(updates)
    .eq('id', account.id);

  if (updateErr) {
    const message = updateErr.code === '23505' ? 'Ese nombre de usuario ya está en uso' : 'No se pudo guardar la configuración';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // La cuenta de dueño es la clave maestra: al fijar credenciales definitivas se
  // fuerza el cierre de sesión en el resto de dispositivos, igual que un cambio
  // de contraseña normal — así ningún otro dispositivo se queda con la sesión
  // provisional abierta indefinidamente.
  let nextAuthVersion = session.authVersion;
  if (account.role === 'owner' && account.restaurant_id) {
    nextAuthVersion = (session.authVersion ?? 1) + 1;
    await supabase
      .from('restaurants')
      .update({ auth_version: nextAuthVersion, force_logout_timestamp: Date.now() })
      .eq('id', account.restaurant_id);
  }

  await createSession({
    ...session,
    authVersion: nextAuthVersion,
    mustChangePassword: false
  });

  return NextResponse.json({
    ok: true,
    username: (updates.username as string | undefined) ?? account.username,
    displayName: account.display_name
  });
}
