import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getServiceClient } from '@/lib/supabase-service';
import { createSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const username = typeof body?.username === 'string' ? body.username.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!username || !password) {
    return NextResponse.json({ error: 'Usuario y contraseña son requeridos' }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { data: account } = await supabase
    .from('access_accounts')
    .select('id, username, display_name, role, password_hash, active, restaurant_id, must_change_password')
    .eq('username', username)
    .maybeSingle();

  if (!account || !account.active) {
    return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 });
  }

  const validPassword = await bcrypt.compare(password, account.password_hash);
  if (!validPassword) {
    return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 });
  }

  const { data: restaurantRow } = await supabase
    .from('restaurants')
    .select('auth_version')
    .eq('id', account.restaurant_id)
    .maybeSingle();

  const authVersion = restaurantRow?.auth_version ?? 1;
  const mustChangePassword = Boolean(account.must_change_password);

  await createSession({
    accountId: account.id,
    role: account.role,
    displayName: account.display_name,
    restaurantId: account.restaurant_id,
    authVersion,
    mustChangePassword
  });

  return NextResponse.json({
    accountId: account.id,
    role: account.role,
    displayName: account.display_name,
    restaurantId: account.restaurant_id,
    mustChangePassword
  });
}
